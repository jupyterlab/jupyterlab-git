import { Dialog, showDialog, UseSignal } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import * as React from 'react';
import { classes } from 'typestyle';
import {
  gitPullStyle,
  gitPushStyle,
  repoPathClass,
  repoRefreshStyle,
  toolbarClass
} from '../style/Toolbar';
import { GitCredentialsForm } from '../widgets/CredentialsBox';
import { GitPullPushDialog, Operation } from '../widgets/gitPushPull';
import { IGitExtension } from '../tokens';

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
 * React component for rendering a panel toolbar.
 */
export class Toolbar extends React.Component<IToolbarProps> {
  /**
   * Returns a React component for rendering a panel toolbar.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: IToolbarProps) {
    super(props);
  }

  /**
   * Renders the component.
   *
   * @returns fragment
   */
  render() {
    return (
      <div className={toolbarClass}>
        <UseSignal
          signal={this.props.model.repositoryChanged}
          initialArgs={{
            name: 'pathRepository',
            oldValue: null,
            newValue: this.props.model.pathRepository
          }}
        >
          {this._onRepositoryPathChange}
        </UseSignal>
        <button
          className={classes(gitPullStyle, 'jp-Icon-16')}
          title={'Pull latest changes'}
          onClick={this._onPullClick}
        />
        <button
          className={classes(gitPushStyle, 'jp-Icon-16')}
          title={'Push committed changes'}
          onClick={this._onPushClick}
        />
        <button
          className={classes(repoRefreshStyle, 'jp-Icon-16')}
          title={'Refresh the repository to detect local and remote changes'}
          onClick={this._onRefreshClick}
        />
      </div>
    );
  }

  /**
   * Callback invoked upon a change to the repository path.
   *
   * @param _ - unused argument
   * @param change - change object
   * @returns React component
   */
  private _onRepositoryPathChange = (_: any, change: any) => {
    return (
      <span className={repoPathClass} title={change.newValue}>
        {PathExt.basename(change.newValue || '')}
      </span>
    );
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
      const response = await showDialog({
        title: 'Git credentials required',
        body: new GitCredentialsForm(
          'Enter credentials for remote repository',
          retry ? 'Incorrect username or password.' : ''
        ),
        buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'OK' })]
      });
      if (response.button.accept) {
        result = await showDialog({
          title: title,
          body: new GitPullPushDialog(
            this.props.model,
            operation,
            response.value
          ),
          buttons: [Dialog.okButton({ label: 'DISMISS' })]
        });
      } else {
        break;
      }
    }
  }
}
