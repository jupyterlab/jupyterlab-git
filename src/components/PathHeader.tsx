import {
  gitPullStyle,
  gitPushStyle,
  repoPathStyle,
  repoRefreshStyle,
  repoStyle
} from '../componentsStyle/PathHeaderStyle';

import * as React from 'react';

import { classes } from 'typestyle';

import { Git } from '../git';

import { Dialog } from '@jupyterlab/apputils';

import { GitPullPushDialog, Operation } from '../gitPushPull';

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
  private showGitPushPullDialog(
    currentFileBrowserPath: string,
    operation: Operation
  ): Promise<void> {
    let dialog = new Dialog({
      title: `Git ${Operation}`,
      body: new GitPullPushDialog(currentFileBrowserPath, operation),
      buttons: [Dialog.okButton({ label: 'DISMISS' })]
    });
    return dialog.launch().then(() => {});
  }
}
