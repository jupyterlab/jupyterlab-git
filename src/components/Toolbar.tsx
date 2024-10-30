import { Notification } from '@jupyterlab/apputils';
import { PageConfig, PathExt } from '@jupyterlab/coreutils';
import { TranslationBundle } from '@jupyterlab/translation';
import {
  caretDownIcon,
  caretUpIcon,
  refreshIcon
} from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import { Badge, Tab, Tabs } from '@mui/material';
import * as React from 'react';
import { classes } from 'typestyle';
import { showError } from '../notifications';
import {
  selectedTabClass,
  tabClass,
  tabIndicatorClass,
  tabsClass
} from '../style/GitPanel';
import {
  badgeClass,
  spacer,
  toolbarButtonClass,
  toolbarClass,
  toolbarMenuButtonClass,
  toolbarMenuButtonEnabledClass,
  toolbarMenuButtonIconClass,
  toolbarMenuButtonSubtitleClass,
  toolbarMenuButtonTitleClass,
  toolbarMenuButtonTitleWrapperClass,
  toolbarMenuWrapperClass,
  toolbarNavClass
} from '../style/Toolbar';
import { branchIcon, desktopIcon, pullIcon, pushIcon } from '../style/icons';
import { CommandIDs, Git, IGitExtension } from '../tokens';
import { ActionButton } from './ActionButton';
import { BranchMenu } from './BranchMenu';
import { SubModuleMenu } from './SubModuleMenu';
import { TagMenu } from './TagMenu';

/**
 * Interface describing  properties.
 */
export interface IToolbarProps {
  /**
   * Current list of branches.
   */
  branches: Git.IBranch[];

  /**
   * Current list of tags.
   */
  tagsList: Git.ITag[];

  /**
   * Boolean indicating whether branching is disabled.
   */
  branching: boolean;

  /**
   * Jupyter App commands registry
   */
  commands: CommandRegistry;

  /**
   * Current branch name.
   */
  currentBranch: string;

  /**
   * List of prior commits.
   */
  pastCommits: Git.ISingleCommitInfo[];

  /**
   * Git extension data model.
   */
  model: IGitExtension;

  /**
   * Number of commits ahead
   */
  nCommitsAhead: number;

  /**
   * Number of commits behind
   */
  nCommitsBehind: number;

  /**
   * Current repository.
   */
  repository: string;

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
   * Boolean indicating whether a branch menu is shown.
   */
  branchMenu: boolean;

  /**
   * Panel tab identifier.
   */
  tab: number;

  /**
   * Boolean indicating whether a refresh is currently in progress.
   */
  refreshInProgress: boolean;

  /**
   * Boolean indicating whether a remote exists.
   */
  hasRemote: boolean;

  repoMenu: boolean;
}

/**
 * React component for rendering a panel toolbar.
 */
export class Toolbar extends React.Component<IToolbarProps, IToolbarState> {
  /**
   * Returns a React component for rendering a panel toolbar.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: IToolbarProps) {
    super(props);
    this.state = {
      branchMenu: false,
      tab: 0,
      refreshInProgress: false,
      hasRemote: false,
      repoMenu: false
    };
  }

  /**
   * Check whether or not the repo has any remotes
   */
  async componentDidMount(): Promise<void> {
    try {
      const remotes = await this.props.model.getRemotes();
      const hasRemote = remotes.length > 0 ? true : false;
      this.setState({ hasRemote });
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <div className={toolbarClass}>
        {this._renderTopNav()}
        {this._renderRepoMenu()}
        {this._renderBranchMenu()}
      </div>
    );
  }

