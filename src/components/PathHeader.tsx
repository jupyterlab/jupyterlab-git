import * as React from 'react';
import { Dialog, showDialog, UseSignal } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { FileBrowserModel, FileDialog } from '@jupyterlab/filebrowser';
import { DefaultIconReact } from '@jupyterlab/ui-components';
import { classes } from 'typestyle';
import {
  gitPullStyle,
  gitPushStyle,
  noRepoPathStyle,
  pinIconStyle,
  repoPathStyle,
  repoPinStyle,
  repoRefreshStyle,
  repoStyle,
  separatorStyle,
  toolBarStyle
} from '../style/PathHeaderStyle';
import { IGitExtension } from '../tokens';
import { GitCredentialsForm } from '../widgets/CredentialsBox';
import { GitPullPushDialog, Operation } from '../widgets/gitPushPull';

/**
 * Properties of the PathHeader React component
 */
export interface IPathHeaderProps {
  /**
   * Git extension model
   */
  model: IGitExtension;
  /**
   * File browser model
   */
  fileBrowserModel: FileBrowserModel;
  /**
   * Refresh UI callback
   */
  refresh: () => Promise<void>;
}

/**
 * Displays the error dialog when the Git Push/Pull operation fails.
 *
 * @param title the title of the error dialog
 * @param body the message to be shown in the body of the modal.
 */
async function showGitPushPullDialog(
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

/**
 * Select a Git repository folder
 *
 * @param model Git extension model
 * @param fileModel file browser model
 */
async function selectGitRepository(
  model: IGitExtension,
  fileModel: FileBrowserModel
) {
  const result = await FileDialog.getExistingDirectory({
    iconRegistry: fileModel.iconRegistry,
    manager: fileModel.manager,
    title: 'Select a Git repository folder'
  });

  if (result.button.accept) {
    const folder = result.value[0];
    if (model.repositoryPinned) {
      model.pathRepository = folder.path;
    } else if (fileModel.path !== folder.path) {
      // Change current filebrowser path
      //  => will be propagated to path repository
      fileModel.cd(`/${folder.path}`);
    }
  }
}

/**
 * React function component to render the toolbar and path header component
 *
 * @param props Properties for the path header component
 */
export const PathHeader: React.FunctionComponent<IPathHeaderProps> = (
  props: IPathHeaderProps
) => {
  const [pin, setPin] = React.useState(props.model.repositoryPinned);

  React.useEffect(() => {
    props.model.restored.then(() => {
      setPin(props.model.repositoryPinned);
    });
  });

  return (
    <React.Fragment>
      <div className={toolBarStyle}>
        <button
          className={classes(gitPullStyle, 'jp-Icon-16')}
          title={'Pull latest changes'}
          onClick={() =>
            showGitPushPullDialog(props.model, Operation.Pull).catch(reason => {
              console.error(
                `An error occurs when pulling the changes.\n${reason}`
              );
            })
          }
        />
        <button
          className={classes(gitPushStyle, 'jp-Icon-16')}
          title={'Push committed changes'}
          onClick={() =>
            showGitPushPullDialog(props.model, Operation.Push).catch(reason => {
              console.error(
                `An error occurs when pulling the changes.\n${reason}`
              );
            })
          }
        />
        <button
          className={classes(repoRefreshStyle, 'jp-Icon-16')}
          title={'Refresh the repository to detect local and remote changes'}
          onClick={() => props.refresh()}
        />
      </div>
      <UseSignal
        signal={props.model.repositoryChanged}
        initialArgs={{
          name: 'pathRepository',
          oldValue: null,
          newValue: props.model.pathRepository
        }}
      >
        {(_, change) => {
          const pathStyles = [repoPathStyle];
          if (!change.newValue) {
            pathStyles.push(noRepoPathStyle);
          }

          let pinTitle = 'the repository path';
          if (pin) {
            pinTitle = 'Unpin ' + pinTitle;
          } else {
            pinTitle = 'Pin ' + pinTitle;
          }

          return (
            <div className={repoStyle}>
              <label className={repoPinStyle} title={pinTitle}>
                <input
                  type="checkbox"
                  checked={pin}
                  onChange={() => {
                    props.model.repositoryPinned = !props.model
                      .repositoryPinned;
                    setPin(props.model.repositoryPinned);
                  }}
                />
                <DefaultIconReact
                  className={pinIconStyle}
                  tag="span"
                  name="git-pin"
                />
              </label>
              <span
                className={classes(...pathStyles)}
                title={change.newValue}
                onClick={() => {
                  selectGitRepository(props.model, props.fileBrowserModel);
                }}
              >
                {change.newValue
                  ? PathExt.basename(change.newValue)
                  : 'Click to select a Git repository.'}
              </span>
            </div>
          );
        }}
      </UseSignal>
      <div className={separatorStyle} />
    </React.Fragment>
  );
};
