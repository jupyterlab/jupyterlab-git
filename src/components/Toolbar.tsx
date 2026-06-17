import {
  Dialog,
  Notification,
  showDialog,
  UseSignal
} from '@jupyterlab/apputils';
import { PageConfig, PathExt } from '@jupyterlab/coreutils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TranslationBundle } from '@jupyterlab/translation';
import {
  caretDownIcon,
  caretUpIcon,
  refreshIcon
} from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import Badge from '@mui/material/Badge';
import * as React from 'react';
import { Operation, showGitOperationDialog } from '../commandsAndMenu';
import { showError } from '../notifications';
import {
  badgeClass,
  branchInfoClass,
  branchWarningButtonClass,
  branchWarningTextClass,
  branchNameClass,
  repoBranchColumnClass,
  repoButtonClass,
  repoButtonLabelClass,
  repoLabelClass,
  spacer,
  toolbarButtonClass,
  toolbarClass,
  toolbarMenuWrapperClass,
  toolbarNavClass
} from '../style/Toolbar';
import { branchIcon, desktopIcon, pullIcon, pushIcon } from '../style/icons';
import { CommandIDs, Git, IGitExtension } from '../tokens';
import { ActionButton } from './ActionButton';
import { SubmoduleMenu } from './SubmoduleMenu';

/**
 * Interface describing  properties.
 */
export interface IToolbarProps {
  /**
   * Jupyter App commands registry
   */
  commands: CommandRegistry;

  /**
   * Git extension data model.
   */
  model: IGitExtension;

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
export interface IToolbarState {
  /**
   * Boolean indicating whether a refresh is currently in progress.
   */
  refreshInProgress: boolean;

  /**
   * Boolean indicating whether a remote exists.
   */
  hasRemote: boolean;

  /**
   * Boolean indicating whether the repository menu is shown.
   */
  repoMenu: boolean;

  /**
   * Number of commits the current branch is behind a configured reference.
   */
  commitsBehindReference: number;
}

export class Toolbar extends React.Component<IToolbarProps, IToolbarState> {
  constructor(props: IToolbarProps) {
    super(props);
    this.state = {
      refreshInProgress: false,
      hasRemote: false,
      repoMenu: false,
      commitsBehindReference: 0
    };
  }

  /**
   * Check whether or not the repo has any remotes
   */
  async componentDidMount(): Promise<void> {
    this.props.model.branchesChanged.connect(
      this._refreshBehindReferenceWarning
    );
    this.props.model.headChanged.connect(this._refreshBehindReferenceWarning);
    this.props.model.repositoryChanged.connect(
      this._refreshBehindReferenceWarning
    );
    this.props.settings.changed.connect(this._refreshBehindReferenceWarning);

    try {
      const remotes = await this.props.model.getRemotes();
      const hasRemote = remotes.length > 0;
      this.setState({ hasRemote });
    } catch (err) {
      console.error(err);
    }

    await this._refreshBehindReferenceWarning();
  }

  componentWillUnmount(): void {
    this.props.model.branchesChanged.disconnect(
      this._refreshBehindReferenceWarning
    );
    this.props.model.headChanged.disconnect(
      this._refreshBehindReferenceWarning
    );
    this.props.model.repositoryChanged.disconnect(
      this._refreshBehindReferenceWarning
    );
    this.props.settings.changed.disconnect(this._refreshBehindReferenceWarning);
  }

  render(): React.ReactElement {
    return (
      <UseSignal signal={this.props.model.repositoryChanged}>
        {() => {
          if (this.props.model.pathRepository === null) {
            return <div className={toolbarClass} />;
          }
          return (
            <UseSignal signal={this.props.model.headChanged}>
              {() => (
                <UseSignal signal={this.props.model.branchesChanged}>
                  {() => (
                    <UseSignal signal={this.props.model.statusChanged}>
                      {() => (
                        <UseSignal signal={this.props.model.submodulesChanged}>
                          {() => (
                            <div className={toolbarClass}>
                              {this._renderToolbarRow()}
                              {this.state.repoMenu
                                ? this._renderSubmodules()
                                : null}
                            </div>
                          )}
                        </UseSignal>
                      )}
                    </UseSignal>
                  )}
                </UseSignal>
              )}
            </UseSignal>
          );
        }}
      </UseSignal>
    );
  }

  private _renderToolbarRow(): React.ReactElement {
    const hasSubmodules = this.props.model.submodules.length > 0;
    return (
      <div className={toolbarNavClass}>
        <div className={repoBranchColumnClass}>
          {hasSubmodules ? this._renderRepoButton() : this._renderRepoLabel()}
          {this._renderBranchInfo()}
          {this._renderBehindReferenceWarning()}
        </div>
        <span className={spacer} />
        {this._renderRemoteActions()}
      </div>
    );
  }

  private _renderRepoLabel(): React.ReactElement {
    const repositoryName = this._getRepositoryName();
    return (
      <span
        className={repoLabelClass}
        title={this.props.trans.__(
          'Current repository: %1',
          this._getFullRepositoryPath()
        )}
      >
        <desktopIcon.react tag="span" className="jp-Icon" />
        <span className={repoButtonLabelClass}>{repositoryName}</span>
      </span>
    );
  }

