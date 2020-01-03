import { Dialog, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import * as React from 'react';
import { classes } from 'typestyle';
import {
  // NOTE: keep in alphabetical order
  branchIconClass,
  branchMenuButtonClass,
  branchMenuCurrentClass,
  branchMenuTitleClass,
  branchMenuWrapperClass,
  pullButtonClass,
  pushButtonClass,
  refreshButtonClass,
  repoMenuButtonClass,
  repoMenuCurrentClass,
  repoMenuTitleClass,
  repoMenuWrapperClass,
  toolbarButtonClass,
  toolbarClass,
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
    this.props.model.repositoryChanged.connect(this._onRepositoryChange, this);
    this.props.model.headChanged.connect(this._onHeadChange, this);
    this.state = {
      branchMenu: false,
      repoMenu: false
    };
  }

  /**
   * Renders the component.
   *
   * @returns fragment
   */
  render() {
    const repo = this.props.model.pathRepository || '';
    const branch = repo ? this.props.model.currentBranch.name : '';
    return (
      <div className={toolbarClass}>
        <div className={toolbarNavClass}>
          <button
            className={classes(
              toolbarButtonClass,
              pullButtonClass,
              'jp-Icon-16'
            )}
            title={'Pull latest changes'}
            onClick={this._onPullClick}
          />
          <button
            className={classes(
              toolbarButtonClass,
              pushButtonClass,
              'jp-Icon-16'
            )}
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
        <div className={repoMenuWrapperClass}>
          <button
            className={repoMenuButtonClass}
            title={`Current Repository: ${repo}`}
            onClick={this._onRepositoryClick}
          >
            <p className={repoMenuTitleClass}>Current Repository</p>
            <p
              className={repoMenuCurrentClass}
            >{`Repository: ${PathExt.basename(repo)}`}</p>
          </button>
          {this.state.repoMenu ? null : null}
        </div>
        <div className={branchMenuWrapperClass}>
          <button
            className={branchMenuButtonClass}
            title={`Change the current branch: ${branch}`}
            onClick={this._onBranchClick}
          >
            <span className={classes(branchIconClass, 'jp-Icon-16')} />
            <p className={branchMenuTitleClass}>Current Branch</p>
            <p className={branchMenuCurrentClass}>{branch}</p>
          </button>
          {this.state.branchMenu ? (
            <BranchMenu model={this.props.model} />
          ) : null}
        </div>
      </div>
    );
  }

  /**
   * Callback invoked upon a change to the repository path.
   */
  private _onRepositoryChange = () => {
    this.forceUpdate();
  };

  /**
   * Callback invoked upon a change to the current HEAD.
   */
  private _onHeadChange = () => {
    this.forceUpdate();
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
