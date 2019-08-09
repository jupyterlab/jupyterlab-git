import {
  gitPullStyle,
  gitPushStyle,
  repoPathStyle,
  repoRefreshStyle,
  repoStyle
} from '../componentsStyle/PathHeaderStyle';

import * as React from 'react';

import { classes } from 'typestyle';

import { Git, IGitAuth } from '../git';

import { Dialog } from '@jupyterlab/apputils';

import { GitPullPushDialog, Operation } from '../widgets/gitPushPull';

import { GitCredentialsForm } from './CredentialsBox';

export interface IPathHeaderState {
  refresh: any;
  gitApi: Git;
}

export interface IPathHeaderProps {
  currentFileBrowserPath: string;
  topRepoPath: string;
  refresh: any;
  currentBranch: string;
}

export class PathHeader extends React.Component<
  IPathHeaderProps,
  IPathHeaderState
> {
  constructor(props: IPathHeaderProps) {
    super(props);
    this.state = {
      refresh: props.refresh,
      gitApi: new Git()
    };
  }

  render() {
    let relativePath = this.props.currentFileBrowserPath.split('/');
    return (
      <div className={repoStyle}>
        <span className={repoPathStyle}>
          {relativePath[relativePath.length - 1] +
            ' / ' +
            this.props.currentBranch}
        </span>
        <button
          className={classes(gitPullStyle, 'jp-Icon-16')}
          title={'Pull latest changes'}
          onClick={() =>
            this.showGitPushPullDialog(
              this.props.currentFileBrowserPath,
              Operation.Pull
            )
          }
        />
        <button
          className={classes(gitPushStyle, 'jp-Icon-16')}
          title={'Push committed changes'}
          onClick={() =>
            this.showGitPushPullDialog(
              this.props.currentFileBrowserPath,
              Operation.Push
            )
          }
        />
        <button
          className={classes(repoRefreshStyle, 'jp-Icon-16')}
          onClick={() => this.props.refresh()}
        />
      </div>
    );
  }

  /**
   * Displays the error dialog when the Git Push/Pull operation fails.
   * @param title the title of the error dialog
   * @param body the message to be shown in the body of the modal.
   */
  private async showGitPushPullDialog(
    currentFileBrowserPath: string,
    operation: Operation
  ): Promise<void> {
    let dialog = new Dialog({
      title: `Git ${operation}`,
      body: new GitPullPushDialog(currentFileBrowserPath, operation),
      buttons: [Dialog.okButton({ label: 'DISMISS' })]
    });

    let result = await dialog.launch();
    dialog.dispose();
    let retry = false;
    while (result.button.label === 'Cancel') {
      let credentialsDialog = new Dialog({
        title: 'Git credentials required',
        body: new GitCredentialsForm(
          'Enter credentials for remote repository',
          retry ? 'Incorrect username or password.' : ''
        ),
        buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'OK' })]
      });
      retry = true;

      let response = await credentialsDialog.launch();
      credentialsDialog.dispose();

      if (response.button.label === 'OK') {
        // user accepted attempt to login

        let authJson = JSON.parse(decodeURIComponent(response.value));
        // call gitApi.push again with credentials
        let auth: IGitAuth = {
          username: authJson.username,
          password: authJson.password
        };

        dialog = new Dialog({
          title: `Git ${operation}`,
          body: new GitPullPushDialog(currentFileBrowserPath, operation, auth),
          buttons: [Dialog.okButton({ label: 'DISMISS' })]
        });
        result = await dialog.launch();
        dialog.dispose();
      } else {
        break;
      }
    }

    dialog.dispose();
    dialog.close();
  }
}
