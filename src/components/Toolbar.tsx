import { Notification, UseSignal } from '@jupyterlab/apputils';
import { PageConfig, PathExt } from '@jupyterlab/coreutils';
import { TranslationBundle } from '@jupyterlab/translation';
import {
  caretDownIcon,
  caretUpIcon,
  refreshIcon
} from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import { Signal } from '@lumino/signaling';
import Badge from '@mui/material/Badge';
import * as React from 'react';
import { showError } from '../notifications';
import {
  badgeClass,
  branchInfoClass,
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
}

export class Toolbar extends React.Component<IToolbarProps, IToolbarState> {
  constructor(props: IToolbarProps) {
    super(props);
    this.state = {
      refreshInProgress: false,
      hasRemote: false,
      repoMenu: false
    };
  }

  /**
   * Check whether or not the repo has any remotes, and update the check
   * whenever the repository or its list of remotes changes.
   */
  componentDidMount(): void {
    this.props.model.repositoryChanged.connect(this._refreshRemotes, this);
    this.props.model.remotesChanged.connect(this._refreshRemotes, this);
    void this._refreshRemotes();
  }

  componentWillUnmount(): void {
    Signal.clearData(this);
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

  /**
   * Update the `hasRemote` state for the current repository.
   */
  private _refreshRemotes = async (): Promise<void> => {
    const fetchId = ++this._remotesFetchId;
    if (this.props.model.pathRepository === null) {
      this.setState({ hasRemote: false });
      return;
    }
    try {
      const remotes = await this.props.model.getRemotes();
      // Discard the response if a newer remotes update superseded this one
      if (fetchId === this._remotesFetchId) {
        this.setState({ hasRemote: remotes.length > 0 });
      }
    } catch (err) {
      if (fetchId === this._remotesFetchId) {
        this.setState({ hasRemote: false });
      }
      console.error(err);
    }
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
      await this._refreshRemotes();
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

  /**
   * Monotonic id used to discard outdated remotes responses.
   */
  private _remotesFetchId = 0;
}
