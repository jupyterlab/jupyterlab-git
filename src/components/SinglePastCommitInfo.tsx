import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { LabIcon, fileIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
import { classes } from 'typestyle/';

import { isDiffSupported } from './diff/Diff';
import { openDiffView } from './diff/DiffWidget';
import { deletionsIcon, insertionsIcon } from '../icons';
import { GitExtension } from '../model';
import { ResetDeleteSingleCommit } from './ResetDeleteSingleCommit';
import {
  changeStageButtonStyle,
  discardFileButtonStyle
} from '../style/GitStageStyle';
import {
  commitDetailFilePathStyle,
  commitDetailFileStyle,
  commitDetailFileInnerStyle,
  commitDetailHeader,
  commitDetailStyle,
  commitOverviewNumbers,
  commitStyle,
  diffIconStyle,
  fileList,
  floatRightStyle,
  iconStyle,
  insertionsIconStyle,
  deletionsIconStyle,
  revertButtonStyle
} from '../style/SinglePastCommitInfoStyle';
import { Git } from '../tokens';

export interface ISinglePastCommitInfoProps {
  data: Git.ISingleCommitInfo;
  model: GitExtension;
  renderMime: IRenderMimeRegistry;
}

export interface ISinglePastCommitInfoState {
  displayDelete: boolean;
  displayReset: boolean;
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
      displayDelete: false,
      displayReset: false,
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
        `Error while gettting detailed log for commit ${this.props.data.commit} and path ${this.props.model.pathRepository}`,
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

  showDeleteCommit = () => {
    this.setState({
      displayDelete: true,
      displayReset: false
    });
  };

  hideDeleteCommit = () => {
    this.setState({
      displayDelete: false
    });
  };

  showResetToCommit = () => {
    this.setState({
      displayReset: true,
      displayDelete: false
    });
  };

  hideResetToCommit = () => {
    this.setState({
      displayReset: false
    });
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
            <span>
              <fileIcon.react
                className={iconStyle}
                tag="span"
                title="# Files Changed"
              />
              {this.state.filesChanged}
            </span>
            <span>
              <insertionsIcon.react
                className={classes(iconStyle, insertionsIconStyle)}
                tag="span"
                title="# Insertions"
              />
              {this.state.insertionCount}
            </span>
            <span>
              <deletionsIcon.react
                className={classes(iconStyle, deletionsIconStyle)}
                tag="span"
                title="# Deletions"
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
              onClick={this.showDeleteCommit}
              title="Discard changes introduced by this commit"
            />
            <button
              className={classes(
                changeStageButtonStyle,
                floatRightStyle,
                revertButtonStyle
              )}
              onClick={this.showResetToCommit}
              title="Discard changes introduced *after* this commit"
            />
          </div>
          <div>
            {this.state.displayDelete && (
              <ResetDeleteSingleCommit
                action="delete"
                commitId={this.props.data.commit}
                model={this.props.model}
                onCancel={this.hideDeleteCommit}
              />
            )}
            {this.state.displayReset && (
              <ResetDeleteSingleCommit
                action="reset"
                commitId={this.props.data.commit}
                model={this.props.model}
                onCancel={this.hideResetToCommit}
              />
            )}
          </div>
          <ul className={fileList}>
            {this.state.modifiedFiles.length > 0 &&
              this.state.modifiedFiles.map(
                (modifiedFile, modifiedFileIndex) => {
                  const {
                    ft,
                    modified_file_name,
                    modified_file_path
                  } = modifiedFile;
                  return (
                    <li
                      className={commitDetailFileStyle}
                      key={modifiedFileIndex}
                    >
                      <span
                        className={commitDetailFileInnerStyle}
                        onDoubleClick={() => {
                          window.open(
                            'https://github.com/search?q=' +
                              this.props.data.commit +
                              '&type=Commits&utf8=%E2%9C%93'
                          );
                        }}
                      >
                        <LabIcon.resolveReact
                          icon={ft?.icon}
                          iconClass={classes(ft?.iconClass, 'jp-Icon')}
                          elementPosition="center"
                          tag="span"
                        />
                        <span className={commitDetailFilePathStyle}>
                          {modified_file_name}
                        </span>
                      </span>
                      {isDiffSupported(modified_file_path) && (
                        <button
                          className={`${diffIconStyle}`}
                          title={'View file changes'}
                          onClick={async () => {
                            await openDiffView(
                              modified_file_path,
                              this.props.model,
                              {
                                previousRef: {
                                  gitRef: this.props.data.pre_commit
                                },
                                currentRef: { gitRef: this.props.data.commit }
                              },
                              this.props.renderMime
                            );
                          }}
                        />
                      )}
                    </li>
                  );
                }
              )}
          </ul>
        </div>
      </div>
    );
  }
}
