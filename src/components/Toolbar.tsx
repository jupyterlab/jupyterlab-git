import {
  IToolbarWidgetRegistry,
  Notification,
  ReactWidget,
  UseSignal
} from '@jupyterlab/apputils';
import { PageConfig, PathExt } from '@jupyterlab/coreutils';
import { TranslationBundle } from '@jupyterlab/translation';
import {
  caretDownIcon,
  caretUpIcon,
  refreshIcon
} from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import Badge from '@mui/material/Badge';
import * as React from 'react';
import { showError } from '../notifications';
import {
  badgeClass,
  branchInfoClass,
  branchNameClass,
  repoButtonClass,
  repoButtonLabelClass,
  repoLabelClass,
  toolbarButtonClass
} from '../style/Toolbar';
import { branchIcon, desktopIcon, pullIcon, pushIcon } from '../style/icons';
import { CommandIDs, Git, IGitExtension } from '../tokens';
import type { GitWidget } from '../widgets/GitWidget';
import { ActionButton } from './ActionButton';

/**
 * Toolbar factory name of the Git panel toolbar.
 */
export const GIT_PANEL_TOOLBAR_FACTORY = 'Git';

/**
 * Interface describing toolbar item properties.
 */
export interface IToolbarItemProps {
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
 * Interface describing repository toolbar item properties.
 */
export interface IRepositoryItemProps extends IToolbarItemProps {
  /**
   * The Git panel hosting the submodule menu.
   */
  panel: GitWidget;
}

/**
 * Interface describing remote action toolbar item properties.
 */
export interface IRemoteActionItemProps extends IToolbarItemProps {
  /**
   * Jupyter App commands registry
   */
  commands: CommandRegistry;
}

/**
 * Toolbar item displaying the current repository, as a plain label or as a
 * button toggling the submodule menu when the repository has submodules.
 */
export function RepositoryItem(props: IRepositoryItemProps): JSX.Element {
  const { model, panel, trans } = props;

  const getRepositoryName = (): string =>
    PathExt.basename(
      model.pathRepository || PageConfig.getOption('serverRoot')
    ) || 'Jupyter Server Root';

  const getFullRepositoryPath = (): string =>
    PageConfig.getOption('serverRoot') + '/' + (model.pathRepository ?? '');

  const renderLabel = (): JSX.Element => (
    <span
      className={repoLabelClass}
      title={trans.__('Current repository: %1', getFullRepositoryPath())}
    >
      <desktopIcon.react tag="span" className="jp-Icon" />
      <span className={repoButtonLabelClass}>{getRepositoryName()}</span>
    </span>
  );

  const renderButton = (menuShown: boolean): JSX.Element => (
    <button
      type="button"
      className={repoButtonClass}
      title={trans.__(
        'Current repository: %1 — click to switch submodule',
        getFullRepositoryPath()
      )}
      aria-haspopup="menu"
      aria-expanded={menuShown}
      onClick={() => panel.toggleSubmoduleMenu()}
    >
      <desktopIcon.react tag="span" className="jp-Icon" />
      <span className={repoButtonLabelClass}>{getRepositoryName()}</span>
      {menuShown ? (
        <caretUpIcon.react tag="span" className="jp-Icon" />
      ) : (
        <caretDownIcon.react tag="span" className="jp-Icon" />
      )}
    </button>
  );

  return (
    <UseSignal signal={model.repositoryChanged}>
      {() =>
        model.pathRepository === null ? null : (
          <UseSignal signal={model.submodulesChanged}>
            {() =>
              model.submodules.length > 0 ? (
                <UseSignal
                  signal={panel.submoduleMenuShownChanged}
                  initialArgs={panel.submoduleMenuShown}
                >
                  {(_, menuShown) => renderButton(menuShown ?? false)}
                </UseSignal>
              ) : (
                renderLabel()
              )
            }
          </UseSignal>
        )
      }
    </UseSignal>
  );
}

/**
 * Toolbar item displaying the current branch and repository state.
 */
export function BranchItem(props: IToolbarItemProps): JSX.Element {
  const { model, trans } = props;

  const renderBranch = (): JSX.Element => {
    const currentBranch = model.currentBranch?.name || 'main';
    let branchTitle: string;
    switch (model.status.state) {
      case Git.State.CHERRY_PICKING:
        branchTitle = trans.__('Cherry-picking on %1', currentBranch);
        break;
      case Git.State.DETACHED:
        branchTitle = trans.__('Detached HEAD at %1', currentBranch);
        break;
      case Git.State.MERGING:
        branchTitle = trans.__('Merging on %1', currentBranch);
        break;
      case Git.State.REBASING:
        branchTitle = trans.__('Rebasing %1', currentBranch);
        break;
      default:
        branchTitle = trans.__('Current branch: %1', currentBranch);
    }

    return (
      <span className={branchInfoClass} title={branchTitle}>
        <branchIcon.react tag="span" className="jp-Icon" />
        <span className={branchNameClass}>{currentBranch}</span>
      </span>
    );
  };

  return (
    <UseSignal signal={model.repositoryChanged}>
      {() =>
        model.pathRepository === null ? null : (
          <UseSignal signal={model.headChanged}>
            {() => (
              <UseSignal signal={model.statusChanged}>
                {() => renderBranch()}
              </UseSignal>
            )}
          </UseSignal>
        )
      }
    </UseSignal>
  );
}

/**
 * Toolbar item to pull the latest changes, with a badge showing whether the
 * current branch is behind its remote.
 */
export class PullItem extends React.Component<IRemoteActionItemProps> {
  render(): JSX.Element {
    const { model } = this.props;
    return (
      <UseSignal signal={model.repositoryChanged}>
        {() =>
          model.pathRepository === null ? null : (
            <UseSignal signal={model.statusChanged}>
              {() => (
                <UseSignal signal={model.remotesChanged}>
                  {() => this._renderButton()}
                </UseSignal>
              )}
            </UseSignal>
          )
        }
      </UseSignal>
    );
  }