  /**
   * Renders the top navigation.
   *
   * @returns React element
   */
  private _renderTopNav(): React.ReactElement {
    const activeBranch = this.props.branches.filter(
      branch => branch.is_current_branch
    );
    const hasRemote = this.state.hasRemote;
    const hasUpstream = activeBranch[0]?.upstream !== null;

    return (
      <div className={toolbarNavClass}>
        <span className={spacer} />
        <Badge
          className={badgeClass}
          variant="dot"
          invisible={!hasRemote || this.props.nCommitsBehind === 0}
        >
          <ActionButton
            className={toolbarButtonClass}
            disabled={!hasRemote}
            icon={pullIcon}
            onClick={hasRemote ? this._onPullClick : undefined}
            title={
              hasRemote
                ? this.props.trans.__('Pull latest changes') +
                  (this.props.nCommitsBehind > 0
                    ? this.props.trans.__(
                        ' (behind by %1 commits)',
                        this.props.nCommitsBehind
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
            !hasRemote || (this.props.nCommitsAhead === 0 && hasUpstream)
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
                    (this.props.nCommitsAhead > 0
                      ? this.props.trans.__(
                          ' (ahead by %1 commits)',
                          this.props.nCommitsAhead
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
      </div>
    );
  }

  /**
   * Renders a repository menu.
   *
   * @returns React element
   */
  private _renderRepoMenu(): React.ReactElement {
    const hasModules = !(this.props.model.subModules.length === 0);
    const repositoryName =
      PathExt.basename(
        this.props.repository || PageConfig.getOption('serverRoot')
      ) || 'Jupyter Server Root';
    return (
      <div className={toolbarMenuWrapperClass}>
        <button
          disabled={!hasModules}
          className={classes(
            toolbarMenuButtonClass,
            hasModules && toolbarMenuButtonEnabledClass
          )}
          title={this.props.trans.__(
            'Current repository: %1',
            PageConfig.getOption('serverRoot') + '/' + this.props.repository
          )}
          onClick={this._onRepoClick}
        >
          <desktopIcon.react
            tag="span"
            className={toolbarMenuButtonIconClass}
          />
          <div className={toolbarMenuButtonTitleWrapperClass}>
            <p className={toolbarMenuButtonTitleClass}>
              {this.props.trans.__('Current Repository')}
            </p>
            <p className={toolbarMenuButtonSubtitleClass}>{repositoryName}</p>
          </div>
          {hasModules &&
            (this.state.repoMenu ? (
              <caretUpIcon.react
                tag="span"
                className={toolbarMenuButtonIconClass}
              />
            ) : (
              <caretDownIcon.react
                tag="span"
                className={toolbarMenuButtonIconClass}
              />
            ))}
        </button>
        {this.state.repoMenu ? this._renderSubModules() : null}
      </div>
    );
  }

  /**
   * Renders a branch menu.
   *
   * @returns React element
   */
  private _renderBranchMenu(): React.ReactElement | null {
    let branchTitle = '';
    if (this.props.model.pathRepository === null) {
      return null;
    }
    switch (this.props.model.status.state) {
      case Git.State.CHERRY_PICKING:
        branchTitle = this.props.trans.__('Cherry picking in');
        break;
      case Git.State.DETACHED:
        branchTitle = this.props.trans.__('Detached Head at');
        break;
      case Git.State.MERGING:
        branchTitle = this.props.trans.__('Merging in');
        break;
      case Git.State.REBASING:
        branchTitle = this.props.trans.__('Rebasing');
        break;
      default:
        branchTitle = this.props.trans.__('Current Branch');
    }

    return (
      <div className={toolbarMenuWrapperClass}>
        <button
          className={classes(
            toolbarMenuButtonClass,
            toolbarMenuButtonEnabledClass
          )}
          title={this.props.trans.__('Manage branches and tags')}
          onClick={this._onBranchClick}
        >
          <branchIcon.react tag="span" className={toolbarMenuButtonIconClass} />
          <div className={toolbarMenuButtonTitleWrapperClass}>
            <p className={toolbarMenuButtonTitleClass}>{branchTitle}</p>
            <p className={toolbarMenuButtonSubtitleClass}>
              {this.props.currentBranch || ''}
            </p>
          </div>
          {this.state.branchMenu ? (
            <caretUpIcon.react
              tag="span"
              className={toolbarMenuButtonIconClass}
            />
          ) : (
            <caretDownIcon.react
              tag="span"
              className={toolbarMenuButtonIconClass}
            />
          )}
        </button>
        {this.state.branchMenu ? this._renderTabs() : null}
      </div>
    );
  }

  private _renderTabs(): JSX.Element {
    return (
      <React.Fragment>
        <Tabs
          classes={{
            root: tabsClass,
            indicator: tabIndicatorClass
          }}
          value={this.state.tab}
          onChange={(event: any, tab: number): void => {
            this.setState({
              tab: tab
            });
          }}
        >
          <Tab
            classes={{
              root: tabClass,
              selected: selectedTabClass
            }}
            title={this.props.trans.__('View branches')}
            label={this.props.trans.__('Branches')}
            disableFocusRipple={true}
            disableRipple={true}
          ></Tab>
          <Tab
            classes={{
              root: tabClass,
              selected: selectedTabClass
            }}
            title={this.props.trans.__('View tags')}
            label={this.props.trans.__('Tags')}
            disableFocusRipple={true}
            disableRipple={true}
          ></Tab>
        </Tabs>
        {this.state.tab === 0 ? this._renderBranches() : this._renderTags()}
      </React.Fragment>
    );
  }

  private _renderBranches(): JSX.Element {
    return (
      <BranchMenu
        currentBranch={this.props.currentBranch || ''}
        branches={this.props.branches}
        branching={this.props.branching}
        commands={this.props.commands}
        model={this.props.model}
        trans={this.props.trans}
      />
    );
  }

  private _renderSubModules(): JSX.Element {
    return (
      <SubModuleMenu
        subModuleList={this.props.model.subModules}
        model={this.props.model}
        trans={this.props.trans}
      />
    );
  }

  private _renderTags(): JSX.Element {
    return (
      <TagMenu
        pastCommits={this.props.pastCommits}
        tagsList={this.props.tagsList}
        model={this.props.model}
        branching={this.props.branching}
        trans={this.props.trans}
      ></TagMenu>
    );
  }

  /**
   * Callback invoked upon clicking a button to pull the latest changes.
   *
   * @param event - event object
   * @returns a promise which resolves upon pulling the latest changes
   */
  private _onPullClick = async (): Promise<void> => {
    await this.props.commands.execute(CommandIDs.gitPull);
  };

  /**
   * Callback invoked upon clicking a button to push the latest changes.
   *
   * @param event - event object
   * @returns a promise which resolves upon pushing the latest changes
   */
  private _onPushClick = async (): Promise<void> => {
    await this.props.commands.execute(CommandIDs.gitPush);
  };

  /**
   * Callback invoked upon clicking a button to change the current branch.
   *
   * @param event - event object
   */
  private _onBranchClick = (): void => {
    // Toggle the branch menu:
    this.setState({
      branchMenu: !this.state.branchMenu
    });
  };

  private _onRepoClick = (): void => {
    // Toggle the submodule menu:
    this.setState({
      repoMenu: !this.state.repoMenu
    });
  };

  /**
   * Callback invoked upon clicking a button to refresh the model.
   *
   * @param event - event object
   * @returns a promise which resolves upon refreshing the model
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
}
