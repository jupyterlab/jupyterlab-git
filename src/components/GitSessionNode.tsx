import * as React from 'react';

import ToggleDisplay from 'react-toggle-display';

import {
  JupyterLab
} from '@jupyterlab/application';

import {
  Git, 
  GitBranchResult, 
  GitStatusResult, 
  GitShowTopLevelResult, 
  GitAllHistory, 
  GitLogResult
} from '../git';

import {
  PathHeader
} from './PathHeader';

import {
  BranchHeader
} from './BranchHeader';

import {
  PastCommits
} from './PastCommits';

import {
  gitContainerStyle
} from '../components_style/GitSessionNodeStyle';

import '../../style/index.css';

/** Interface for GitSessionNode component state */
export interface IGitSessionNodeState {
  currentFileBrowserPath: string,
  topRepoPath: string,
  showWarning: boolean,

  branches: any,
  currentBranch: string,
  disableSwitchBranch: boolean,

  pastCommits: any,
  inNewRepo: boolean,
  showIndex: number,

  stagedFiles: any,
  unstagedFiles: any,
  untrackedFiles: any
}

/** Interface for GitSessionNode component props */
export interface IGitSessionNodeProps {
  app: JupyterLab,
  diff: any
}

/** A React component for the git extension's main display */
export class GitSessionNode extends React.Component<IGitSessionNodeProps, IGitSessionNodeState> {
  constructor(props: IGitSessionNodeProps) {
    super(props)
    this.state = 
    {
      currentFileBrowserPath: '', 
      topRepoPath: '', 
      showWarning: false, 
      branches: [], 
      currentBranch: '', 
      disableSwitchBranch: true, 
      pastCommits: [], 
      inNewRepo: true, 
      showIndex: -1, 
      stagedFiles: [], 
      unstagedFiles: [], 
      untrackedFiles: []
    }
  }

  showCurrentWork = (show_value: number) => {
    this.setState({showIndex: show_value});
  }

  /** 
   * Refresh widget, update all content 
   */
  refresh = async () => {
    try {
      let leftSidebarItems = this.props.app.shell.widgets('left')
      let fileBrowser = leftSidebarItems.next()
      while(fileBrowser && fileBrowser.id !== 'filebrowser') {
        fileBrowser = leftSidebarItems.next()
      }
      let gitApi = new Git()
      // If fileBrowser has loaded, make API request
      if (fileBrowser) {
        // Make API call to get all git info for repo
        let apiResult = await gitApi.allHistory((fileBrowser as any).model.path)
        
        if (apiResult.code === 0) {
          // Get top level path of repo
          let apiShowTopLevel = (apiResult as GitAllHistory).data.show_top_level

          // Get current git branch
          let branchData = (apiResult as GitAllHistory).data.branch
          let currentBranch = 'master'
          if (branchData.code === 0) {
            let allBranches = (branchData as GitBranchResult).branches
            for (var i = 0; i < allBranches.length; i++){
              if (allBranches[i].current[0]) {
                currentBranch = allBranches[i].name
                break
              }
            }
          }
          
          // Get git log for current branch
          let logData = (apiResult as GitAllHistory).data.log
          let pastCommits = []
          if (logData.code === 0) {
            pastCommits = (logData as GitLogResult).commits
          }
          
          // Get git status for current branch
          let stagedFiles = [], unstagedFiles = [], untrackedFiles = []
          let changedFiles = 0
          let disableSwitchBranch = true
          let statusData = (apiResult as GitAllHistory).data.status
          if (statusData.code === 0) {
            let statusFiles = (statusData as GitStatusResult).files
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
              disableSwitchBranch = false
            }
          }
          // No committed files ever, disable switching branches
          if (pastCommits.length === 0) {
            disableSwitchBranch = true
          }
          
          // If not in same repo as before refresh, display the current repo 
          let inNewRepo = this.state.topRepoPath !== (apiShowTopLevel as GitShowTopLevelResult).top_repo_path
          let showIndex = this.state.showIndex  
          if (inNewRepo) {
            showIndex = -1
          }
                
          this.setState(
            {
              currentFileBrowserPath: (fileBrowser as any).model.path, 
              topRepoPath: (apiShowTopLevel as GitShowTopLevelResult).top_repo_path, 
              showWarning: true, 
              branches: (branchData as GitBranchResult).branches, 
              currentBranch: currentBranch, 
              disableSwitchBranch: disableSwitchBranch, 
              pastCommits: pastCommits, 
              inNewRepo: inNewRepo, 
              showIndex: showIndex,
              stagedFiles: stagedFiles, 
              unstagedFiles: unstagedFiles, 
              untrackedFiles: untrackedFiles
            }
          ) 
        } else {
          this.setState(
            {
              currentFileBrowserPath: (fileBrowser as any).model.path, 
              topRepoPath: '', 
              showWarning: false,  
            }
          )
        }
    }
  } catch(err) {
      console.log(err)
    } 
  }
  
  render() {
    return(
      <div className={gitContainerStyle}>
        <PathHeader 
          currentFileBrowserPath={this.state.currentFileBrowserPath} 
          topRepoPath={this.state.topRepoPath} 
          refresh={this.refresh}
        />
        <ToggleDisplay show={this.state.showWarning}>
          <BranchHeader 
            currentFileBrowserPath={this.state.currentFileBrowserPath} 
            topRepoPath={this.state.topRepoPath} 
            refresh={this.refresh} 
            currentBranch={this.state.currentBranch} 
            stagedFiles={this.state.stagedFiles}
            data={this.state.branches} 
            disabled={this.state.disableSwitchBranch}
          />
          <PastCommits 
            currentFileBrowserPath={this.state.currentFileBrowserPath} 
            topRepoPath={this.state.topRepoPath} 
            pastCommits={this.state.pastCommits} 
            inNewRepo={this.state.inNewRepo}
            showIndex={this.state.showIndex}
            stagedFiles={this.state.stagedFiles} 
            unstagedFiles={this.state.unstagedFiles} 
            untrackedFiles={this.state.untrackedFiles} 
            app={this.props.app} 
            refresh={this.refresh} 
            showCurrentWork={this.showCurrentWork} 
            diff={this.props.diff}
          />
        </ToggleDisplay>
        <ToggleDisplay show={!(this.state.showWarning)}>
          <div style={{ padding: 16 }}>
            <span style={{ color: "red", fontWeight: "bold" }}>
              Error:
            </span> 
            <span>
              The current folder is not a git repository. Please make sure you are currently working in a git repository in order to use this plugin.
            </span>
          </div>
          </ToggleDisplay>
      </div>
    )
  }
}