  private _renderRepoButton(): React.ReactElement {
    const repositoryName = this._getRepositoryName();
    return (
      <button
        type="button"
        className={repoButtonClass}
        title={this.props.trans.__(
          'Current repository: %1 — click to switch submodule',
          this._getFullRepositoryPath()
        )}
        aria-haspopup="menu"
        aria-expanded={this.state.repoMenu}
        onClick={this._onRepoClick}
      >
        <desktopIcon.react tag="span" className="jp-Icon" />
        <span className={repoButtonLabelClass}>{repositoryName}</span>
        {this.state.repoMenu ? (
          <caretUpIcon.react tag="span" className="jp-Icon" />
        ) : (
          <caretDownIcon.react tag="span" className="jp-Icon" />
        )}
      </button>
    );
  }

  private _renderBranchInfo(): React.ReactElement {
    const currentBranch = this.props.model.currentBranch?.name || 'main';
    let branchTitle: string;
    switch (this.props.model.status.state) {
      case Git.State.CHERRY_PICKING:
        branchTitle = this.props.trans.__(
          'Cherry-picking on %1',
          currentBranch
        );
        break;
      case Git.State.DETACHED:
        branchTitle = this.props.trans.__('Detached HEAD at %1', currentBranch);
        break;
      case Git.State.MERGING:
        branchTitle = this.props.trans.__('Merging on %1', currentBranch);
        break;
      case Git.State.REBASING:
        branchTitle = this.props.trans.__('Rebasing %1', currentBranch);
        break;
      default:
        branchTitle = this.props.trans.__('Current branch: %1', currentBranch);
    }

    return (
      <span className={branchInfoClass} title={branchTitle}>
        <branchIcon.react tag="span" className="jp-Icon" />
        <span className={branchNameClass}>{currentBranch}</span>
      </span>
    );
  }

  private _renderBehindReferenceWarning(): React.ReactElement | null {
    const { enabled, threshold, reference } =
      this._getBehindReferenceSettings();
    const commitsBehind = this.state.commitsBehindReference;
    const shouldWarn = enabled && commitsBehind >= threshold;
    if (!shouldWarn) {
      return null;
    }

    return (
      <button
        type="button"
        className={branchWarningButtonClass}
        onClick={this._onBehindReferenceWarningClick}
        title={this.props.trans.__(
          "Current branch is %1 commits behind '%2'. Click for options.",
          commitsBehind,
          reference
        )}
      >
        <WarningRoundedIcon fontSize="inherit" />
        <span className={branchWarningTextClass}>
          {this.props.trans.__('%1 behind %2', commitsBehind, reference)}
        </span>
      </button>
    );
  }

  private _renderRemoteActions(): React.ReactElement {
    const activeBranch = this.props.model.branches.filter(
      branch => branch.is_current_branch
    );
    const hasRemote = this.state.hasRemote;
    const hasUpstream = activeBranch[0]?.upstream !== null;

    return (
      <React.Fragment>
        <Badge
          className={badgeClass}
          variant="dot"
          invisible={!hasRemote || this.props.model.status.behind === 0}
        >
          <ActionButton
            className={toolbarButtonClass}
            disabled={!hasRemote}
            icon={pullIcon}
            onClick={hasRemote ? this._onPullClick : undefined}
            title={
              hasRemote
                ? this.props.trans.__('Pull latest changes') +
                  (this.props.model.status.behind > 0
                    ? this.props.trans.__(
                        ' (behind by %1 commits)',
                        this.props.model.status.behind
                      )
                    : '')
                : this.props.trans.__('No remote repository defined')
            }
          />
        </Badge>
        <Badge
          className={badgeClass}
          variant="dot"
          invisible={
            !hasRemote || (this.props.model.status.ahead === 0 && hasUpstream)
          }
        >
          <ActionButton
            className={toolbarButtonClass}
            disabled={!hasRemote}
            icon={pushIcon}
            onClick={hasRemote ? this._onPushClick : undefined}
            title={
              hasRemote
                ? hasUpstream
                  ? this.props.trans.__('Push committed changes') +
                    (this.props.model.status.ahead > 0
                      ? this.props.trans.__(
                          ' (ahead by %1 commits)',
                          this.props.model.status.ahead
                        )
                      : '')
                  : this.props.trans.__('Publish branch')
                : this.props.trans.__('No remote repository defined')
            }
          />
        </Badge>
        <ActionButton
          className={toolbarButtonClass}
          icon={refreshIcon}
          onClick={this._onRefreshClick}
          disabled={this.state.refreshInProgress}
          title={this.props.trans.__(
            'Refresh the repository to detect local and remote changes'
          )}
        />
      </React.Fragment>
    );
  }

  private _renderSubmodules(): JSX.Element {
    return (
      <div className={toolbarMenuWrapperClass}>
        <SubmoduleMenu
          model={this.props.model}
          submodules={this.props.model.submodules}
          trans={this.props.trans}
        />
      </div>
    );
  }

