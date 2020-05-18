import * as React from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { showErrorMessage, showDialog } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { JSONObject } from '@lumino/coreutils';
import { GitExtension } from '../model';
import {
  panelWrapperClass,
  repoButtonClass,
  selectedTabClass,
  tabClass,
  tabsClass,
  tabIndicatorClass,
  warningWrapperClass
} from '../style/GitPanel';
import { Git } from '../tokens';
import { GitAuthorForm } from '../widgets/AuthorBox';
import { FileList } from './FileList';
import { HistorySideBar } from './HistorySideBar';
import { Toolbar } from './Toolbar';
import { CommitBox } from './CommitBox';

/** Interface for GitPanel component state */
export interface IGitSessionNodeState {
  branches: Git.IBranch[];
  currentBranch: string;
  files: Git.IStatusFile[];
  inGitRepository: boolean;
  pastCommits: Git.ISingleCommitInfo[];
  tab: number;
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
      branches: [],
      currentBranch: '',
      files: [],
      inGitRepository: false,
      pastCommits: [],
      tab: 0
    };
  }

  componentDidMount() {
    const { model, settings } = this.props;

    model.repositoryChanged.connect((_, args) => {
      this.setState({
        inGitRepository: args.newValue !== null
      });
      this.refresh();
    }, this);
    model.statusChanged.connect(() => {
      this.setState({ files: model.status });
    }, this);
    model.headChanged.connect(async () => {
      await this.refreshBranch();
      if (this.state.tab === 1) {
        this.refreshHistory();
      } else {
        this.refreshStatus();
      }
    }, this);
    model.markChanged.connect(() => this.forceUpdate());

    settings.changed.connect(this.refresh, this);
  }

  refreshBranch = async () => {
    const { currentBranch } = this.props.model;

    this.setState({
      branches: this.props.model.branches,
      currentBranch: currentBranch ? currentBranch.name : 'master'
    });
  };

  refreshHistory = async () => {
    if (this.props.model.pathRepository !== null) {
      // Get git log for current branch
      const logData = await this.props.model.log(this.props.settings.composite[
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

  /**
   * Commits all marked files.
   *
   * @param message - commit message
   * @returns a promise which commits the files
   */
  commitMarkedFiles = async (message: string): Promise<void> => {
    await this.props.model.reset();
    await this.props.model.add(...this._markedFiles.map(file => file.to));
    await this.commitStagedFiles(message);
  };

  /**
   * Commits all staged files.
   *
   * @param message - commit message
   * @returns a promise which commits the files
   */
  commitStagedFiles = async (message: string): Promise<void> => {
    try {
      if (
        message &&
        message !== '' &&
        (await this._hasIdentity(this.props.model.pathRepository))
      ) {
        await this.props.model.commit(message);
      }
    } catch (error) {
      console.error(error);
      showErrorMessage('Fail to commit', error);
    }
  };

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <div className={panelWrapperClass}>
        {this._renderToolbar()}
        {this._renderMain()}
      </div>
    );
  }

  /**
   * Renders a toolbar.
   *
   * @returns React element
   */
  private _renderToolbar(): React.ReactElement {
    const disableBranching = Boolean(
      this.props.settings.composite['disableBranchWithChanges'] &&
        (this._hasUnStagedFile() || this._hasStagedFile())
    );
    return (
      <Toolbar
        model={this.props.model}
        branching={!disableBranching}
        refresh={this._onRefresh}
        suspend={
          this.props.settings.composite['blockWhileCommandExecutes'] as boolean
        }
      />
    );
  }

  /**
   * Renders the main panel.
   *
   * @returns React element
   */
  private _renderMain(): React.ReactElement {
    if (this.state.inGitRepository) {
      return (
        <React.Fragment>
          {this._renderTabs()}
          {this.state.tab === 1 ? this._renderHistory() : this._renderChanges()}
        </React.Fragment>
      );
    }
    return this._renderWarning();
  }

  /**
   * Renders panel tabs.
   *
   * @returns React element
   */
  private _renderTabs(): React.ReactElement {
    return (
      <Tabs
        classes={{
          root: tabsClass,
          indicator: tabIndicatorClass
        }}
        value={this.state.tab}
        onChange={this._onTabChange}
      >
        <Tab
          classes={{
            root: tabClass,
            selected: selectedTabClass
          }}
          title="View changed files"
          label="Changes"
          disableFocusRipple={true}
          disableRipple={true}
        />
        <Tab
          classes={{
            root: tabClass,
            selected: selectedTabClass
          }}
          title="View commit history"
          label="History"
          disableFocusRipple={true}
          disableRipple={true}
        />
      </Tabs>
    );
  }

  /**
   * Renders a panel for viewing and committing file changes.
   *
   * @returns React element
   */
  private _renderChanges(): React.ReactElement {
    return (
      <React.Fragment>
        <FileList
          files={this._sortedFiles}
          model={this.props.model}
          renderMime={this.props.renderMime}
          settings={this.props.settings}
        />
        {this.props.settings.composite['simpleStaging'] ? (
          <CommitBox
            hasFiles={this._markedFiles.length > 0}
            onCommit={this.commitMarkedFiles}
          />
        ) : (
          <CommitBox
            hasFiles={this._hasStagedFile()}
            onCommit={this.commitStagedFiles}
          />
        )}
      </React.Fragment>
    );
  }

  /**
   * Renders a panel for viewing commit history.
   *
   * @returns React element
   */
  private _renderHistory(): React.ReactElement {
    return (
      <HistorySideBar
        branches={this.state.branches}
        commits={this.state.pastCommits}
        model={this.props.model}
        renderMime={this.props.renderMime}
      />
    );
  }

  /**
   * Renders a panel for prompting a user to find a Git repository.
   *
   * @returns React element
   */
  private _renderWarning(): React.ReactElement {
    return (
      <div className={warningWrapperClass}>
        <div>Unable to detect a Git repository.</div>
        <button
          className={repoButtonClass}
          onClick={() =>
            this.props.model.commands.execute('filebrowser:toggle-main')
          }
        >
          Find a repository
        </button>
      </div>
    );
  }

  /**
   * Callback invoked upon changing the active panel tab.
   *
   * @param event - event object
   * @param tab - tab number
   */
  private _onTabChange = (event: any, tab: number): void => {
    if (tab === 1) {
      this.refreshHistory();
    }
    this.setState({
      tab: tab
    });
  };

  /**
   * Callback invoked upon refreshing a repository.
   *
   * @returns promise which refreshes a repository
   */
  private _onRefresh = async () => {
    await this.refreshBranch();
    if (this.state.tab === 1) {
      this.refreshHistory();
    } else {
      this.refreshStatus();
    }
  };

  /**
   * Determines whether a user has a known Git identity.
   *
   * @param path - repository path
   * @returns a promise which returns a success status
   */
  private async _hasIdentity(path: string): Promise<boolean> {
    // If the repository path changes, check the user identity
    if (path !== this._previousRepoPath) {
      try {
        let res = await this.props.model.config();
        if (res.ok) {
          const options: JSONObject = (await res.json()).options;
          const keys = Object.keys(options);

          // If the user name or e-mail is unknown, ask the user to set it
          if (keys.indexOf('user.name') < 0 || keys.indexOf('user.email') < 0) {
            const result = await showDialog({
              title: 'Who is committing?',
              body: new GitAuthorForm()
            });
            if (!result.button.accept) {
              console.log('User refuses to set identity.');
              return false;
            }
            const identity = result.value;
            res = await this.props.model.config({
              'user.name': identity.name,
              'user.email': identity.email
            });
            if (!res.ok) {
              console.log(await res.text());
              return false;
            }
          }
          this._previousRepoPath = path;
        }
      } catch (error) {
        throw new Error('Failed to set your identity. ' + error.message);
      }
    }
    return Promise.resolve(true);
  }

  private _hasStagedFile(): boolean {
    return this.state.files.some(file => file.status === 'staged');
  }

  private _hasUnStagedFile(): boolean {
    return this.state.files.some(file => file.status === 'unstaged');
  }

  /**
   * List of marked files.
   */
  private get _markedFiles(): Git.IStatusFile[] {
    return this._sortedFiles.filter(file => this.props.model.getMark(file.to));
  }

  /**
   * List of sorted modified files.
   */
  private get _sortedFiles(): Git.IStatusFile[] {
    const { files } = this.state;

    files.sort((a, b) => a.to.localeCompare(b.to));
    return files;
  }

  private _previousRepoPath: string = null;
}
