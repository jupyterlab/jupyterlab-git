import { Dialog, showDialog, UseSignal } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import * as React from 'react';
import { classes } from 'typestyle';
import {
  gitPullStyle,
  gitPushStyle,
  repoPathClass,
  repoRefreshStyle,
  pathHeaderClass
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
  constructor(props: IToolbarProps) {
    super(props);
  }

  render() {
    return (
      <div className={pathHeaderClass}>
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
          onClick={() =>
            this.showGitPushPullDialog(this.props.model, Operation.Pull).catch(
              reason => {
                console.error(
                  `An error occurs when pulling the changes.\n${reason}`
                );
              }
            )
          }
        />
        <button
          className={classes(gitPushStyle, 'jp-Icon-16')}
          title={'Push committed changes'}
          onClick={() =>
            this.showGitPushPullDialog(this.props.model, Operation.Push).catch(
              reason => {
                console.error(
                  `An error occurs when pulling the changes.\n${reason}`
                );
              }
            )
          }
        />
        <button
          className={classes(repoRefreshStyle, 'jp-Icon-16')}
          title={'Refresh the repository to detect local and remote changes'}
          onClick={() => this.props.refresh()}
        />
      </div>
    );
  }

  /**
   * Callback invoked upon a change to the repository path.
   *
   * @private
   * @param _ - event object
   * @param change - change
   * @returns React component
   */
  private _onRepositoryPathChange = (_, change) => {
    return (
      <span className={repoPathClass} title={change.newValue}>
        {PathExt.basename(change.newValue || '')}
      </span>
    );
  };

  /**
   * Displays the error dialog when the Git Push/Pull operation fails.
   * @param title the title of the error dialog
   * @param body the message to be shown in the body of the modal.
   */
  private async showGitPushPullDialog(
    model: IGitExtension,
    operation: Operation
  ): Promise<void> {
    let result = await showDialog({
      title: `Git ${operation}`,
      body: new GitPullPushDialog(model, operation),
      buttons: [Dialog.okButton({ label: 'DISMISS' })]
    });
    let retry = false;
    while (!result.button.accept) {
      retry = true;

      let response = await showDialog({
        title: 'Git credentials required',
        body: new GitCredentialsForm(
          'Enter credentials for remote repository',
          retry ? 'Incorrect username or password.' : ''
        ),
        buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'OK' })]
      });

      if (response.button.accept) {
        // user accepted attempt to login
        result = await showDialog({
          title: `Git ${operation}`,
          body: new GitPullPushDialog(model, operation, response.value),
          buttons: [Dialog.okButton({ label: 'DISMISS' })]
        });
      } else {
        break;
      }
    }
  }
}
