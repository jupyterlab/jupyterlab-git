import * as React from 'react';

import ToggleDisplay from 'react-toggle-display';

import { JupyterLab } from '@jupyterlab/application';

import {
  Git,
  GitBranchResult,
  GitStatusResult,
  GitShowTopLevelResult,
  GitAllHistory,
  GitLogResult,
  SingleCommitInfo
} from '../git';

import { PathHeader } from './PathHeader';

import { BranchHeader } from './BranchHeader';

import { PastCommits } from './PastCommits';

import { HistorySideBar } from './HistorySideBar';

import {
  panelContainerStyle,
  panelPushedContentStyle,
  panelContentStyle,
  panelWarningStyle,
  findRepoButtonStyle,
} from '../components_style/GitPanelStyle';

import { classes } from 'typestyle';

/** Interface for GitPanel component state */
export interface IGitSessionNodeState {
  currentFileBrowserPath: string;
  topRepoPath: string;
  showWarning: boolean;

  branches: any;
  currentBranch: string;
  disableSwitchBranch: boolean;

  pastCommits: any;
  inNewRepo: boolean;
  showList: boolean;

  stagedFiles: any;
  unstagedFiles: any;
  untrackedFiles: any;

  sideBarExpanded: boolean;

  pastCommitInfo: string;
  pastCommitFilesChanged: string;
  pastCommitInsertionCount: string;
  pastCommitDeletionCount: string;
  pastCommitData: any;
  pastCommitNumber: any;
  pastCommitFilelist: any;
}

/** Interface for GitPanel component props */
export interface IGitSessionNodeProps {
  app: JupyterLab;
  diff: any;
}

/** A React component for the git extension's main display */
export class GitPanel extends React.Component<
  IGitSessionNodeProps,
  IGitSessionNodeState
