import { ISettingRegistry } from '@jupyterlab/coreutils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { GitExtension } from '../model';
import {
  findRepoButtonStyle,
  panelContainerStyle,
  panelWarningStyle
} from '../style/GitPanelStyle';
import { Git } from '../tokens';
import { BranchHeader } from './BranchHeader';
import { FileList } from './FileList';
import { HistorySideBar } from './HistorySideBar';
import { PathHeader } from './PathHeader';

/** Interface for GitPanel component state */
export interface IGitSessionNodeState {
  inGitRepository: boolean;

  branches: Git.IBranch[];
  currentBranch: string;
  upstreamBranch: string;

  pastCommits: Git.ISingleCommitInfo[];

  stagedFiles: Git.IStatusFileResult[];
  unstagedFiles: Git.IStatusFileResult[];
  untrackedFiles: Git.IStatusFileResult[];
  hasChangedFiles: boolean;

  isHistoryVisible: boolean;
}

/** Interface for GitPanel component props */
export interface IGitSessionNodeProps {
  model: GitExtension;
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
      inGitRepository: false,
      branches: [],
      currentBranch: '',
      upstreamBranch: '',
      hasChangedFiles: false,
      pastCommits: [],
      stagedFiles: [],
      unstagedFiles: [],
      untrackedFiles: [],
      isHistoryVisible: false
    };

    props.model.repositoryChanged.connect((_, args) => {
      this.setState({
        inGitRepository: args.newValue !== null
      });
      this.refresh();
    }, this);
    props.model.statusChanged.connect(() => {
      this.setStatus();
    }, this);
    props.model.headChanged.connect(async () => {
      await this.refreshBranch();
      if (this.state.isHistoryVisible) {
        this.refreshHistory();
      } else {
        this.refreshStatus();
      }
    }, this);

    props.settings.changed.connect(this.refresh, this);
  }

  refreshBranch = async () => {
    // Get current and upstream git branch
    if (this.props.model.pathRepository !== null) {
      const branchData = await this.props.model.branch();
      let currentBranch = 'master';
      let upstreamBranch = '';
      if (branchData.code === 0) {
        let allBranches = branchData.branches;
        for (let i = 0; i < allBranches.length; i++) {
          if (allBranches[i].is_current_branch) {
            currentBranch = allBranches[i].name;
            upstreamBranch = allBranches[i].upstream;
            break;
          }
        }
      }

      this.setState({
        branches: branchData.branches,
        currentBranch: currentBranch,
        upstreamBranch: upstreamBranch
      });
    }
  };

  refreshHistory = async () => {
    if (this.props.model.pathRepository !== null) {
      // Get git log for current branch
      let logData = await this.props.model.log(this.props.settings.composite[
        'historyCount'
      ] as number);
      let pastCommits = new Array<Git.ISingleCommitInfo>();
      if (logData.code === 0) {
        pastCommits = logData.commits;
      }

      this.setState({
        pastCommits: pastCommits
      });
    }
  };

  setStatus = () => {
    if (this.props.model.pathRepository !== null) {
      // Get git status for current branch
      let stagedFiles = new Array<Git.IStatusFileResult>();
      let unstagedFiles = new Array<Git.IStatusFileResult>();
      let untrackedFiles = new Array<Git.IStatusFileResult>();
      let changedFiles = 0;
      let statusFiles = this.props.model.status;
      if (statusFiles.length > 0) {
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
      }

      this.setState({
        stagedFiles: stagedFiles,
        unstagedFiles: unstagedFiles,
        untrackedFiles: untrackedFiles,
        hasChangedFiles: changedFiles > 0
      });
    }
  };

  refreshStatus = async () => {
    await this.props.model.refreshStatus();
  };

  /**
   * Refresh widget, update all content
   */
  refresh = async () => {
    if (this.props.model.pathRepository !== null) {
      await this.refreshBranch();
      await this.refreshHistory();
      await this.refreshStatus();
    }
  };

  toggleSidebar = (): void => {
    if (!this.state.isHistoryVisible) {
      this.refreshHistory();
    }
    this.setState({ isHistoryVisible: !this.state.isHistoryVisible });
  };

  render() {
    let main: React.ReactElement;
    let sub: React.ReactElement;

    if (this.state.isHistoryVisible) {
      sub = (
        <HistorySideBar
          isExpanded={this.state.isHistoryVisible}
          branches={this.state.branches}
          pastCommits={this.state.pastCommits}
          model={this.props.model}
          renderMime={this.props.renderMime}
        />
      );
    } else {
      sub = (
        <FileList
          stagedFiles={this.state.stagedFiles}
          unstagedFiles={this.state.unstagedFiles}
          untrackedFiles={this.state.untrackedFiles}
          model={this.props.model}
          renderMime={this.props.renderMime}
          settings={this.props.settings}
        />
      );
    }

    if (this.state.inGitRepository) {
      main = (
        <React.Fragment>
          <BranchHeader
            model={this.props.model}
            refresh={this.refreshBranch}
            currentBranch={this.state.currentBranch}
            upstreamBranch={this.state.upstreamBranch}
            stagedFiles={this.state.stagedFiles}
            data={this.state.branches}
            // No uncommitted changed files, allow switching branches
            // No committed files ever, disable switching branches
            disabled={
              this.state.hasChangedFiles || this.state.pastCommits.length === 0
            }
            toggleSidebar={this.toggleSidebar}
            sideBarExpanded={this.state.isHistoryVisible}
          />
          {sub}
        </React.Fragment>
      );
    } else {
      main = (
        <div className={panelWarningStyle}>
          <div>You aren’t in a git repository.</div>
          <button
            className={findRepoButtonStyle}
            onClick={() =>
              this.props.model.commands.execute('filebrowser:toggle-main')
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
          model={this.props.model}
          refresh={async () => {
            await this.refreshBranch();
            if (this.state.isHistoryVisible) {
              this.refreshHistory();
            } else {
              this.refreshStatus();
            }
          }}
        />
        {main}
      </div>
    );
  }
}
