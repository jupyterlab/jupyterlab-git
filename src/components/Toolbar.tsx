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
  toolbarMenuButtonEnabledClass,
  toolbarMenuButtonIconClass,
  toolbarMenuButtonSubtitleClass,
  toolbarMenuButtonTitleClass,
  toolbarMenuButtonTitleWrapperClass,
  toolbarMenuWrapperClass,
  toolbarNavClass,
  changeConnectionStatusBarClass,
  changeConnectionStatusBarLeftClass,
  changeConnectionStatusButtonClass
} from '../style/Toolbar';
import { GitPullPushDialog, Operation } from '../widgets/gitPushPull';
import { IGitExtension } from '../tokens';
import { BranchMenu } from './BranchMenu';
import {
  ShowReactDialog,
  ShowReactDialogValidator
} from '../widgets/CredentialsBox';
import { IShowDialogResult } from '../commonData/interfaces';

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

  let errorMess = '';
  let credentials: IShowDialogResult = {
    isSubmited: false,
    value: {
      password_secret: '',
      username: ''
    }
  };

  while (!result.button.accept) {
    credentials = await ShowReactDialog(errorMess, credentials.value);

    errorMess = '';

    if (!credentials.isSubmited) {
      break;
    }

    const { isCorrect, ans } = ShowReactDialogValidator(credentials.value);

    if (!isCorrect) {
      errorMess = ans;
    } else {
      result = await showDialog({
        title: title,
        body: new GitPullPushDialog(model, operation, credentials.value),
        buttons: [Dialog.okButton({ label: 'DISMISS' })]
      });

      errorMess = 'Incorrect username or secret';
    }
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

  /**
   * Connection status.
   */
  enabled: boolean;
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

    this.state = {
      branchMenu: false,
      repoMenu: false,
      repository: repo || '',
      branch: repo ? this.props.model.currentBranch.name : '',
      enabled: false
    };
  }

  /**
   * Callback invoked immediately after mounting a component (i.e., inserting into a tree).
   */
  componentDidMount(): void {
    this._addListeners();
  }

  /**
   * Callback invoked when a component will no longer be mounted.
   */
  componentWillUnmount(): void {
    this._removeListeners();
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
        {this._renderConnectionsMenu()}
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
          {/*<span
            className={classes(
              toolbarMenuButtonIconClass,
              this.state.repoMenu ? closeMenuIconClass : openMenuIconClass,
              'jp-Icon-16'
            )}
          />*/}
        </button>
        {this.state.repoMenu ? null : null}
      </div>
    );
  }

  /**
   * Renders a connections menu.
   *
   * @returns React element
   */
  private _renderConnectionsMenu(): React.ReactElement {
    if (!this.state.repository) {
      return undefined;
    }

    return (
      <div className={toolbarMenuWrapperClass}>
        <button
          disabled
          className={toolbarMenuButtonClass}
          title={`Current connection state: ${this.state.enabled}`}
          onClick={this._onRepositoryClick}
        >
          <div className={changeConnectionStatusBarClass}>
            <div className={changeConnectionStatusBarLeftClass}>
              <p className={toolbarMenuButtonTitleClass}>Connection state</p>
              <p className={toolbarMenuButtonSubtitleClass}>
                {this.state.enabled ? 'enabled' : 'disabled'}
              </p>
            </div>
            <input
              className={changeConnectionStatusButtonClass}
              type="button"
              title={
                this.state.enabled ? 'Disable connection' : 'Enable connection'
              }
              value={this.state.enabled ? 'Disable' : 'Enable'}
              onClick={
                this.state.enabled
                  ? this._onDisableConnectionStatusClick
                  : this._onEnableConnectionStatusClick
              }
            />
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
    if (!this.state.repository) {
      return null;
    }
    return (
      <div className={toolbarMenuWrapperClass}>
        <button
          className={classes(
            toolbarMenuButtonClass,
            toolbarMenuButtonEnabledClass
          )}
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
  }

  /**
   * Adds model listeners.
   */
  private _addListeners(): void {
    // When the HEAD changes, decent probability that we've switched branches:
    this.props.model.headChanged.connect(this._syncState, this);

    // When the status changes, we may have checked out a new branch (e.g., via the command-line and not via the extension) or changed repositories:
    this.props.model.statusChanged.connect(this._syncState, this);
    this.props.model.connectionStatusChanged.connect(this._syncState, this);
  }

  /**
   * Removes model listeners.
   */
  private _removeListeners(): void {
    this.props.model.headChanged.disconnect(this._syncState, this);
    this.props.model.statusChanged.disconnect(this._syncState, this);
  }

  /**
   * Syncs the component state with the underlying model.
   */
  private _syncState(): void {
    const repo = this.props.model.pathRepository;
    const enabled = this.props.model.connectionStatus;

    this.setState({
      repository: repo || '',
      enabled,
      branch: repo ? this.props.model.currentBranch.name : ''
    });
  }

  /**
   * Callback invoked upon clicking a button to pull the latest changes.
   *
   * @param event - event object
   */
  private _onPullClick = (): void => {
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
  private _onPushClick = (): void => {
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
  private _onRepositoryClick = (): void => {
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
   */
  private _onRefreshClick = (): void => {
    this.props.refresh();
  };

  private _onEnableConnectionStatusClick = (): void => {
    this.props.model.changeConnectionStatus(
      this.props.model.pathRepository,
      true
    );
  };

  private _onDisableConnectionStatusClick = (): void => {
    this.props.model.changeConnectionStatus(
      this.props.model.pathRepository,
      false
    );
  };
}