  private _renderButton(): JSX.Element {
    const { model, trans } = this.props;
    const hasRemote = model.remotes.length > 0;
    return (
      <Badge
        className={badgeClass}
        variant="dot"
        invisible={!hasRemote || model.status.behind === 0}
      >
        <ActionButton
          className={toolbarButtonClass}
          disabled={!hasRemote}
          icon={pullIcon}
          onClick={hasRemote ? this._onPullClick : undefined}
          title={
            hasRemote
              ? trans.__('Pull latest changes') +
                (model.status.behind > 0
                  ? trans.__(' (behind by %1 commits)', model.status.behind)
                  : '')
              : trans.__('No remote repository defined')
          }
        />
      </Badge>
    );
  }

  private _onPullClick = async (): Promise<void> => {
    await this.props.commands.execute(CommandIDs.gitPull);
  };
}

/**
 * Toolbar item to push committed changes, with a badge showing whether the
 * current branch is ahead of its remote.
 */
export class PushItem extends React.Component<IRemoteActionItemProps> {
  render(): JSX.Element {
    const { model } = this.props;
    return (
      <UseSignal signal={model.repositoryChanged}>
        {() =>
          model.pathRepository === null ? null : (
            <UseSignal signal={model.branchesChanged}>
              {() => (
                <UseSignal signal={model.statusChanged}>
                  {() => (
                    <UseSignal signal={model.remotesChanged}>
                      {() => this._renderButton()}
                    </UseSignal>
                  )}
                </UseSignal>
              )}
            </UseSignal>
          )
        }
      </UseSignal>
    );
  }

  private _renderButton(): JSX.Element {
    const { model, trans } = this.props;
    const activeBranch = model.branches.filter(
      branch => branch.is_current_branch
    );
    const hasRemote = model.remotes.length > 0;
    const hasUpstream = activeBranch[0]?.upstream !== null;
    return (
      <Badge
        className={badgeClass}
        variant="dot"
        invisible={!hasRemote || (model.status.ahead === 0 && hasUpstream)}
      >
        <ActionButton
          className={toolbarButtonClass}
          disabled={!hasRemote}
          icon={pushIcon}
          onClick={hasRemote ? this._onPushClick : undefined}
          title={
            hasRemote
              ? hasUpstream
                ? trans.__('Push committed changes') +
                  (model.status.ahead > 0
                    ? trans.__(' (ahead by %1 commits)', model.status.ahead)
                    : '')
                : trans.__('Publish branch')
              : trans.__('No remote repository defined')
          }
        />
      </Badge>
    );
  }

  private _onPushClick = async (): Promise<void> => {
    await this.props.commands.execute(CommandIDs.gitPush);
  };
}

/**
 * Interface describing refresh item state.
 */
interface IRefreshItemState {
  /**
   * Boolean indicating whether a refresh is currently in progress.
   */
  refreshInProgress: boolean;
}

/**
 * Toolbar item to refresh the repository.
 */
export class RefreshItem extends React.Component<
  IToolbarItemProps,
  IRefreshItemState
> {
  constructor(props: IToolbarItemProps) {
    super(props);
    this.state = { refreshInProgress: false };
  }

  render(): JSX.Element {
    const { model, trans } = this.props;
    return (
      <UseSignal signal={model.repositoryChanged}>
        {() =>
          model.pathRepository === null ? null : (
            <ActionButton
              className={toolbarButtonClass}
              icon={refreshIcon}
              onClick={this._onRefreshClick}
              disabled={this.state.refreshInProgress}
              title={trans.__(
                'Refresh the repository to detect local and remote changes'
              )}
            />
          )
        }
      </UseSignal>
    );
  }

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
}

/**
 * Add the Git panel toolbar item factories to the toolbar registry.
 *
 * @param toolbarRegistry Toolbar widget registry
 * @param model Git extension data model
 * @param commands Jupyter App commands registry
 * @param trans The application language translator
 */
export function addToolbarItems(
  toolbarRegistry: IToolbarWidgetRegistry,
  model: IGitExtension,
  commands: CommandRegistry,
  trans: TranslationBundle
): void {
  const addItem = (
    name: string,
    itemClass: string,
    render: (panel: GitWidget) => JSX.Element
  ): void => {
    toolbarRegistry.addFactory<GitWidget>(
      GIT_PANEL_TOOLBAR_FACTORY,
      name,
      panel => {
        const widget = ReactWidget.create(render(panel));
        widget.addClass(itemClass);
        return widget;
      }
    );
  };

  addItem('repository', 'jp-git-toolbarRepository', panel => (
    <RepositoryItem model={model} panel={panel} trans={trans} />
  ));
  addItem('branch', 'jp-git-toolbarBranch', () => (
    <BranchItem model={model} trans={trans} />
  ));
  addItem('pull', 'jp-git-toolbarPull', () => (
    <PullItem commands={commands} model={model} trans={trans} />
  ));
  addItem('push', 'jp-git-toolbarPush', () => (
    <PushItem commands={commands} model={model} trans={trans} />
  ));
  addItem('refresh', 'jp-git-toolbarRefresh', () => (
    <RefreshItem model={model} trans={trans} />
  ));
}
