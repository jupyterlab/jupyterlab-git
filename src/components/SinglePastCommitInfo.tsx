import { JupyterLab } from '@jupyterlab/application';

import { SingleCommitInfo, CommitModifiedFile } from '../git';

import { parseFileExtension } from './FileList';

import { ResetDeleteSingleCommit } from './ResetDeleteSingleCommit';

import {
  commitStyle,
  commitNumberLabelStyle,
  commitAuthorLabelStyle,
  commitAuthorIconStyle,
  commitLabelDateStyle,
  commitLabelMessageStyle,
  commitOverviewNumbers,
  commitDetailStyle,
  commitDetailHeader,
  commitDetailFileStyle,
  commitDetailFilePathStyle,
  iconStyle,
  insertionIconStyle,
  numberofChangedFilesStyle,
  deletionIconStyle,
  revertButtonStyle
} from '../components_style/SinglePastCommitInfoStyle';

import {
  changeStageButtonStyle,
  discardFileButtonStyle
} from '../components_style/GitStageStyle';

import { fileIconStyle } from '../components_style/FileItemStyle';

import * as React from 'react';

import { classes } from 'typestyle/';

export interface ISinglePastCommitInfoProps {
  topRepoPath: string;
  num: string;
  data: SingleCommitInfo;
  info: string;
  filesChanged: string;
  insertionCount: string;
  deletionCount: string;
  list: [CommitModifiedFile];
  app: JupyterLab;
  diff: any;
  display: boolean;
  refresh: Function;
  currentTheme: string;
}

export interface ISinglePastCommitInfoState {
  displayDelete: boolean;
  displayReset: boolean;
}

export class SinglePastCommitInfo extends React.Component<
  ISinglePastCommitInfoProps,
  ISinglePastCommitInfoState
> {
  constructor(props: ISinglePastCommitInfoProps) {
    super(props);
    this.state = {
      displayDelete: false,
      displayReset: false
    };
  }

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
          <div>
            <div className={commitAuthorLabelStyle}>
              <span className={commitAuthorIconStyle} />
              {this.props.data.author}
            </div>
            <div className={commitLabelDateStyle}>{this.props.data.date}</div>
            <span className={commitNumberLabelStyle}>
              #{this.props.data.commit
                ? this.props.data.commit.substring(0, 7)
                : ''}
            </span>
          </div>
          <div className={commitLabelMessageStyle}>
            {this.props.data.commit_msg}
          </div>
          <div className={commitOverviewNumbers}>
            <span>
              <span className={classes(iconStyle, numberofChangedFilesStyle)} />
              {this.props.filesChanged}
            </span>
            <span>
              <span
                className={classes(
                  iconStyle,
                  insertionIconStyle(this.props.currentTheme)
                )}
              />
              {this.props.insertionCount}
            </span>
            <span>
              <span
                className={classes(
                  iconStyle,
                  deletionIconStyle(this.props.currentTheme)
                )}
              />
              {this.props.deletionCount}
            </span>
          </div>
        </div>
        <div className={commitDetailStyle}>
          <div className={commitDetailHeader}>
            Changed
            <button
              className={classes(
                changeStageButtonStyle,
                discardFileButtonStyle(this.props.currentTheme)
              )}
              onClick={this.showDeleteCommit}
            />
            <button
              className={classes(
                changeStageButtonStyle,
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
          {this.props.list.length > 0 &&
            this.props.list.map((modifiedFile, modifiedFileIndex) => {
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
