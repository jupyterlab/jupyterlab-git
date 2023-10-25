import { Dialog, Notification, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { JSONObject } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import { WarningRounded as WarningRoundedIcon } from '@mui/icons-material';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import * as React from 'react';
import { GitExtension } from '../model';
import { showError } from '../notifications';
import { hiddenButtonStyle } from '../style/ActionButtonStyle';
import {
  panelWrapperClass,
  repoButtonClass,
  selectedTabClass,
  tabClass,
  tabIndicatorClass,
  tabsClass,
  warningTextClass
} from '../style/GitPanel';
import { addIcon, rewindIcon, trashIcon } from '../style/icons';
import { CommandIDs, Git } from '../tokens';
import { openFileDiff, stopPropagationWrapper } from '../utils';
import { GitAuthorForm } from '../widgets/AuthorBox';
import { ActionButton } from './ActionButton';
import { CommitBox } from './CommitBox';
import { CommitComparisonBox } from './CommitComparisonBox';
import { FileList } from './FileList';
import { GitStash } from './GitStash';
import { HistorySideBar } from './HistorySideBar';
import { RebaseAction } from './RebaseAction';
import { Toolbar } from './Toolbar';
import { WarningBox } from './WarningBox';

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
   * List of tags.
   */
  tagsList: Git.ITag[];

  /**
   * List of changed files.
   */
  files: Git.IStatusFile[];

  /**
   * List of files changed on remote branch
   */
  remoteChangedFiles: Git.IStatusFile[];

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

  /**
   * Commit message summary.
   */
  commitSummary: string;

  /**
   * Commit message description.
   */
  commitDescription: string;

  /**
   * Amend option toggle
   */
  commitAmend: boolean;

  /**
   * Whether there are dirty (e.g., unsaved) staged files.
   */
  hasDirtyFiles: boolean;

  /**
   * The commit to compare against
   */
  referenceCommit: Git.ISingleCommitInfo | null;

  /**
   * The commit to compare
   */
  challengerCommit: Git.ISingleCommitInfo | null;

  /**
   * Stashed files
   *
   */
  stash: Git.IStash[];
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
    const {
      branches,
      currentBranch,
      pathRepository,
      hasDirtyFiles: hasDirtyStagedFiles,
      stash,
      tagsList
    } = props.model;

    this.state = {
      branches: branches,
      currentBranch: currentBranch ? currentBranch.name : 'main',
      files: [],
      remoteChangedFiles: [],
      nCommitsAhead: 0,
      nCommitsBehind: 0,
      pastCommits: [],
      repository: pathRepository,
      tab: 0,
      commitSummary: '',
      commitDescription: '',
      commitAmend: false,
      hasDirtyFiles: hasDirtyStagedFiles,
      referenceCommit: null,
      challengerCommit: null,
      stash: stash,
      tagsList: tagsList
    };
  }

  /**
   * Callback invoked immediately after mounting a component (i.e., inserting into a tree).
   */
  componentDidMount(): void {
    const { model, settings } = this.props;
    model.stashChanged.connect((_, args) => {
      this.setState({
        stash: args.newValue as any
      });
    }, this);
    model.repositoryChanged.connect((_, args) => {
      this.setState({
        repository: args.newValue,
        referenceCommit: null,
        challengerCommit: null
      });
      this.refreshView();
    }, this);
    model.statusChanged.connect(async () => {
      const remotechangedFiles: Git.IStatusFile[] =
        await model.remoteChangedFiles();
      this.setState({
        files: model.status.files,
        remoteChangedFiles: remotechangedFiles,
        nCommitsAhead: model.status.ahead,
        nCommitsBehind: model.status.behind
      });
    }, this);
    model.branchesChanged.connect(async () => {
      await this.refreshBranches();
    }, this);
    model.headChanged.connect(async () => {
      await this.refreshCurrentBranch();
      if (this.state.tab === 1) {
        this.refreshHistory();
      }
    }, this);
    model.tagsChanged.connect(async () => {
      await this.refreshTags();
    }, this);
    model.selectedHistoryFileChanged.connect(() => {
      this.setState({ tab: 1 });
      this.refreshHistory();
    }, this);
    model.remoteChanged.connect((_, args) => {
      this.warningDialog(args!);
    }, this);

    settings.changed.connect(this.refreshView, this);

    model.dirtyFilesStatusChanged.connect((_, args) => {
      this.setState({
        hasDirtyFiles: args
      });
    });
  }

  componentWillUnmount(): void {
    // Clear all signal connections
    Signal.clearData(this);
  }

  refreshBranches = async (): Promise<void> => {
    this.setState({
      branches: this.props.model.branches
    });
  };

  refreshCurrentBranch = async (): Promise<void> => {
    const { currentBranch } = this.props.model;

    this.setState({
      currentBranch: currentBranch ? currentBranch.name : 'main',
      referenceCommit: null,
      challengerCommit: null
    });
  };

  refreshTags = async (): Promise<void> => {
    this.setState({
      tagsList: this.props.model.tagsList
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
        pastCommits = logData.commits ?? [];
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
      await this.refreshBranches();
      await this.refreshHistory();
      await this.refreshTags();
    }
  };

  /**
   * Commits files.
   *
   * @returns a promise which commits changes
   */
  commitFiles = async (): Promise<void> => {
    let msg = this.state.commitSummary;

    // Only include description if not empty
    if (this.state.commitDescription) {
      msg = msg + '\n\n' + this.state.commitDescription + '\n';
    }

    if (!msg && !this.state.commitAmend) {
      return;
    }

    const commit = this.props.settings.composite['simpleStaging']
      ? this._commitMarkedFiles
      : this._commitStagedFiles;

    try {
      if (this.state.commitAmend) {
        await commit(null);
      } else {
        await commit(msg);
      }

      // Only erase commit message upon success
      this.setState({
        commitSummary: '',
        commitDescription: ''
      });
    } catch (error) {
      console.error(error);
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
        {this.state.repository !== null ? (
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

  private _gitStashClear = async (): Promise<void> => {
    await this.props.model.dropStash();
  };

  private _gitStashApplyLatest = async (): Promise<void> => {
    await this.props.model.applyStash(0);
  };

  /**
   * Callback invoked upon clicking a button to stash the dirty files.
   *
   * @param event - event object
   * @returns a promise which resolves upon stashing the latest changes
   */
  private _onStashClick = async (): Promise<void> => {
    await this.props.commands.execute(CommandIDs.gitStash);
  };

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
        tagsList={this.state.tagsList}
        branching={!disableBranching}
        commands={this.props.commands}
        pastCommits={this.state.pastCommits}
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
      ? this.state.commitAmend
        ? this.props.trans.__('Commit (Amend) and Push')
        : this.props.trans.__('Commit and Push')
      : this.state.commitAmend
      ? this.props.trans.__('Commit (Amend)')
      : this.props.trans.__('Commit');
    const warningTitle = this.props.trans.__('Warning');
    const inSimpleMode = this.props.settings.composite[
      'simpleStaging'
    ] as boolean;
    const warningContent = inSimpleMode
      ? this.props.trans.__(
          'You have unsaved tracked files. You probably want to save all changes before committing.'
        )
      : this.props.trans.__(
          'You have unsaved staged files. You probably want to save and stage all needed changes before committing.'
        );

    return (
      <React.Fragment>
        <FileList
          files={this._sortedFiles}
          model={this.props.model}
          commands={this.props.commands}
          settings={this.props.settings}
          trans={this.props.trans}
        />
        <GitStash
          actions={
            <React.Fragment>
              <ActionButton
                className={hiddenButtonStyle}
                icon={rewindIcon}
                onClick={this._onStashClick}
                title={this.props.trans.__('Stash latest changes')}
              />
              <ActionButton
                icon={addIcon}
                className={hiddenButtonStyle}
                disabled={this.props.model.stash?.length === 0}
                title={this.props.trans.__('Apply the latest stash')}
                onClick={stopPropagationWrapper(() => {
                  this._gitStashApplyLatest();
                })}
              />
              <ActionButton
                className={hiddenButtonStyle}
                icon={trashIcon}
                title={this.props.trans.__('Clear the entire stash')}
                disabled={this.props.model.stash?.length === 0}
                onClick={stopPropagationWrapper(() => {
                  this._gitStashClear();
                })}
              />
            </React.Fragment>
          }
          stash={this.props.model.stash}
          model={this.props.model}
          height={100}
          collapsible={true}
          trans={this.props.trans}
        />

        {this.props.model.status.state !== Git.State.REBASING ? (
          <CommitBox
            commands={this.props.commands}
            hasFiles={
              inSimpleMode
                ? this._markedFiles.length > 0
                : this._hasStagedFile()
            }
            trans={this.props.trans}
            label={buttonLabel}
            summary={this.state.commitSummary}
            description={this.state.commitDescription}
            amend={this.state.commitAmend}
            setSummary={this._setCommitSummary}
            setDescription={this._setCommitDescription}
            setAmend={this._setCommitAmend}
            onCommit={this.commitFiles}
            warning={
              this.state.hasDirtyFiles ? (
                <WarningBox
                  headerIcon={<WarningRoundedIcon />}
                  title={warningTitle}
                  content={warningContent}
                />
              ) : null
            }
          />
        ) : (
          <RebaseAction
            commands={this.props.commands}
            hasConflict={this.state.files.some(
              file => file.status === 'unmerged'
            )}
            trans={this.props.trans}
          ></RebaseAction>
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
      <React.Fragment>
        <HistorySideBar
          branches={this.state.branches}
          tagsList={this.state.tagsList}
          commits={this.state.pastCommits}
          model={this.props.model}
          commands={this.props.commands}
          trans={this.props.trans}
          referenceCommit={this.state.referenceCommit}
          challengerCommit={this.state.challengerCommit}
          onSelectForCompare={commit => async event => {
            event?.stopPropagation();
            this.setState({ referenceCommit: commit }, () => {
              this._openSingleFileComparison(
                event as React.MouseEvent<HTMLLIElement, MouseEvent>
              );
            });
          }}
          onCompareWithSelected={commit => async event => {
            event?.stopPropagation();
            this.setState({ challengerCommit: commit }, () => {
              this._openSingleFileComparison(
                event as React.MouseEvent<HTMLLIElement, MouseEvent>
              );
            });
          }}
        />
        {this.props.model.selectedHistoryFile === null &&
          (this.state.referenceCommit || this.state.challengerCommit) && (
            <CommitComparisonBox
              header={this.props.trans.__(
                'Compare %1 and %2',
                this.state.referenceCommit
                  ? this.state.referenceCommit.commit.substring(0, 7)
                  : '...',
                this.state.challengerCommit
                  ? this.state.challengerCommit.commit.substring(0, 7)
                  : '...'
              )}
              referenceCommit={this.state.referenceCommit}
              challengerCommit={this.state.challengerCommit}
              commands={this.props.commands}
              model={this.props.model}
              trans={this.props.trans}
              onClose={event => {
                event?.stopPropagation();
                this.setState({
                  referenceCommit: null,
                  challengerCommit: null
                });
              }}
              onOpenDiff={
                this.state.referenceCommit && this.state.challengerCommit
                  ? openFileDiff(this.props.commands)(
                      this.state.challengerCommit,
                      this.state.referenceCommit
                    )
                  : undefined
              }
            />
          )}
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
        {commands.hasCommand(CommandIDs.gitClone) && (
          <button
            className={repoButtonClass}
            onClick={async () => {
              await commands.execute(CommandIDs.gitClone);
              await commands.execute('filebrowser:toggle-main');
            }}
          >
            {this.props.trans.__('Clone a Repository')}
          </button>
        )}
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
   * Updates the commit message description.
   *
   * @param description - commit message description
   */
  private _setCommitDescription = (description: string): void => {
    this.setState({
      commitDescription: description
    });
  };

  /**
   * Updates the commit message summary.
   *
   * @param summary - commit message summary
   */
  private _setCommitSummary = (summary: string): void => {
    this.setState({
      commitSummary: summary
    });
  };

  /**
   * Updates the amend option
   *
   * @param amend - whether the amend is checked
   */
  private _setCommitAmend = (amend: boolean): void => {
    this.setState({
      commitAmend: amend
    });
  };

  /**
   * Commits all marked files.
   *
   * @param message - commit message
   * @returns a promise which commits the files
   */
  private _commitMarkedFiles = async (
    message: string | null
  ): Promise<void> => {
    const id = Notification.emit(
      this.props.trans.__('Staging files...'),
      'in-progress',
      { autoClose: false }
    );
    await this.props.model.reset();
    await this.props.model.add(...this._markedFiles.map(file => file.to));

    await this._commitStagedFiles(message, id);
  };

  /**
   * Commits all staged files.
   *
   * @param message - commit message
   * @returns a promise which commits the files
   */
  private _commitStagedFiles = async (
    message: string | null = null,
    notificationId?: string
  ): Promise<void> => {
    const errorMsg = this.props.trans.__('Failed to commit changes.');
    let id: string | null = notificationId ?? null;
    try {
      const author = await this._hasIdentity(this.props.model.pathRepository);

      const notificationMsg = this.props.trans.__('Committing changes...');
      if (id !== null) {
        Notification.update({
          id,
          message: notificationMsg,
          autoClose: false
        });
      } else {
        id = Notification.emit(notificationMsg, 'in-progress', {
          autoClose: false
        });
      }

      if (this.state.commitAmend) {
        await this.props.model.commit(null, true, author);
      } else {
        await this.props.model.commit(message, false, author);
      }

      Notification.update({
        id,
        type: 'success',
        message: this.props.trans.__('Committed changes.'),
        autoClose: 5000
      });

      const hasRemote = this.props.model.branches.some(
        branch => branch.is_remote_branch
      );

      // If enabled commit and push, push here
      if (this.props.settings.composite['commitAndPush'] && hasRemote) {
        await this.props.commands.execute(CommandIDs.gitPush);
      }
    } catch (error: any) {
      if (id === null) {
        Notification.error(errorMsg, showError(error, this.props.trans));
      } else {
        Notification.update({
          id,
          message: errorMsg,
          ...showError(error, this.props.trans)
        });
      }
      throw error;
    }
  };

  /**
   * Determines whether a user has a known Git identity.
   *
   * @param path - repository path
   */
  private async _hasIdentity(path: string | null): Promise<string | null> {
    if (!path) {
      return null;
    }

    // If the repository path changes or explicitly configured, check the user identity
    if (
      path !== this._previousRepoPath ||
      this.props.settings.composite['promptUserIdentity']
    ) {
      try {
        let userOrEmailNotSet = false;
        let author: Git.IIdentity | null;
        let authorOverride: string | null = null;

        if (this.props.model.lastAuthor === null) {
          const data: JSONObject = (await this.props.model.config()) as any;
          const options: JSONObject = data['options'] as JSONObject;

          author = {
            name: (options['user.name'] as string) || '',
            email: (options['user.email'] as string) || ''
          };
          userOrEmailNotSet = !author.name || !author.email;
        } else {
          author = this.props.model.lastAuthor;
        }

        // If explicitly configured or the user name or e-mail is unknown, ask the user to set it
        if (
          this.props.settings.composite['promptUserIdentity'] ||
          userOrEmailNotSet
        ) {
          const result = await showDialog({
            title: this.props.trans.__('Who is committing?'),
            body: new GitAuthorForm({ author, trans: this.props.trans })
          });

          if (!result.button.accept) {
            throw new Error(
              this.props.trans.__('User refused to set identity.')
            );
          }

          author = result.value;
          if (userOrEmailNotSet) {
            await this.props.model.config({
              'user.name': author!.name,
              'user.email': author!.email
            });
          }
          this.props.model.lastAuthor = author!;

          if (this.props.settings.composite['promptUserIdentity']) {
            authorOverride = `${author!.name} <${author!.email}>`;
          }
        }
        this._previousRepoPath = path;
        return authorOverride;
      } catch (error) {
        if (error instanceof Git.GitResponseError) {
          throw error;
        }

        throw new Error(
          // @ts-expect-error error will have message attribute
          this.props.trans.__('Failed to set your identity. %1', error.message)
        );
      }
    }

    return null;
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
    const { files, remoteChangedFiles } = this.state;
    let sfiles: Git.IStatusFile[] = files;
    if (remoteChangedFiles) {
      sfiles = sfiles.concat(remoteChangedFiles);
    }
    sfiles.sort((a, b) => a.to.localeCompare(b.to));
    return sfiles;
  }

  private _previousRepoPath: string | null = null;

  /**
   * Show a dialog when a notifyRemoteChanges signal is emitted from the model.
   */
  private async warningDialog(
    options: Git.IRemoteChangedNotification
  ): Promise<void> {
    const title = this.props.trans.__(
      'One or more open files are behind %1 head. Do you want to pull the latest remote version?',
      this.props.model.status.remote
    );
    const dialog = new Dialog({
      title,
      body: this._renderBody(options.notNotified, options.notified),
      buttons: [
        Dialog.cancelButton({
          label: this.props.trans.__('Continue Without Pulling')
        }),
        Dialog.warnButton({
          label: this.props.trans.__('Pull'),
          caption: this.props.trans.__('Git Pull from Remote Branch')
        })
      ]
    });
    const result = await dialog.launch();
    if (result.button.accept) {
      await this.props.commands.execute(CommandIDs.gitPull, {});
    }
  }

  /**
   * renders the body to be used in the remote changes warning dialog
   */
  private _renderBody(
    notNotifiedList: Git.IStatusFile[],
    notifiedList: Git.IStatusFile[] = []
  ): JSX.Element {
    const listedItems = notNotifiedList.map((item: Git.IStatusFile) => {
      console.log(item.to);
      const item_val = this.props.trans.__(item.to);
      return <li key={item_val}>{item_val}</li>;
    });
    let elem: JSX.Element = <ul>{listedItems}</ul>;
    if (notifiedList.length > 0) {
      const remaining = this.props.trans.__(
        'The following open files remain behind:'
      );
      const alreadyListedItems = notifiedList.map((item: Git.IStatusFile) => {
        console.log(item.to);
        const item_val = this.props.trans.__(item.to);
        return <li key={item_val}>{item_val}</li>;
      });
      const full: JSX.Element = (
        <div>
          {elem}
          {remaining}
          <ul>{alreadyListedItems}</ul>
        </div>
      );
      elem = full;
    }
    return <div>{elem}</div>;
  }

  /**
   *
   */
  private _openSingleFileComparison(
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ): void {
    if (
      this.props.model.selectedHistoryFile &&
      this.state.referenceCommit &&
      this.state.challengerCommit
    ) {
      openFileDiff(this.props.commands)(
        this.state.challengerCommit,
        this.state.referenceCommit
      )(
        this.props.model.selectedHistoryFile.to,
        !this.props.model.selectedHistoryFile.is_binary
      )(event);
    }
  }
}
