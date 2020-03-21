import * as React from 'react';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { DefaultIconReact } from '@jupyterlab/ui-components';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import {
  commitDetailFileStyle,
  commitDetailHeader,
  commitDetailStyle,
  commitOverviewNumbers,
  commitStyle,
  deletionsIconStyle,
  fileList,
  iconStyle,
  insertionsIconStyle
} from '../style/SinglePastCommitInfoStyle';
import { Git } from '../tokens';
import { isDiffSupported } from './diff/Diff';
import { openDiffView } from './diff/DiffWidget';
import { ResetRevertDialog } from './ResetRevertDialog';
import { FilePath } from './FilePath';
import { ActionButton } from './ActionButton';

export interface ISinglePastCommitInfoProps {
  data: Git.ISingleCommitInfo;
  model: GitExtension;
  renderMime: IRenderMimeRegistry;
}

export interface ISinglePastCommitInfoState {
  info: string;
  filesChanged: string;
  insertionCount: string;
  deletionCount: string;
  modifiedFiles: Git.ICommitModifiedFile[];
  loadingState: 'loading' | 'error' | 'success';
  resetRevertDialog: boolean;
  resetRevertAction: 'reset' | 'revert';
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
      loadingState: 'loading',
      resetRevertDialog: false,
      resetRevertAction: 'reset'
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
            <ActionButton
              iconName="git-rewind"
              title="Revert changes introduced by this commit"
              onClick={this._onRevertClick}
            />
            <ActionButton
              iconName="git-discard"
              title="Discard changes introduced *after* this commit (hard reset)"
              onClick={this._onResetClick}
            />
            <ResetRevertDialog
              open={this.state.resetRevertDialog}
              action={this.state.resetRevertAction}
              model={this.props.model}
              commit={this.props.data}
              onClose={this._onResetRevertDialogClose}
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
                        try {
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
                        } catch (reason) {
                          console.error(
                            `Fail to open diff view for ${
                              modifiedFile.modified_file_path
                            }.\n${reason}`
                          );
                        }
                      }
                    }}
                    title={modifiedFile.modified_file_path}
                  >
                    <FilePath filepath={modifiedFile.modified_file_path} />
                    {diffSupported && (
                      <ActionButton
                        iconName={'git-diff'}
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

  /**
   * Callback invoked upon a clicking a button to revert changes.
   *
   * @param event - event object
   */
  private _onRevertClick = (event: any): void => {
    event.stopPropagation();
    this.setState({
      resetRevertDialog: true,
      resetRevertAction: 'revert'
    });
  };

  /**
   * Callback invoked upon a clicking a button to reset changes.
   *
   * @param event - event object
   */
  private _onResetClick = (event: any): void => {
    event.stopPropagation();
    this.setState({
      resetRevertDialog: true,
      resetRevertAction: 'reset'
    });
  };

  /**
   * Callback invoked upon closing a dialog to reset or revert changes.
   *
   * @param event - event object
   */
  private _onResetRevertDialogClose = (): void => {
    this.setState({
      resetRevertDialog: false
    });
  };
}
