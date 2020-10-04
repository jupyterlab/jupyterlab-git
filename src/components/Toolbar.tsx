import { showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { CommandRegistry } from '@phosphor/commands';
import * as React from 'react';
import { classes } from 'typestyle';
import { CommandIDs } from '../commandsAndMenu';
import { Logger } from '../logger';
import {
  // NOTE: keep in alphabetical order
  branchIconClass,
  closeMenuIconClass,
  openMenuIconClass,
  pullButtonClass,
  pushButtonClass,
  refreshButtonClass,
  repoIconClass,
  tagButtonClass,
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
import { GitTagDialog } from '../widgets/TagList';
import { BranchMenu } from './BranchMenu';

/**
 * Interface describing component properties.
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
   * Current repository.
   */
  repository: string;

  /**
   * Callback to invoke in order to refresh a repository.
   *
   * @returns promise which refreshes a repository
   */
  refresh: () => Promise<void>;
}

/**
 * Interface describing component state.
 */
export interface IToolbarState {
  /**
   * Boolean indicating whether a branch menu is shown.
   */
  branchMenu: boolean;
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
      branchMenu: false
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
    return (
      <div className={toolbarNavClass}>
        <button
          className={classes(toolbarButtonClass, pullButtonClass, 'jp-Icon-16')}
          title={'Pull latest changes'}
          onClick={this._onPullClick}
        />
        <button
          className={classes(toolbarButtonClass, pushButtonClass, 'jp-Icon-16')}
          title={'Push committed changes'}
          onClick={this._onPushClick}
        />
        <button
          className={classes(toolbarButtonClass, tagButtonClass, 'jp-Icon-16')}
          onClick={this._onTagClick}
          title={'Checkout a tag'}
        />
        <button
          className={classes(
            toolbarButtonClass,
            refreshButtonClass,
            'jp-Icon-16'
          )}
          title={'Refresh the repository to detect local and remote changes'}
          onClick={this._onRefreshClick}
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
          title={`Current repository: ${this.props.repository}`}
        >
          <span
            className={classes(
              toolbarMenuButtonIconClass,
              repoIconClass,
              'jp-Icon-16'
            )}
          />
          <div className={toolbarMenuButtonTitleWrapperClass}>
            <p className={toolbarMenuButtonTitleClass}>Current Repository</p>
            <p className={toolbarMenuButtonSubtitleClass}>
              {PathExt.basename(this.props.repository)}
            </p>
          </div>
          {/*<span
            className={classes(
              toolbarMenuButtonIconClass,
              this.state.repoMenu ? closeMenuIconClass : openMenuIconClass,
              'jp-Icon-16'
            )}
          />*/}
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
          title={`Change the current branch: ${this.props.currentBranch}`}
          onClick={this._onBranchClick}
        >
          <span
            className={classes(
              toolbarMenuButtonIconClass,
              branchIconClass,
              'jp-Icon-16'
            )}
          />
          <div className={toolbarMenuButtonTitleWrapperClass}>
            <p className={toolbarMenuButtonTitleClass}>Current Branch</p>
            <p className={toolbarMenuButtonSubtitleClass}>
              {this.props.currentBranch || ''}
            </p>
          </div>
          <span
            className={classes(
              toolbarMenuButtonIconClass,
              this.state.branchMenu ? closeMenuIconClass : openMenuIconClass,
              'jp-Icon-16'
            )}
          />
        </button>
        {this.state.branchMenu ? (
          <BranchMenu
            currentBranch={this.props.currentBranch || ''}
            branches={this.props.branches}
            branching={this.props.branching}
            logger={this.props.logger}
            model={this.props.model}
          />
        ) : null}
      </div>
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
   * Callback invoked upon clicking a button to refresh a repository.
   *
   * @param event - event object
   * @returns a promise which resolves upon refreshing a repository
   */
  private _onRefreshClick = async (): Promise<void> => {
    this.props.logger.log({
      level: Level.RUNNING,
      message: 'Refreshing...'
    });
    try {
      await this.props.refresh();

      this.props.logger.log({
        level: Level.SUCCESS,
        message: 'Successfully refreshed.'
      });
    } catch (error) {
      console.error(error);
      this.props.logger.log({
        level: Level.ERROR,
        message: 'Failed to refresh.',
        error
      });
    }
  };

  /**
   * Callback invoked upon clicking a button to view tags.
   *
   * @param event - event object
   */
  private _onTagClick = async (): Promise<void> => {
    const result = await showDialog({
      title: 'Checkout tag',
      body: new GitTagDialog(this.props.model)
    });
    if (result.button.accept) {
      this.props.logger.log({
        level: Level.RUNNING,
        message: `Switching to ${result.value}...`
      });

      try {
        await this.props.model.checkoutTag(result.value);

        this.props.logger.log({
          level: Level.SUCCESS,
          message: `Switched to ${result.value}`
        });
      } catch (error) {
        console.error(error);
        this.props.logger.log({
          level: Level.ERROR,
          message: `Fail to checkout tag ${result.value}`,
          error
        });
      }
    }
  };
}
