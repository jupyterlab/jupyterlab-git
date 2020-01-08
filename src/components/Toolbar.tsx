import * as React from 'react';
import { classes } from 'typestyle';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import {
  // NOTE: keep in alphabetical order
  branchIconClass,
  closeMenuIconClass,
  openMenuIconClass,
  pullButtonClass,
  pushButtonClass,
  refreshButtonClass,
  repoIconClass,
  toolbarButtonClass,
  toolbarClass,
  toolbarMenuButtonClass,
  toolbarMenuButtonIconClass,
  toolbarMenuButtonSubtitleClass,
  toolbarMenuButtonTitleClass,
  toolbarMenuButtonTitleWrapperClass,
  toolbarMenuWrapperClass,
  toolbarNavClass
} from '../style/Toolbar';
import { GitCredentialsForm } from '../widgets/CredentialsBox';
import { GitPullPushDialog, Operation } from '../widgets/gitPushPull';
import { IGitExtension } from '../tokens';
import { BranchMenu } from './BranchMenu';

/**
 * Displays an error dialog when a Git operation fails.
 *
 * @private
 * @param model - Git extension model
 * @param operation - Git operation name
 * @returns Promise for displaying a dialog
 */
async function showGitOperationDialog(
  model: IGitExtension,
  operation: Operation
): Promise<void> {
  const title = `Git ${operation}`;
  let result = await showDialog({
    title: title,
    body: new GitPullPushDialog(model, operation),
    buttons: [Dialog.okButton({ label: 'DISMISS' })]
  });
  let retry = false;
  while (!result.button.accept) {
    retry = true;
    const credentials = await showDialog({
      title: 'Git credentials required',
      body: new GitCredentialsForm(
        'Enter credentials for remote repository',
        retry ? 'Incorrect username or password.' : ''
      ),
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'OK' })]
    });
    if (!credentials.button.accept) {
      break;
    }
    result = await showDialog({
      title: title,
      body: new GitPullPushDialog(model, operation, credentials.value),
      buttons: [Dialog.okButton({ label: 'DISMISS' })]
    });
  }
}

/**
 * Interface describing component properties.
 */
export interface IToolbarProps {
  /**
   * Git extension data model.
   */
  model: IGitExtension;

  /**
   * Boolean indicating whether branching is disabled.
   */
  branching: boolean;

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

  /**
   * Boolean indicating whether a repository menu is shown.
   */
  repoMenu: boolean;

  /**
   * Current repository.
   */
  repository: string;

  /**
   * Current branch name.
   */
  branch: string;
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

    const repo = this.props.model.pathRepository;

    // When the repository changes, we're likely to have a new set of branches:
    this.props.model.repositoryChanged.connect(this._syncState, this);

    // When the HEAD changes, decent probability that we've switched branches:
    this.props.model.headChanged.connect(this._syncState, this);

    // When the status changes, we may have checked out a new branch (e.g., via the command-line and not via the extension):
    this.props.model.statusChanged.connect(this._syncState, this);

    this.state = {
      branchMenu: false,
      repoMenu: false,
      repository: repo || '',
      branch: repo ? this.props.model.currentBranch.name : ''
    };
  }

  /**
   * Renders the component.
   *
   * @returns fragment
   */
  render() {
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
   * @returns fragment
   */
  private _renderTopNav = () => {
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
  };

  /**
   * Renders a repository menu.
   *
   * @returns fragment
   */
  private _renderRepoMenu = () => {
    return (
      <div className={toolbarMenuWrapperClass}>
        <button
          className={toolbarMenuButtonClass}
          title={`Current repository: ${this.state.repository}`}
          onClick={this._onRepositoryClick}
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
              {PathExt.basename(this.state.repository)}
            </p>
          </div>
          <span
            className={classes(
              toolbarMenuButtonIconClass,
              this.state.repoMenu ? closeMenuIconClass : openMenuIconClass,
              'jp-Icon-16'
            )}
          />
        </button>
        {this.state.repoMenu ? null : null}
      </div>
    );
  };

  /**
   * Renders a branch menu.
   *
   * @returns fragment
   */
  private _renderBranchMenu = () => {
    if (!this.state.repository) {
      return null;
    }
    return (
      <div className={toolbarMenuWrapperClass}>
        <button
          className={toolbarMenuButtonClass}
          title={`Change the current branch: ${this.state.branch}`}
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
              {this.state.branch}
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
            model={this.props.model}
            branching={this.props.branching}
          />
        ) : null}
      </div>
    );
  };

  /**
   * Syncs the component state with the underlying model.
   */
  private _syncState = () => {
    const repo = this.props.model.pathRepository;
    this.setState({
      repository: repo || '',
      branch: repo ? this.props.model.currentBranch.name : ''
    });
  };

  /**
   * Callback invoked upon clicking a button to pull the latest changes.
   *
   * @param event - event object
   */
  private _onPullClick = () => {
    showGitOperationDialog(this.props.model, Operation.Pull).catch(reason => {
      console.error(
        `Encountered an error when pulling changes. Error: ${reason}`
      );
    });
  };

  /**
   * Callback invoked upon clicking a button to push the latest changes.
   *
   * @param event - event object
   */
  private _onPushClick = () => {
    showGitOperationDialog(this.props.model, Operation.Push).catch(reason => {
      console.error(
        `Encountered an error when pushing changes. Error: ${reason}`
      );
    });
  };

  /**
   * Callback invoked upon clicking a button to change the current repository.
   *
   * @param event - event object
   */
  private _onRepositoryClick = () => {
    // Toggle the repository menu:
    this.setState({
      repoMenu: !this.state.repoMenu
    });
  };

  /**
   * Callback invoked upon clicking a button to change the current branch.
   *
   * @param event - event object
   */
  private _onBranchClick = () => {
    // Toggle the branch menu:
    this.setState({
      branchMenu: !this.state.branchMenu
    });
  };

  /**
   * Callback invoked upon clicking a button to refresh a repository.
   *
   * @param event - event object
   */
  private _onRefreshClick = () => {
    this.props.refresh();
  };
}
