import {
  gitPullStyle,
  gitPushStyle,
  repoPathStyle,
  repoRefreshStyle,
  repoStyle
} from '../componentsStyle/PathHeaderStyle';

import * as React from 'react';

import {classes} from 'typestyle';

import {Git} from '../git';

import {Dialog, showDialog} from '@jupyterlab/apputils';

export interface IPathHeaderState {
  refresh: any;
  gitApi: Git;
}

export interface IPathHeaderProps {
  currentFileBrowserPath: string;
  topRepoPath: string;
  refresh: any;
  currentBranch: string;
  isLightTheme: string;
}

export class PathHeader extends React.Component<IPathHeaderProps,
  IPathHeaderState> {
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
          className={classes(gitPullStyle(this.props.isLightTheme), 'jp-Icon-16')}
          title={'Pull latest changes'}
          onClick={() => this.executeGitPull()}
        />
        <button
          className={classes(gitPushStyle(this.props.isLightTheme), 'jp-Icon-16')}
          title={'Push committed changes'}
          onClick={() => this.executeGitPush()}
        />
        <button
          className={classes(repoRefreshStyle, 'jp-Icon-16')}
          onClick={() => this.props.refresh()}
        />
      </div>
    );
  }

  /**
   * Execute the `/git/pull` API
   */
  private executeGitPull(): void {
    this.state.gitApi.pull(this.props.currentFileBrowserPath)
      .then(response => {
        if (response.code != 0) {
          this.showErrorDialog('Pull failed', response.message);
        }
      })
      .catch(() => this.showErrorDialog('Pull failed'));
  }

  /**
   * Execute the `/git/push` API
   */
  private executeGitPush(): void {
    this.state.gitApi.push(this.props.currentFileBrowserPath)
      .then(response => {
        if (response.code != 0) {
          this.showErrorDialog('Push failed', response.message);
        }
      })
      .catch(() => this.showErrorDialog('Push failed'));
  }

  /**
   * Displays the error dialog when the Git Push/Pull operation fails.
   * @param title the title of the error dialog
   * @param body the message to be shown in the body of the modal.
   */
  private showErrorDialog(title: string, body: string = ''): Promise<void> {
    return showDialog({
      title: title,
      body: body,
      buttons: [Dialog.warnButton({label: 'DISMISS'})]
    }).then(() => {
      // NO-OP
    });
  }
}
