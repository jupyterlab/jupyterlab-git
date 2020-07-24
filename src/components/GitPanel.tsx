import * as React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { showDialog, showErrorMessage } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { JSONObject } from '@lumino/coreutils';
import { GitExtension } from '../model';
import { sleep } from '../utils';
import { Git, ILogMessage } from '../tokens';
import { GitAuthorForm } from '../widgets/AuthorBox';
import {
  panelWrapperClass,
  repoButtonClass,
  selectedTabClass,
  tabClass,
  tabIndicatorClass,
  tabsClass,
  warningTextClass
} from '../style/GitPanel';
import { CommitBox } from './CommitBox';
import { FileList } from './FileList';
import { HistorySideBar } from './HistorySideBar';
import { Toolbar } from './Toolbar';
import { SuspendModal } from './SuspendModal';
import { Alert } from './Alert';
import { CommandIDs } from '../commandsAndMenu';

/**
 * Interface describing component properties.
 */
export interface IGitPanelProps {
  /**
   * Git extension data model.
   */
  model: GitExtension;

  /**
   * MIME type registry.
   */
  renderMime: IRenderMimeRegistry;

  /**
   * Git extension settings.
   */
  settings: ISettingRegistry.ISettings;

  /**
   * File browser model.
   */
  filebrowser: FileBrowserModel;
}

/**
 * Interface describing component state.
 */
export interface IGitPanelState {
  /**
   * Boolean indicating whether the user is currently in a Git repository.
   */
  inGitRepository: boolean;

  /**
   * List of branches.
   */
  branches: Git.IBranch[];

  /**
   * Current branch.
   */
  currentBranch: string;

  /**
   * List of changed files.
   */
  files: Git.IStatusFile[];

  /**
   * List of prior commits.
   */
  pastCommits: Git.ISingleCommitInfo[];

  /**
   * Panel tab identifier.
   */
  tab: number;

  /**
   * Boolean indicating whether UI interaction should be suspended (e.g., due to pending command).
   */
  suspend: boolean;

  /**
   * Boolean indicating whether to show an alert.
   */
  alert: boolean;

  /**
   * Log message.
   */
  log: ILogMessage;
}

/**
 * React component for rendering a panel for performing Git operations.
 */
export class GitPanel extends React.Component<IGitPanelProps, IGitPanelState> {
  /**
   * Returns a React component for rendering a panel for performing Git operations.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: IGitPanelProps) {
    super(props);
    this.state = {
      branches: [],
      currentBranch: '',
      files: [],
      inGitRepository: false,
      pastCommits: [],
      tab: 0,
      suspend: false,
      alert: false,
      log: {
        severity: 'info',
        message: ''
      }
    };
  }

  /**
   * Callback invoked immediately after mounting a component (i.e., inserting into a tree).
   */
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
    this._suspend(true);

    this._log({
      severity: 'info',
      message: 'Staging files...'
    });
    await this.props.model.reset();
    await this.props.model.add(...this._markedFiles.map(file => file.to));

    await this.commitStagedFiles(message);
    this._suspend(false);
  };

  /**
   * Commits all staged files.
   *
   * @param message - commit message
   * @returns a promise which commits the files
   */
  commitStagedFiles = async (message: string): Promise<void> => {
    let res: boolean;
    if (!message) {
      return;
    }
    try {
      res = await this._hasIdentity(this.props.model.pathRepository);
    } catch (err) {
      this._log({
        severity: 'error',
        message: 'Failed to commit changes.'
      });
      console.error(err);
      showErrorMessage('Fail to commit', err);
      return;
    }
    if (!res) {
      this._log({
        severity: 'error',
        message: 'Failed to commit changes.'
      });
      return;
    }
    this._log({
      severity: 'info',
      message: 'Committing changes...'
    });
    this._suspend(true);
    try {
      await Promise.all([sleep(1000), this.props.model.commit(message)]);
    } catch (err) {
      this._suspend(false);
      this._log({
        severity: 'error',
        message: 'Failed to commit changes.'
      });
      console.error(err);
      showErrorMessage('Fail to commit', err);
      return;
    }
    this._suspend(false);
    this._log({
      severity: 'success',
      message: 'Committed changes.'
    });
  };

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <div className={panelWrapperClass}>
        {this.state.inGitRepository ? (
          <React.Fragment>
            {this._renderToolbar()}
            {this._renderMain()}
            {this._renderFeedback()}
          </React.Fragment>
        ) : (
          this._renderWarning()
        )}
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
    return (
      <React.Fragment>
        {this._renderTabs()}
        {this.state.tab === 1 ? this._renderHistory() : this._renderChanges()}
      </React.Fragment>
    );
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
        suspend={
          this.props.settings.composite['blockWhileCommandExecutes'] as boolean
        }
      />
    );
  }

  /**
   * Renders a component to provide UI feedback.
   *
   * @returns React element
   */
  private _renderFeedback(): React.ReactElement {
    return (
      <React.Fragment>
        <SuspendModal
          open={
            this.props.settings.composite['blockWhileCommandExecutes'] &&
            this.state.suspend
          }
          onClick={this._onFeedbackModalClick}
        />
        <Alert
          open={this.state.alert}
          message={this.state.log.message}
          severity={this.state.log.severity}
          onClose={this._onFeedbackAlertClose}
        />
      </React.Fragment>
    );
  }

  /**
   * Renders a panel for prompting a user to find a Git repository.
   *
   * @returns React element
   */
  private _renderWarning(): React.ReactElement {
    const path = this.props.filebrowser.path;
    const { commands } = this.props.model;

    return (
      <React.Fragment>
        <div className={warningTextClass}>
          {path ? (
            <React.Fragment>
              <b title={path}>{PathExt.basename(path)}</b> is not
            </React.Fragment>
          ) : (
            'You are not currently in'
          )}
          {
            ' a Git repository. To use Git, navigate to a local repository, initialize a repository here, or clone an existing repository.'
          }
        </div>
        <button
          className={repoButtonClass}
          onClick={() => commands.execute('filebrowser:toggle-main')}
        >
          Open the FileBrowser
        </button>
        <button
          className={repoButtonClass}
          onClick={() => commands.execute(CommandIDs.gitInit)}
        >
          Initialize a Repository
        </button>
        <button
          className={repoButtonClass}
          onClick={async () => {
            await commands.execute(CommandIDs.gitClone);
            await commands.execute('filebrowser:toggle-main');
          }}
        >
          Clone a Repository
        </button>
      </React.Fragment>
    );
  }

  /**
   * Sets the suspension state.
   *
   * @param bool - boolean indicating whether to suspend UI interaction
   */
  private _suspend(bool: boolean): void {
    if (this.props.settings.composite['blockWhileCommandExecutes']) {
      this.setState({
        suspend: bool
      });
    }
  }

  /**
   * Sets the current component log message.
   *
   * @param msg - log message
   */
  private _log(msg: ILogMessage): void {
    this.setState({
      alert: true,
      log: msg
    });
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
   * Callback invoked upon clicking on the feedback modal.
   *
   * @param event - event object
   */
  private _onFeedbackModalClick = (): void => {
    this._suspend(false);
  };

  /**
   * Callback invoked upon closing a feedback alert.
   *
   * @param event - event object
   */
  private _onFeedbackAlertClose = (): void => {
    this.setState({
      alert: false
    });
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
    return this.state.files.some(
      file => file.status === 'staged' || file.status === 'partially-staged'
    );
  }

  private _hasUnStagedFile(): boolean {
    return this.state.files.some(
      file => file.status === 'unstaged' || file.status === 'partially-staged'
    );
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
