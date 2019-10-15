import * as React from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';

import {
  Git,
  IGitBranchResult,
  IGitStatusResult,
  IGitShowTopLevelResult,
  IGitAllHistory,
  IGitLogResult,
  ISingleCommitInfo,
  IGitStatusFileResult,
  IDiffCallback
} from '../git';

import { PathHeader } from './PathHeader';

import { BranchHeader } from './BranchHeader';

import { PastCommits } from './PastCommits';

import { HistorySideBar } from './HistorySideBar';

import {
  panelContainerStyle,
  panelWarningStyle,
  findRepoButtonStyle
} from '../style/GitPanelStyle';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISettingRegistry } from '@jupyterlab/coreutils';

/** Interface for GitPanel component state */
export interface IGitSessionNodeState {
  currentFileBrowserPath: string;
  topRepoPath: string;
  showWarning: boolean;

  branches: any;
  currentBranch: string;
  upstreamBranch: string;
  disableSwitchBranch: boolean;

  pastCommits: any;
  inNewRepo: boolean;
  showList: boolean;

  stagedFiles: any;
  unstagedFiles: any;
  untrackedFiles: any;

  sideBarExpanded: boolean;
}

/** Interface for GitPanel component props */
export interface IGitSessionNodeProps {
  app: JupyterFrontEnd;
  diff: IDiffCallback;
  renderMime: IRenderMimeRegistry;
  settings: ISettingRegistry.ISettings;
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
      upstreamBranch: '',
      disableSwitchBranch: true,
      pastCommits: [],
      inNewRepo: true,
      showList: true,
      stagedFiles: [],
      unstagedFiles: [],
      untrackedFiles: [],
      sideBarExpanded: false
    };
  }

  setShowList = (state: boolean) => {
    this.setState({ showList: state });
  };

  /**
   * Refresh widget, update all content
   */
  refresh = async () => {
    try {
      let gitApi = new Git();

      let leftSidebarItems = this.props.app.shell.widgets('left');
      let fileBrowser = leftSidebarItems.next();
      while (fileBrowser && fileBrowser.id !== 'filebrowser') {
        fileBrowser = leftSidebarItems.next();
      }
      // If fileBrowser has loaded, make API request
      if (fileBrowser) {
        // Make API call to get all git info for repo
        let apiResult = await gitApi.allHistory(
          (fileBrowser as any).model.path,
          this.props.settings.composite['historyCount'] as number
        );

        if (apiResult.code === 0) {
          // Get top level path of repo
          let apiShowTopLevel = (apiResult as IGitAllHistory).data
            .show_top_level;

          // Get current and upstream git branch
          let branchData = (apiResult as IGitAllHistory).data.branch;
          let currentBranch = 'master';
          let upstreamBranch = '';
          if (branchData.code === 0) {
            let allBranches = (branchData as IGitBranchResult).branches;
            for (let i = 0; i < allBranches.length; i++) {
              if (allBranches[i].is_current_branch) {
                currentBranch = allBranches[i].name;
                upstreamBranch = allBranches[i].upstream;
                break;
              }
            }
          }

          // Get git log for current branch
          let logData = (apiResult as IGitAllHistory).data.log;
          let pastCommits = new Array<ISingleCommitInfo>();
          if (logData.code === 0) {
            pastCommits = (logData as IGitLogResult).commits;
          }

          // Get git status for current branch
          let stagedFiles = new Array<IGitStatusFileResult>();
          let unstagedFiles = new Array<IGitStatusFileResult>();
          let untrackedFiles = new Array<IGitStatusFileResult>();
          let changedFiles = 0;
          let disableSwitchBranch = true;
          let statusData = (apiResult as IGitAllHistory).data.status;
          if (statusData.code === 0) {
            let statusFiles = (statusData as IGitStatusResult).files;
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
            (apiShowTopLevel as IGitShowTopLevelResult).top_repo_path;
          let showList = this.state.showList;
          if (inNewRepo) {
            showList = true;
          }

          this.setState({
            currentFileBrowserPath: (fileBrowser as any).model.path,
            topRepoPath: (apiShowTopLevel as IGitShowTopLevelResult)
              .top_repo_path,
            showWarning: true,
            branches: (branchData as IGitBranchResult).branches,
            currentBranch: currentBranch,
            upstreamBranch: upstreamBranch,
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

  render() {
    let main: React.ReactElement<null>;

    if (this.state.showWarning) {
      main = (
        <div>
          <BranchHeader
            currentFileBrowserPath={this.state.currentFileBrowserPath}
            topRepoPath={this.state.topRepoPath}
            refresh={this.refresh}
            currentBranch={this.state.currentBranch}
            upstreamBranch={this.state.upstreamBranch}
            stagedFiles={this.state.stagedFiles}
            data={this.state.branches}
            disabled={this.state.disableSwitchBranch}
            toggleSidebar={this.toggleSidebar}
            showList={this.state.showList}
            sideBarExpanded={this.state.sideBarExpanded}
          />
          <HistorySideBar
            isExpanded={this.state.sideBarExpanded}
            branches={this.state.branches}
            pastCommits={this.state.pastCommits}
            topRepoPath={this.state.topRepoPath}
            app={this.props.app}
            refresh={this.refresh}
            diff={this.props.diff}
            renderMime={this.props.renderMime}
          />
          <PastCommits
            currentFileBrowserPath={this.state.currentFileBrowserPath}
            topRepoPath={this.state.topRepoPath}
            inNewRepo={this.state.inNewRepo}
            showList={this.state.showList}
            stagedFiles={this.state.stagedFiles}
            unstagedFiles={this.state.unstagedFiles}
            untrackedFiles={this.state.untrackedFiles}
            app={this.props.app}
            refresh={this.refresh}
            diff={this.props.diff}
            sideBarExpanded={this.state.sideBarExpanded}
            settings={this.props.settings}
            renderMime={this.props.renderMime}
          />
        </div>
      );
    } else {
      main = (
        <div className={panelWarningStyle}>
          <div>You aren’t in a git repository.</div>
          <button
            className={findRepoButtonStyle}
            onClick={() =>
              this.props.app.commands.execute('filebrowser:toggle-main')
            }
          >
            Go find a repo
          </button>
        </div>
      );
    }

    return (
      <div className={panelContainerStyle}>
        <PathHeader
          currentFileBrowserPath={this.state.currentFileBrowserPath}
          topRepoPath={this.state.topRepoPath}
          refresh={this.refresh}
          currentBranch={this.state.currentBranch}
        />
        <div>{main}</div>
      </div>
    );
  }
}
