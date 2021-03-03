/* eslint-disable @typescript-eslint/quotes */
import { PathExt } from '@jupyterlab/coreutils';
import {
  caretDownIcon,
  caretUpIcon,
  refreshIcon
} from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import { Badge, Tab, Tabs } from '@material-ui/core';
import * as React from 'react';
import { classes } from 'typestyle';
import { CommandIDs } from '../commandsAndMenu';
import { Logger } from '../logger';
import {
  selectedTabClass,
  tabClass,
  tabIndicatorClass,
  tabsClass
} from '../style/GitPanel';
import { branchIcon, desktopIcon, pullIcon, pushIcon } from '../style/icons';
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
import { Git, IGitExtension, Level } from '../tokens';
import { ActionButton } from './ActionButton';
import { BranchMenu } from './BranchMenu';
import { TagMenu } from './TagMenu';
import {
  nullTranslator,
  ITranslator,
  TranslationBundle
} from '@jupyterlab/translation';

/**
 * Interface describing  properties.
 */
export interface IToolbarProps {
  /**
   * Current list of branches.
   */
  branches: Git.IBranch[];

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
   * Extension logger
   */
  logger: Logger;

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
  translator?: ITranslator;
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
}

/**
 * React component for rendering a panel toolbar.
 */
export class Toolbar extends React.Component<IToolbarProps, IToolbarState> {
  private translator: ITranslator;
  private _trans: TranslationBundle;
  /**
   * Returns a React component for rendering a panel toolbar.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: IToolbarProps) {
    super(props);
    this.translator = props.translator || nullTranslator;
    this._trans = this.translator.load('jupyterlab-git');

    this.state = {
      branchMenu: false,
      tab: 0
    };
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
    // FIXME whether the repository as a remote or not should be done through a call to `git remote`
    const hasRemote = this.props.branches.some(
      branch => branch.is_remote_branch
    );
    const hasUpstream = activeBranch[0]?.upstream !== null;

    return (
      <div className={toolbarNavClass}>
        <span className={spacer} />
        <Badge
          className={badgeClass}
          variant="dot"
          invisible={!hasRemote || this.props.nCommitsBehind === 0}
          data-test-id="pull-badge"
        >
          <ActionButton
            className={toolbarButtonClass}
            disabled={!hasRemote}
            icon={pullIcon}
            onClick={hasRemote ? this._onPullClick : undefined}
            title={
              hasRemote
                ? this._trans.__('Pull latest changes') +
                  (this.props.nCommitsBehind > 0
                    ? this._trans.__(
                        ` (behind by %1 commits)`,
                        this.props.nCommitsBehind
                      )
                    : '')
                : this._trans.__('No remote repository defined')
            }
          />
        </Badge>
        <Badge
          className={badgeClass}
          variant="dot"
          invisible={
            !hasRemote || (this.props.nCommitsAhead === 0 && hasUpstream)
          }
          data-test-id="push-badge"
        >
          <ActionButton
            className={toolbarButtonClass}
            disabled={!hasRemote}
            icon={pushIcon}
            onClick={hasRemote ? this._onPushClick : undefined}
            title={
              hasRemote
                ? hasUpstream
                  ? this._trans.__('Push committed changes') +
                    (this.props.nCommitsAhead > 0
                      ? this._trans.__(
                          ` (ahead by %1 commits)`,
                          this.props.nCommitsAhead
                        )
                      : '')
                  : this._trans.__('Publish branch')
                : this._trans.__('No remote repository defined')
            }
          />
        </Badge>

        <ActionButton
          className={toolbarButtonClass}
          icon={refreshIcon}
          onClick={this._onRefreshClick}
          title={this._trans.__(
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
    return (
      <div className={toolbarMenuWrapperClass}>
        <button
          disabled
          className={toolbarMenuButtonClass}
          title={this._trans.__(
            `Current repository: %1`,
            this.props.repository
          )}
        >
          <desktopIcon.react className={toolbarMenuButtonIconClass} />
          <div className={toolbarMenuButtonTitleWrapperClass}>
            <p className={toolbarMenuButtonTitleClass}>
              {' '}
              {this._trans.__('Current Repository')}{' '}
            </p>
            <p className={toolbarMenuButtonSubtitleClass}>
              {PathExt.basename(this.props.repository)}
            </p>
          </div>
        </button>
      </div>
    );
  }

  /**
   * Renders a branch menu.
   *
   * @returns React element
   */
  private _renderBranchMenu(): React.ReactElement | null {
    if (!this.props.model.pathRepository) {
      return null;
    }
    return (
      <div className={toolbarMenuWrapperClass}>
        <button
          className={classes(
            toolbarMenuButtonClass,
            toolbarMenuButtonEnabledClass
          )}
          title={this._trans.__('Manage branches and tags')}
          onClick={this._onBranchClick}
        >
          <branchIcon.react className={toolbarMenuButtonIconClass} />
          <div className={toolbarMenuButtonTitleWrapperClass}>
            <p className={toolbarMenuButtonTitleClass}>
              {this._trans.__('Current Branch')}
            </p>
            <p className={toolbarMenuButtonSubtitleClass}>
              {this.props.currentBranch || ''}
            </p>
          </div>
          {this.state.branchMenu ? (
            <caretUpIcon.react className={toolbarMenuButtonIconClass} />
          ) : (
            <caretDownIcon.react className={toolbarMenuButtonIconClass} />
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
            title={this._trans.__('View branches')}
            label={this._trans.__('Branches')}
            disableFocusRipple={true}
            disableRipple={true}
          ></Tab>
          <Tab
            classes={{
              root: tabClass,
              selected: selectedTabClass
            }}
            title={this._trans.__('View tags')}
            label={this._trans.__('Tags')}
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
        logger={this.props.logger}
        model={this.props.model}
        trans={this._trans}
      />
    );
  }

  private _renderTags(): JSX.Element {
    return (
      <TagMenu
        logger={this.props.logger}
        model={this.props.model}
        branching={this.props.branching}
        trans={this._trans}
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

  /**
   * Callback invoked upon clicking a button to refresh the model.
   *
   * @param event - event object
   * @returns a promise which resolves upon refreshing the model
   */
  private _onRefreshClick = async (): Promise<void> => {
    this.props.logger.log({
      level: Level.RUNNING,
      message: this._trans.__('Refreshing...')
    });
    try {
      await this.props.model.refresh();

      this.props.logger.log({
        level: Level.SUCCESS,
        message: this._trans.__('Successfully refreshed.')
      });
    } catch (error) {
      console.error(error);
      this.props.logger.log({
        level: Level.ERROR,
        message: this._trans.__('Failed to refresh.'),
        error
      });
    }
  };
}
