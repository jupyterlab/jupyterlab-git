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
import { decodeStage } from '../utils';
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
    props.model.markChanged.connect(() => this.forceUpdate());

    props.settings.changed.connect(this.refresh, this);
  }

  refreshBranch = async () => {
    const { currentBranch } = this.props.model;

    this.setState({
      branches: this.props.model.branches,
      currentBranch: currentBranch ? currentBranch.name : 'master',
      upstreamBranch: currentBranch ? currentBranch.upstream : ''
    });
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
      let statusFiles = this.props.model.status;
      if (statusFiles.length > 0) {
        for (let i = 0; i < statusFiles.length; i++) {
          const file = statusFiles[i];
          const { x, y } = file;
          const stage = decodeStage(x, y);

          // If file is untracked
          if (stage === 'untracked') {
            untrackedFiles.push(file);
          } else if (stage === 'unstaged') {
            unstagedFiles.push(file);
          } else if (stage === 'staged') {
            stagedFiles.push(file);
          }
        }
      }

      this.setState({
        stagedFiles: stagedFiles,
        unstagedFiles: unstagedFiles,
        untrackedFiles: untrackedFiles
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
            disabled={
              (this.props.settings.composite[
                'disableBranchWithChanges'
              ] as boolean) &&
(
   (this.state.unstagedFiles && this.state.unstagedFiles.length) ||
   (this.state.stagedFiles && this.state.stagedFiles.length)
)
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
