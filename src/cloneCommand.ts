import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import { CommandIDs, IGitExtension, Level } from './tokens';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { Dialog, ICommandPalette, showDialog } from '@jupyterlab/apputils';
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
  requires: [IGitExtension, IFileBrowserFactory],
  optional: [ICommandPalette, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    gitModel: IGitExtension,
    fileBrowserFactory: IFileBrowserFactory,
    palette: ICommandPalette | null,
    translator: ITranslator | null
  ) => {
    translator = translator ?? nullTranslator;
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

        if (result.button.accept && result.value.url) {
          logger.log({
            level: Level.RUNNING,
            message: trans.__('Cloning…')
          });
          try {
            const details = await showGitOperationDialog<IGitCloneArgs>(
              gitModel as GitExtension,
              Operation.Clone,
              trans,
              {
                path: fileBrowserModel.path,
                url: result.value.url,
                versioning: result.value.versioning,
                submodules: result.value.submodules
              }
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
            throw error;
          }
        }
      }
    });
    // Add a clone button to the file browser extension toolbar
    addCloneButton(gitModel, fileBrowser, app.commands, trans);

    // Add the context menu items for the default file browser
    addFileBrowserContextMenu(gitModel, fileBrowser, app.contextMenu, trans);

    if (palette) {
      // Add the commands to the command palette
      const category = 'Git Operations';
      palette.addItem({ command: CommandIDs.gitClone, category });
    }
  },
  autoStart: true
};
