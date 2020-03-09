import * as React from 'react';
import { Dialog, InputDialog, showDialog } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { DefaultIconReact } from '@jupyterlab/ui-components';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import { fileIconStyle } from '../style/FileItemStyle';
import {
  changeStageButtonStyle,
  discardFileButtonStyle
} from '../style/GitStageStyle';
import {
  commitDetailFilePathStyle,
  commitDetailFileStyle,
  commitDetailHeader,
  commitDetailStyle,
  commitOverviewNumbers,
  commitStyle,
  deletionsIconStyle,
  diffIconStyle,
  fileList,
  floatRightStyle,
  iconStyle,
  insertionsIconStyle,
  revertButtonStyle
} from '../style/SinglePastCommitInfoStyle';
import { Git } from '../tokens';
import { parseFileExtension } from '../utils';
import { isDiffSupported } from './diff/Diff';
import { openDiffView } from './diff/DiffWidget';

export interface ISinglePastCommitInfoProps {
  data: Git.ISingleCommitInfo;
  model: GitExtension;
  refreshHistory: () => Promise<void>;
  renderMime: IRenderMimeRegistry;
}

export interface ISinglePastCommitInfoState {
  info: string;
  filesChanged: string;
  insertionCount: string;
  deletionCount: string;
  modifiedFiles: Git.ICommitModifiedFile[];
  loadingState: 'loading' | 'error' | 'success';
}

export class SinglePastCommitInfo extends React.Component<
  ISinglePastCommitInfoProps,
  ISinglePastCommitInfoState
> {
  constructor(props: ISinglePastCommitInfoProps) {
    super(props);
    this.state = {
      info: '',
      filesChanged: '',
      insertionCount: '',
      deletionCount: '',
      modifiedFiles: [],
      loadingState: 'loading'
    };
    this.showPastCommitWork();
  }

  showPastCommitWork = async () => {
    let detailedLogData: Git.ISingleCommitFilePathInfo;
    try {
      detailedLogData = await this.props.model.detailedLog(
        this.props.data.commit
      );
    } catch (err) {
      console.error(
        `Error while getting detailed log for commit ${
          this.props.data.commit
        } and path ${this.props.model.pathRepository}`,
        err
      );
      this.setState(() => ({ loadingState: 'error' }));
      return;
    }
    if (detailedLogData.code === 0) {
      this.setState({
        info: detailedLogData.modified_file_note,
        filesChanged: detailedLogData.modified_files_count,
        insertionCount: detailedLogData.number_of_insertions,
        deletionCount: detailedLogData.number_of_deletions,
        modifiedFiles: detailedLogData.modified_files,
        loadingState: 'success'
      });
    }
  };

  deleteCommit = async (commitId: string) => {
    const result = await InputDialog.getText({
      title: 'Delete Commit',
      placeholder: 'Deletion Commit Message',
      okLabel: 'Delete'
    });
    if (result.button.accept) {
      const msg = result.value;
      await this.props.model.deleteCommit(msg, commitId);
      await this.props.refreshHistory();
    }
  };

  resetToCommit = async (commitId: string) => {
    const shortCommit = commitId.slice(0, 7);
    const result = await showDialog({
      title: 'Reset to Commit',
      body: `All changes after commit ${shortCommit} will be gone forever. Confirm you want to reset to it?`,
      buttons: [
        Dialog.cancelButton(),
        Dialog.warnButton({
          accept: true,
          label: 'Reset'
        })
      ]
    });

    if (result.button.accept) {
      await this.props.model.resetToCommit(commitId);
      await this.props.refreshHistory();
    }
  };

  render() {
    if (this.state.loadingState === 'loading') {
      return <div>...</div>;
    }
    if (this.state.loadingState === 'error') {
      return <div>Error loading commit data</div>;
    }
    return (
      <div>
        <div className={commitStyle}>
          <div className={commitOverviewNumbers}>
            <span title="# Files Changed">
              <DefaultIconReact name="file" className={iconStyle} tag="span" />
              {this.state.filesChanged}
            </span>
            <span title="# Insertions">
              <DefaultIconReact
                name="git-insertionsMade"
                className={classes(iconStyle, insertionsIconStyle)}
                tag="span"
              />
              {this.state.insertionCount}
            </span>
            <span title="# Deletions">
              <DefaultIconReact
                name="git-deletionsMade"
                className={classes(iconStyle, deletionsIconStyle)}
                tag="span"
              />
              {this.state.deletionCount}
            </span>
          </div>
        </div>
        <div className={commitDetailStyle}>
          <div className={commitDetailHeader}>
            Changed
            <button
              className={classes(
                changeStageButtonStyle,
                floatRightStyle,
                discardFileButtonStyle
              )}
              onClick={(
                event: React.MouseEvent<HTMLButtonElement, MouseEvent>
              ) => {
                event.stopPropagation();
                this.deleteCommit(this.props.data.commit);
              }}
              title="Discard changes introduced by this commit"
            />
            <button
              className={classes(
                changeStageButtonStyle,
                floatRightStyle,
                revertButtonStyle
              )}
              onClick={(
                event: React.MouseEvent<HTMLButtonElement, MouseEvent>
              ) => {
                event.stopPropagation();
                this.resetToCommit(this.props.data.commit);
              }}
              title="Discard changes introduced *after* this commit"
            />
          </div>
          <ul className={fileList}>
            {this.state.modifiedFiles.length > 0 &&
              this.state.modifiedFiles.map(modifiedFile => {
                const diffSupported = isDiffSupported(
                  modifiedFile.modified_file_path
                );

                return (
                  <li
                    className={commitDetailFileStyle}
                    key={modifiedFile.modified_file_path}
                    onClick={async (
                      event: React.MouseEvent<HTMLLIElement, MouseEvent>
                    ) => {
                      // Avoid commit node to be collapsed
                      event.stopPropagation();
                      if (diffSupported) {
                        await openDiffView(
                          modifiedFile.modified_file_path,
                          this.props.model,
                          {
                            previousRef: {
                              gitRef: this.props.data.pre_commit
                            },
                            currentRef: { gitRef: this.props.data.commit }
                          },
                          this.props.renderMime
                        );
                      }
                    }}
                    title={modifiedFile.modified_file_path}
                  >
                    <span
                      className={`${fileIconStyle} ${parseFileExtension(
                        modifiedFile.modified_file_path
                      )}`}
                    />
                    <span className={commitDetailFilePathStyle}>
                      {modifiedFile.modified_file_name}
                    </span>
                    {diffSupported && (
                      <button
                        className={diffIconStyle}
                        title={'View file changes'}
                      />
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    );
  }
}