> {
  constructor(props: IGitSessionNodeProps) {
    super(props);
    this.state = {
      currentFileBrowserPath: '',
      topRepoPath: '',
      showWarning: false,
      branches: [],
      currentBranch: '',
      disableSwitchBranch: true,
      pastCommits: [],
      inNewRepo: true,
      showList: true,
      stagedFiles: [],
      unstagedFiles: [],
      untrackedFiles: [],
      sideBarExpanded: false,
      pastCommitInfo: '',
      pastCommitFilesChanged: '',
      pastCommitInsertionCount: '',
      pastCommitDeletionCount: '',
      pastCommitData: '',
      pastCommitNumber: '',
      pastCommitFilelist: ''
    };
  }

  setShowList = (state: boolean) => {
    this.setState({ showList: state });
  };

  /** Show the commit message and changes from a past commit */
  showPastCommitWork = async (
    pastCommit: SingleCommitInfo,
    pastCommitIndex: number,
    path: string
  ) => {
    let gitApi = new Git();
    let detailedLogData = await gitApi.detailedLog(pastCommit.commit, path);
    if (detailedLogData.code === 0) {
      this.setState({
        pastCommitInfo: detailedLogData.modified_file_note,
        pastCommitFilesChanged: detailedLogData.modified_files_count,
        pastCommitInsertionCount: detailedLogData.number_of_insertions,
        pastCommitDeletionCount: detailedLogData.number_of_deletions,
        pastCommitData: pastCommit,
        pastCommitNumber: pastCommitIndex + ' commit(s) before',
        pastCommitFilelist: detailedLogData.modified_files
      });
    }
  };

  /** 
   * Refresh widget, update all content 
   */
  refresh = async () => {
    try {
      let leftSidebarItems = this.props.app.shell.widgets('left');
      let fileBrowser = leftSidebarItems.next();
      while (fileBrowser && fileBrowser.id !== 'filebrowser') {
        fileBrowser = leftSidebarItems.next();
      }
      let gitApi = new Git();
      // If fileBrowser has loaded, make API request
      if (fileBrowser) {
        // Make API call to get all git info for repo
        let apiResult = await gitApi.allHistory(
          (fileBrowser as any).model.path
        );

        if (apiResult.code === 0) {
          // Get top level path of repo
          let apiShowTopLevel = (apiResult as GitAllHistory).data
            .show_top_level;

          // Get current git branch
          let branchData = (apiResult as GitAllHistory).data.branch;
          let currentBranch = 'master';
          if (branchData.code === 0) {
            let allBranches = (branchData as GitBranchResult).branches;
            for (var i = 0; i < allBranches.length; i++) {
              if (allBranches[i].current[0]) {
                currentBranch = allBranches[i].name;
                break;
              }
            }
          }

          // Get git log for current branch
          let logData = (apiResult as GitAllHistory).data.log;
          let pastCommits = [];
          if (logData.code === 0) {
            pastCommits = (logData as GitLogResult).commits;
          }

          // Get git status for current branch
          let stagedFiles = [],
            unstagedFiles = [],
            untrackedFiles = [];
          let changedFiles = 0;
          let disableSwitchBranch = true;
          let statusData = (apiResult as GitAllHistory).data.status;
          if (statusData.code === 0) {
            let statusFiles = (statusData as GitStatusResult).files;
            for (let i = 0; i < statusFiles.length; i++) {
              // If file has been changed
              if (statusFiles[i].x !== '?' && statusFiles[i].x !== '!') {
                changedFiles++;
              }
              // If file is untracked
              if (statusFiles[i].x === '?' && statusFiles[i].y === '?') {
                untrackedFiles.push(statusFiles[i]);
              } else {
                // If file is staged
                if (statusFiles[i].x !== ' ' && statusFiles[i].y !== 'D') {
                  stagedFiles.push(statusFiles[i]);
                }
                // If file is unstaged but tracked
                if (statusFiles[i].y !== ' ') {
                  unstagedFiles.push(statusFiles[i]);
                }
              }
            }
            // No uncommitted changed files, allow switching branches
            if (changedFiles === 0) {
              disableSwitchBranch = false;
            }
          }
          // No committed files ever, disable switching branches
          if (pastCommits.length === 0) {
            disableSwitchBranch = true;
          }

          // If not in same repo as before refresh, display the current repo
          let inNewRepo =
            this.state.topRepoPath !==
            (apiShowTopLevel as GitShowTopLevelResult).top_repo_path;
          let showList = this.state.showList;
          if (inNewRepo) {
            showList = true;
          }

          this.setState({
            currentFileBrowserPath: (fileBrowser as any).model.path,
            topRepoPath: (apiShowTopLevel as GitShowTopLevelResult)
              .top_repo_path,
            showWarning: true,
            branches: (branchData as GitBranchResult).branches,
            currentBranch: currentBranch,
            disableSwitchBranch: disableSwitchBranch,
            pastCommits: pastCommits,
            inNewRepo: inNewRepo,
            showList: showList,
            stagedFiles: stagedFiles,
            unstagedFiles: unstagedFiles,
            untrackedFiles: untrackedFiles
          });
        } else {
          this.setState({
            currentFileBrowserPath: (fileBrowser as any).model.path,
            topRepoPath: '',
            showWarning: false
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  toggleSidebar = (): void => {
    this.setState({ sideBarExpanded: !this.state.sideBarExpanded });
  };

  getContentClass(): string {
    return this.state.sideBarExpanded
      ? classes(panelPushedContentStyle, panelContentStyle)
      : panelContentStyle;
  }

  render() {
    return (
      <div className={panelContainerStyle}>
        <PathHeader
          currentFileBrowserPath={this.state.currentFileBrowserPath}
          topRepoPath={this.state.topRepoPath}
          refresh={this.refresh}
        />
        <div className={this.getContentClass()}>
          <ToggleDisplay show={this.state.showWarning}>
            <HistorySideBar
              isExpanded={this.state.sideBarExpanded}
              currentFileBrowserPath={this.state.currentFileBrowserPath}
              pastCommits={this.state.pastCommits}
              setShowList={this.setShowList}
              getPastCommit={this.showPastCommitWork}
            />
            <BranchHeader
              currentFileBrowserPath={this.state.currentFileBrowserPath}
              topRepoPath={this.state.topRepoPath}
              refresh={this.refresh}
              currentBranch={this.state.currentBranch}
              stagedFiles={this.state.stagedFiles}
              data={this.state.branches}
              disabled={this.state.disableSwitchBranch}
              toggleSidebar={this.toggleSidebar}
              showList={this.state.showList}
            />
            <PastCommits
              currentFileBrowserPath={this.state.currentFileBrowserPath}
              topRepoPath={this.state.topRepoPath}
              pastCommits={this.state.pastCommits}
              inNewRepo={this.state.inNewRepo}
              showList={this.state.showList}
              stagedFiles={this.state.stagedFiles}
              unstagedFiles={this.state.unstagedFiles}
              untrackedFiles={this.state.untrackedFiles}
              app={this.props.app}
              refresh={this.refresh}
              diff={this.props.diff}
              pastCommitInfo={this.state.pastCommitInfo}
              pastCommitFilesChanged={this.state.pastCommitFilesChanged}
              pastCommitInsertionCount={this.state.pastCommitInsertionCount}
              pastCommitDeletionCount={this.state.pastCommitDeletionCount}
              pastCommitData={this.state.pastCommitData}
              pastCommitNumber={this.state.pastCommitNumber}
              pastCommitFilelist={this.state.pastCommitFilelist}
              sideBarExpanded={this.state.sideBarExpanded}
            />
          </ToggleDisplay>
          <ToggleDisplay show={!this.state.showWarning}>
            <div className={panelWarningStyle}>
              <div>
                You aren’t in a git repository.
              </div>
              <button 
              className={findRepoButtonStyle}
              onClick={() => this.props.app.commands.execute('filebrowser:activate-main')}
              >Go find a repo</button>
            </div>
          </ToggleDisplay>
        </div>
      </div>
    );
  }
}
