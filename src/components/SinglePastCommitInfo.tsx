import { JupyterLab } from '@jupyterlab/application';

import { Git, SingleCommitInfo, CommitModifiedFile } from '../git';

import { parseFileExtension } from './FileList';

import { ResetDeleteSingleCommit } from './ResetDeleteSingleCommit';

import {
  commitStyle,
  commitOverviewNumbers,
  commitDetailStyle,
  commitDetailHeader,
  commitDetailFileStyle,
  commitDetailFilePathStyle,
  iconStyle,
  insertionIconStyle,
  numberofChangedFilesStyle,
  floatRightStyle,
  deletionIconStyle,
  revertButtonStyle
} from '../componentsStyle/SinglePastCommitInfoStyle';

import {
  changeStageButtonStyle,
  discardFileButtonStyle
} from '../componentsStyle/GitStageStyle';

import { fileIconStyle } from '../componentsStyle/FileItemStyle';

import * as React from 'react';

import { classes } from 'typestyle/';

export interface ISinglePastCommitInfoProps {
  topRepoPath: string;
  data: SingleCommitInfo;
  app: JupyterLab;
  diff: any;
  refresh: Function;
  currentTheme: string;
}

export interface ISinglePastCommitInfoState {
  displayDelete: boolean;
  displayReset: boolean;
  info: string;
  filesChanged: string;
  insertionCount: string;
  deletionCount: string;
  list: Array<CommitModifiedFile>;
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
      info: "",
      filesChanged: "",
      insertionCount: "",
      deletionCount: "",
      list: [],
    
    };
    this.showPastCommitWork();
  }

  showPastCommitWork = async () => {
    let gitApi = new Git();
    let detailedLogData = await gitApi.detailedLog(this.props.data.commit, this.props.topRepoPath);
    if (detailedLogData.code === 0) {
      this.setState({
        info: detailedLogData.modified_file_note,
        filesChanged: detailedLogData.modified_files_count,
        insertionCount: detailedLogData.number_of_insertions,
        deletionCount: detailedLogData.number_of_deletions,
        list: detailedLogData.modified_files
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
    return (
      <div>
        <div className={commitStyle}>
          <div className={commitOverviewNumbers}>
            <span>
              <span className={classes(iconStyle, numberofChangedFilesStyle)} />
              {this.state.filesChanged}
            </span>
            <span>
              <span
                className={classes(
                  iconStyle,
                  insertionIconStyle(this.props.currentTheme)
                )}
              />
              {this.state.insertionCount}
            </span>
            <span>
              <span
                className={classes(
                  iconStyle,
                  deletionIconStyle(this.props.currentTheme)
                )}
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
                discardFileButtonStyle(this.props.currentTheme)
              )}
              onClick={this.showDeleteCommit}
            />
            <button
              className={classes(
                changeStageButtonStyle,
                floatRightStyle,
                revertButtonStyle(this.props.currentTheme)
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
          {this.state.list.length > 0 &&
            this.state.list.map((modifiedFile, modifiedFileIndex) => {
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
                  <span
                    className={commitDetailFilePathStyle}
                    onDoubleClick={() => {
                      this.props.diff(
                        this.props.app,
                        modifiedFile.modified_file_path,
                        this.props.data.commit,
                        this.props.data.pre_commit
                      );
                    }}
                  >
                    {modifiedFile.modified_file_name}
                  </span>
                </li>
              );
            })}
        </div>
      </div>
    );
  }
}
