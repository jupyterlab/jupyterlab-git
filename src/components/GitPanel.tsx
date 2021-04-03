import { showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { JSONObject } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import * as React from 'react';
import { Logger } from '../logger';
import { GitExtension } from '../model';
import {
  panelWrapperClass,
  repoButtonClass,
  selectedTabClass,
  tabClass,
  tabIndicatorClass,
  tabsClass,
  warningTextClass
} from '../style/GitPanel';
import { CommandIDs, Git, ILogMessage, Level } from '../tokens';
import { GitAuthorForm } from '../widgets/AuthorBox';
import { CommitBox } from './CommitBox';
import { FileList } from './FileList';
import { HistorySideBar } from './HistorySideBar';
import { Toolbar } from './Toolbar';

/**
 * Interface describing component properties.
 */
export interface IGitPanelProps {
  /**
   * Jupyter App commands registry
   */
  commands: CommandRegistry;

  /**
   * File browser model.
   */
  filebrowser: FileBrowserModel;

  /**
   * Extension logger
   */
  logger: Logger;

  /**
   * Git extension data model.
   */
  model: GitExtension;

  /**
   * Git extension settings.
   */
  settings: ISettingRegistry.ISettings;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

/**
 * Interface describing component state.
 */
export interface IGitPanelState {
  /**
   * Git path repository
   */
  repository: string | null;

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
   * Number of commits ahead
   */
  nCommitsAhead: number;

  /**
   * Number of commits behind
   */
  nCommitsBehind: number;

  /**
   * List of prior commits.
   */
  pastCommits: Git.ISingleCommitInfo[];

  /**
   * Panel tab identifier.
   */
  tab: number;
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
    const { branches, currentBranch, pathRepository } = props.model;

    this.state = {
      branches: branches,
      currentBranch: currentBranch ? currentBranch.name : 'master',
      files: [],
      nCommitsAhead: 0,
      nCommitsBehind: 0,
      pastCommits: [],
      repository: pathRepository,
      tab: 0
    };
  }

  /**
   * Callback invoked immediately after mounting a component (i.e., inserting into a tree).
   */
  componentDidMount(): void {
    const { model, settings } = this.props;

    model.repositoryChanged.connect((_, args) => {
      this.setState({
        repository: args.newValue
      });
      this.refreshView();
    }, this);
    model.statusChanged.connect(() => {
      this.setState({
        files: model.status.files,
        nCommitsAhead: model.status.ahead,
        nCommitsBehind: model.status.behind
      });
    }, this);
    model.headChanged.connect(async () => {
      await this.refreshBranch();
      if (this.state.tab === 1) {
        this.refreshHistory();
      }
    }, this);
    model.markChanged.connect(() => this.forceUpdate(), this);

    settings.changed.connect(this.refreshView, this);
  }

  componentWillUnmount(): void {
    // Clear all signal connections
    Signal.clearData(this);
  }

  refreshBranch = async (): Promise<void> => {
    const { currentBranch } = this.props.model;

    this.setState({
      branches: this.props.model.branches,
      currentBranch: currentBranch ? currentBranch.name : 'master'
    });
  };

  refreshHistory = async (): Promise<void> => {
    if (this.props.model.pathRepository !== null) {
      // Get git log for current branch
      const logData = await this.props.model.log(
        this.props.settings.composite['historyCount'] as number
      );
      let pastCommits = new Array<Git.ISingleCommitInfo>();
      if (logData.code === 0) {
        pastCommits = logData.commits;
      }

      this.setState({
        pastCommits: pastCommits
      });
    }
  };

  /**
   * Refresh widget, update all content
   */
  refreshView = async (): Promise<void> => {
    if (this.props.model.pathRepository !== null) {
      await this.refreshBranch();
      await this.refreshHistory();
    }
  };

  /**
   * Commits all marked files.
   *
   * @param message - commit message
   * @returns a promise which commits the files
   */
  commitMarkedFiles = async (message: string): Promise<void> => {
    this.props.logger.log({
      level: Level.RUNNING,
      message: this.props.trans.__('Staging files...')
    });
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
    if (!message) {
      return;
    }

    const errorLog: ILogMessage = {
      level: Level.ERROR,
      message: this.props.trans.__('Failed to commit changes.')
    };

    try {
      const res = await this._hasIdentity(this.props.model.pathRepository);

      if (!res) {
        this.props.logger.log(errorLog);
        return;
      }

      this.props.logger.log({
        level: Level.RUNNING,
        message: this.props.trans.__('Committing changes...')
      });

      await this.props.model.commit(message);

      this.props.logger.log({
        level: Level.SUCCESS,
        message: this.props.trans.__('Committed changes.')
      });
    } catch (error) {
      console.error(error);
      this.props.logger.log({ ...errorLog, error });
    }
    const hasRemote = this.props.model.branches.some(
      branch => branch.is_remote_branch
    );
    // If enabled commit and push, push here
    if (this.props.settings.composite['commitAndPush'] && hasRemote) {
      await this.props.commands.execute(CommandIDs.gitPush);
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
        {this.state.repository ? (
          <React.Fragment>
            {this._renderToolbar()}
            {this._renderMain()}
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
        currentBranch={this.state.currentBranch}
        branches={this.state.branches}
        branching={!disableBranching}
        commands={this.props.commands}
        logger={this.props.logger}
        model={this.props.model}
        nCommitsAhead={this.state.nCommitsAhead}
        nCommitsBehind={this.state.nCommitsBehind}
        repository={this.state.repository || ''}
        trans={this.props.trans}
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
          title={this.props.trans.__('View changed files')}
          label={this.props.trans.__('Changes')}
          disableFocusRipple={true}
          disableRipple={true}
        />
        <Tab
          classes={{
            root: tabClass,
            selected: selectedTabClass
          }}
          title={this.props.trans.__('View commit history')}
          label={this.props.trans.__('History')}
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
    const hasRemote = this.props.model.branches.some(
      branch => branch.is_remote_branch
    );
    const commitAndPush =
      (this.props.settings.composite['commitAndPush'] as boolean) && hasRemote;
    const buttonLabel = commitAndPush
      ? this.props.trans.__('Commit and Push')
      : this.props.trans.__('Commit');
    return (
      <React.Fragment>
        <FileList
          files={this._sortedFiles}
          model={this.props.model}
          commands={this.props.commands}
          settings={this.props.settings}
          trans={this.props.trans}
        />
        {this.props.settings.composite['simpleStaging'] ? (
          <CommitBox
            commands={this.props.commands}
            hasFiles={this._markedFiles.length > 0}
            trans={this.props.trans}
            label={buttonLabel}
            onCommit={this.commitMarkedFiles}
          />
        ) : (
          <CommitBox
            commands={this.props.commands}
            hasFiles={this._hasStagedFile()}
            trans={this.props.trans}
            label={buttonLabel}
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
        commands={this.props.commands}
        trans={this.props.trans}
      />
    );
  }

  /**
   * Renders a panel for prompting a user to find a Git repository.
   *
   * @returns React element
   */
  private _renderWarning(): React.ReactElement {
    const path = this.props.filebrowser.path;
    const { commands } = this.props;

    return (
      <React.Fragment>
        <div className={warningTextClass}>
          {path ? (
            <React.Fragment>
              <b title={path}>{PathExt.basename(path)}</b>{' '}
              {this.props.trans.__('is not')}
            </React.Fragment>
          ) : (
            this.props.trans.__('You are not currently in')
          )}
          {this.props.trans.__(
            ' a Git repository. To use Git, navigate to a local repository, initialize a repository here, or clone an existing repository.'
          )}
        </div>
        <button
          className={repoButtonClass}
          onClick={() => commands.execute('filebrowser:toggle-main')}
        >
          {this.props.trans.__('Open the FileBrowser')}
        </button>
        <button
          className={repoButtonClass}
          onClick={() => commands.execute(CommandIDs.gitInit)}
        >
          {this.props.trans.__('Initialize a Repository')}
        </button>
        <button
          className={repoButtonClass}
          onClick={async () => {
            await commands.execute(CommandIDs.gitClone);
            await commands.execute('filebrowser:toggle-main');
          }}
        >
          {this.props.trans.__('Clone a Repository')}
        </button>
      </React.Fragment>
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
   * Determines whether a user has a known Git identity.
   *
   * @param path - repository path
   * @returns a promise which returns a success status
   */
  private async _hasIdentity(path: string): Promise<boolean> {
    // If the repository path changes, check the user identity
    if (path !== this._previousRepoPath) {
      try {
        const data: JSONObject = (await this.props.model.config()) as any;
        const options: JSONObject = data['options'] as JSONObject;
        const keys = Object.keys(options);

        // If the user name or e-mail is unknown, ask the user to set it
        if (keys.indexOf('user.name') < 0 || keys.indexOf('user.email') < 0) {
          const result = await showDialog({
            title: this.props.trans.__('Who is committing?'),
            body: new GitAuthorForm()
          });
          if (!result.button.accept) {
            console.log('User refuses to set identity.');
            return false;
          }
          const identity = result.value;
          try {
            await this.props.model.config({
              'user.name': identity.name,
              'user.email': identity.email
            });
          } catch (error) {
            if (error instanceof Git.GitResponseError) {
              console.log(error);
              return false;
            }
            throw error;
          }
        }
        this._previousRepoPath = path;
      } catch (error) {
        throw new Error(
          this.props.trans.__('Failed to set your identity. %1', error.message)
        );
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
