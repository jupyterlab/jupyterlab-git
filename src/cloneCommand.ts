import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import { CommandIDs, IGitExtension, Level } from './tokens';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { GitCloneForm } from './widgets/GitCloneForm';
import { logger } from './logger';
import {
  addFileBrowserContextMenu,
  IGitCloneArgs,
  Operation,
  showGitOperationDialog
} from './commandsAndMenu';
import { GitExtension } from './model';
import { addCloneButton } from './widgets/gitClone';

export const gitCloneCommandPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab/git:clone',
  requires: [ITranslator, IGitExtension, IFileBrowserFactory],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    gitModel: IGitExtension,
    fileBrowserFactory: IFileBrowserFactory
  ) => {
    translator = translator || nullTranslator;
    const trans = translator.load('jupyterlab_git');
    const fileBrowser = fileBrowserFactory.defaultBrowser;
    const fileBrowserModel = fileBrowser.model;
    /** Add git clone command */
    app.commands.addCommand(CommandIDs.gitClone, {
      label: trans.__('Clone a Repository'),
      caption: trans.__('Clone a repository from a URL'),
      isEnabled: () => gitModel.pathRepository === null,
      execute: async () => {
        const result = await showDialog({
          title: trans.__('Clone a repo'),
          body: new GitCloneForm(trans),
          focusNodeSelector: 'input',
          buttons: [
            Dialog.cancelButton({ label: trans.__('Cancel') }),
            Dialog.okButton({ label: trans.__('Clone') })
          ]
        });

        if (result.button.accept && result.value) {
          logger.log({
            level: Level.RUNNING,
            message: trans.__('Cloning…')
          });
          try {
            const details = await showGitOperationDialog<IGitCloneArgs>(
              gitModel as GitExtension,
              Operation.Clone,
              trans,
              { path: fileBrowserModel.path, url: result.value }
            );
            logger.log({
              message: trans.__('Successfully cloned'),
              level: Level.SUCCESS,
              details
            });
            await fileBrowserModel.refresh();
          } catch (error) {
            console.error(
              'Encountered an error when cloning the repository. Error: ',
              error
            );
            logger.log({
              message: trans.__('Failed to clone'),
              level: Level.ERROR,
              error: error as Error
            });
          }
        }
      }
    });
    // Add a clone button to the file browser extension toolbar
    addCloneButton(gitModel, fileBrowser, app.commands);

    // Add the context menu items for the default file browser
    addFileBrowserContextMenu(gitModel, fileBrowser, app.contextMenu);
  },
  autoStart: true
};
