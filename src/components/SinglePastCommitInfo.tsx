import { JupyterFrontEnd } from '@jupyterlab/application';
import * as React from 'react';
import { classes } from 'typestyle/';
import { fileIconStyle } from '../componentsStyle/FileItemStyle';
import {
  changeStageButtonStyle,
  discardFileButtonStyle
} from '../componentsStyle/GitStageStyle';
import {
  commitDetailFilePathStyle,
  commitDetailFileStyle,
  commitDetailHeader,
  commitDetailStyle,
  commitOverviewNumbers,
  commitStyle,
  deletionIconStyle,
  diffIconStyle,
  floatRightStyle,
  iconStyle,
  insertionIconStyle,
  numberofChangedFilesStyle,
  revertButtonStyle
} from '../componentsStyle/SinglePastCommitInfoStyle';
import {
  ICommitModifiedFile,
  Git,
  ISingleCommitInfo,
  IDiffCallback
} from '../git';
import { parseFileExtension } from './FileList';
import { ResetDeleteSingleCommit } from './ResetDeleteSingleCommit';
import { openDiffView } from './diff/DiffWidget';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { isDiffSupported } from './diff/Diff';

export interface ISinglePastCommitInfoProps {
  topRepoPath: string;
  data: ISingleCommitInfo;
  app: JupyterFrontEnd;
  diff: IDiffCallback;
  renderMime: IRenderMimeRegistry;

  refresh: () => void;
}

export interface ISinglePastCommitInfoState {
  displayDelete: boolean;
  displayReset: boolean;
  info: string;
  filesChanged: string;
  insertionCount: string;
  deletionCount: string;
  modifiedFiles: Array<ICommitModifiedFile>;
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
    let gitApi = new Git();
    let detailedLogData;
    try {
      detailedLogData = await gitApi.detailedLog(
        this.props.data.commit,
        this.props.topRepoPath
      );
    } catch (err) {
      console.error(
        `Error while gettting detailed log for commit ${
          this.props.data.commit
        } and path ${this.props.topRepoPath}`,
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
              <span className={classes(iconStyle, numberofChangedFilesStyle)} />
              {this.state.filesChanged}
            </span>
            <span>
              <span className={classes(iconStyle, insertionIconStyle)} />
              {this.state.insertionCount}
            </span>
            <span>
              <span className={classes(iconStyle, deletionIconStyle)} />
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
            />
            <button
              className={classes(
                changeStageButtonStyle,
                floatRightStyle,
                revertButtonStyle
              )}
              onClick={this.showResetToCommit}
            />
          </div>
          <div>
            {this.state.displayDelete && (
              <ResetDeleteSingleCommit
                action="delete"
                commitId={this.props.data.commit}
                path={this.props.topRepoPath}
                onCancel={this.hideDeleteCommit}
                refresh={this.props.refresh}
              />
            )}
            {this.state.displayReset && (
              <ResetDeleteSingleCommit
                action="reset"
                commitId={this.props.data.commit}
                path={this.props.topRepoPath}
                onCancel={this.hideResetToCommit}
                refresh={this.props.refresh}
              />
            )}
          </div>
          {this.state.modifiedFiles.length > 0 &&
            this.state.modifiedFiles.map((modifiedFile, modifiedFileIndex) => {
              return (
                <li className={commitDetailFileStyle} key={modifiedFileIndex}>
                  <span
                    className={`${fileIconStyle} ${parseFileExtension(
                      modifiedFile.modified_file_path
                    )}`}
                    onDoubleClick={() => {
                      window.open(
                        'https://github.com/search?q=' +
                          this.props.data.commit +
                          '&type=Commits&utf8=%E2%9C%93'
                      );
                    }}
                  />
                  <span className={commitDetailFilePathStyle}>
                    {modifiedFile.modified_file_name}
                  </span>
                  {isDiffSupported(modifiedFile.modified_file_path) && (
                    <button
                      className={`${diffIconStyle}`}
                      title={'View file changes'}
                      onClick={async () => {
                        await openDiffView(
                          modifiedFile.modified_file_path,
                          this.props.app,
                          {
                            previousRef: { gitRef: this.props.data.pre_commit },
                            currentRef: { gitRef: this.props.data.commit }
                          },
                          this.props.renderMime,
                          this.props.topRepoPath
                        );
                      }}
                    />
                  )}
                </li>
              );
            })}
        </div>
      </div>
    );
  }
}