  private _getRepositoryName(): string {
    return (
      PathExt.basename(
        this.props.model.pathRepository || PageConfig.getOption('serverRoot')
      ) || 'Jupyter Server Root'
    );
  }

  private _getFullRepositoryPath(): string {
    return (
      PageConfig.getOption('serverRoot') +
      '/' +
      (this.props.model.pathRepository ?? '')
    );
  }

  private _getBehindReferenceSettings(): {
    enabled: boolean;
    threshold: number;
    reference: string;
  } {
    const enabled =
      (this.props.settings.composite[
        'branchBehindWarningEnabled'
      ] as boolean) ?? false;
    const thresholdSetting = this.props.settings.composite[
      'branchBehindWarningThreshold'
    ] as number;
    const threshold = Number.isFinite(thresholdSetting)
      ? Math.max(1, Math.floor(thresholdSetting))
      : 250;
    const referenceSetting =
      (this.props.settings.composite[
        'branchBehindWarningReference'
      ] as string) ?? 'origin/main';
    const reference = referenceSetting.trim() || 'origin/main';

    return { enabled, threshold, reference };
  }

  private _refreshBehindReferenceWarning = async (): Promise<void> => {
    const { enabled, reference } = this._getBehindReferenceSettings();
    const requestId = ++this._compareRequestId;

    if (!enabled || this.props.model.pathRepository === null) {
      if (this.state.commitsBehindReference !== 0) {
        this.setState({
          commitsBehindReference: 0
        });
      }
      return;
    }

    try {
      const data = await this.props.model.compareWithReference(reference);
      if (requestId !== this._compareRequestId) {
        return;
      }
      const commitsBehindReference = data.behind ?? 0;
      if (this.state.commitsBehindReference !== commitsBehindReference) {
        this.setState({
          commitsBehindReference
        });
      }
    } catch {
      if (requestId !== this._compareRequestId) {
        return;
      }
      // The configured reference may not exist in this repository yet.
      if (this.state.commitsBehindReference !== 0) {
        this.setState({
          commitsBehindReference: 0
        });
      }
    }
  };

  private _onBehindReferenceWarningClick = async (): Promise<void> => {
    const { threshold, reference } = this._getBehindReferenceSettings();
    const commitsBehind = this.state.commitsBehindReference;

    const result = await showDialog({
      title: this.props.trans.__('Branch Behind Warning'),
      body: this.props.trans.__(
        "The current branch '%1' is %2 commits behind '%3' (threshold: %4).\n\nRebasing now can reduce future merge conflicts.",
        this.props.model.currentBranch?.name ?? 'HEAD',
        commitsBehind,
        reference,
        threshold
      ),
      buttons: [
        Dialog.cancelButton({ label: this.props.trans.__('Cancel') }),
        Dialog.warnButton({ label: this.props.trans.__('Fetch & Rebase') })
      ]
    });

    if (!result.button.accept) {
      return;
    }

    const fetchNotification = Notification.emit(
      this.props.trans.__('Fetching latest changes…'),
      'in-progress'
    );
    try {
      await showGitOperationDialog(
        this.props.model,
        Operation.Fetch,
        this.props.trans
      );
      Notification.update({
        id: fetchNotification,
        type: 'success',
        message: this.props.trans.__('Successfully fetched latest changes.')
      });
    } catch (error: any) {
      if (error.name === 'CancelledError') {
        Notification.dismiss(fetchNotification);
        return;
      }
      Notification.update({
        id: fetchNotification,
        type: 'error',
        message: this.props.trans.__('Failed to fetch latest changes.'),
        ...showError(error as Error, this.props.trans)
      });
      return;
    }

    await this.props.commands.execute(CommandIDs.gitRebase, {
      branch: reference
    });
    await this.props.model.refresh();
    await this._refreshBehindReferenceWarning();
  };

  private _onPullClick = async (): Promise<void> => {
    await this.props.commands.execute(CommandIDs.gitPull);
  };

  private _onPushClick = async (): Promise<void> => {
    await this.props.commands.execute(CommandIDs.gitPush);
  };

  private _onRepoClick = (): void => {
    this.setState({ repoMenu: !this.state.repoMenu });
  };

  /**
   * Callback invoked upon clicking a button to refresh the model.
   */
  private _onRefreshClick = async (): Promise<void> => {
    const id = Notification.emit(
      this.props.trans.__('Refreshing…'),
      'in-progress',
      { autoClose: false }
    );
    this.setState({ refreshInProgress: true });
    try {
      await this.props.model.refresh();
      Notification.update({
        id,
        message: this.props.trans.__('Successfully refreshed.'),
        type: 'success',
        autoClose: 5000
      });
    } catch (error: any) {
      console.error(error);
      Notification.update({
        id,
        message: this.props.trans.__('Failed to refresh.'),
        type: 'error',
        ...showError(error, this.props.trans)
      });
    } finally {
      this.setState({ refreshInProgress: false });
    }
  };

  private _compareRequestId = 0;
}
