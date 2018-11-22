import { JupyterLab } from '@jupyterlab/application';

import { FileList } from './FileList';

import { SinglePastCommitInfo } from './SinglePastCommitInfo';

import { pastCommitsContainerStyle } from '../componentsStyle/PastCommitsStyle';

import * as React from 'react';

/** Interface for PastCommits component props */
export interface IPastCommitsProps {
  currentFileBrowserPath: string;
  topRepoPath: string;
  pastCommits: any;
  inNewRepo: boolean;
  showList: boolean;
  stagedFiles: any;
  unstagedFiles: any;
  untrackedFiles: any;
  app: JupyterLab;
  refresh: any;
  diff: any;
  pastCommitInfo: string;
  pastCommitFilesChanged: string;
  pastCommitInsertionCount: string;
  pastCommitDeletionCount: string;
  pastCommitData: any;
  pastCommitNumber: any;
  pastCommitFilelist: any;
  sideBarExpanded: boolean;
  currentTheme: string;
}

export class PastCommits extends React.Component<IPastCommitsProps, {}> {
  constructor(props: IPastCommitsProps) {
    super(props);
  }

  render() {
    if (this.props.sideBarExpanded) {
      return null;
    }
    return (
      <div className={pastCommitsContainerStyle}>
        {!this.props.showList && (
          <SinglePastCommitInfo
            topRepoPath={this.props.topRepoPath}
            num={this.props.pastCommitNumber}
            data={this.props.pastCommitData}
            info={this.props.pastCommitInfo}
            filesChanged={this.props.pastCommitFilesChanged}
            insertionCount={this.props.pastCommitInsertionCount}
            deletionCount={this.props.pastCommitDeletionCount}
            list={this.props.pastCommitFilelist}
            app={this.props.app}
            diff={this.props.diff}
            display={!this.props.showList}
            currentTheme={this.props.currentTheme}
            refresh={this.props.refresh}
          />
        )}
        <FileList
          currentFileBrowserPath={this.props.currentFileBrowserPath}
          topRepoPath={this.props.topRepoPath}
          stagedFiles={this.props.stagedFiles}
          unstagedFiles={this.props.unstagedFiles}
          untrackedFiles={this.props.untrackedFiles}
          app={this.props.app}
          refresh={this.props.refresh}
          sideBarExpanded={this.props.sideBarExpanded}
          display={this.props.showList}
          currentTheme={this.props.currentTheme}
        />
      </div>
    );
  }
}
