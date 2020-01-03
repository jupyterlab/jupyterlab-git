import { Dialog, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import * as React from 'react';
import { classes } from 'typestyle';
import {
  branchButtonClass,
  pullButtonClass,
  pushButtonClass,
  refreshButtonClass,
  toolbarButtonClass,
  repoPathClass,
  toolbarClass
} from '../style/Toolbar';
import { GitCredentialsForm } from '../widgets/CredentialsBox';
import { GitPullPushDialog, Operation } from '../widgets/gitPushPull';
import { IGitExtension } from '../tokens';
import { BranchMenu } from './BranchMenu';

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
   * Current repository path.
   */
  repository: string;
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
    this.props.model.repositoryChanged.connect(this._onRepositoryChange);
    this.state = {
      branchMenu: false,
      repository: ''
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
        <span
          className={repoPathClass}
          title={`Current repository: ${this.state.repository}`}
        >
          {PathExt.basename(this.state.repository)}
        </span>
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
            branchButtonClass,
            'jp-Icon-16'
          )}
          title={'Change the current branch'}
          onClick={this._onBranchClick}
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
        {this.state.branchMenu ? <BranchMenu model={this.props.model} /> : null}
      </div>
    );
  }

  /**
   * Callback invoked upon a change to the repository path.
   *
   * @param _ - unused argument
   * @param change - event object
   * @returns React component
   */
  private _onRepositoryChange = (_: any, change: any) => {
    this.setState({
      repository: change.newValue || ''
    });
  };

  /**
   * Callback invoked upon clicking a button to pull the latest changes.
   *
   * @param event - event object
   */
  private _onPullClick = () => {
    this._showDialog(Operation.Pull).catch(reason => {
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
    this._showDialog(Operation.Push).catch(reason => {
      console.error(
        `Encountered an error when pushing changes. Error: ${reason}`
      );
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

  /**
   * Displays an error dialog when a Git operation fails.
   *
   * @param operation - Git operation name
   * @returns Promise for displaying a dialog
   */
  private async _showDialog(operation: Operation): Promise<void> {
    const title = `Git ${operation}`;
    let result = await showDialog({
      title: title,
      body: new GitPullPushDialog(this.props.model, operation),
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
        body: new GitPullPushDialog(
          this.props.model,
          operation,
          credentials.value
        ),
        buttons: [Dialog.okButton({ label: 'DISMISS' })]
      });
    }
  }
}
