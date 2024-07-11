import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  Dialog,
  ICommandPalette,
  IToolbarWidgetRegistry,
  Notification,
  ReactWidget,
  showDialog,
  ToolbarButtonComponent,
  UseSignal
} from '@jupyterlab/apputils';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { IDefaultFileBrowser } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import * as React from 'react';
import {
  addFileBrowserContextMenu,
  IGitCloneArgs,
  Operation,
  showGitOperationDialog
} from './commandsAndMenu';
import { GitExtension } from './model';
import { cloneIcon } from './style/icons';
import { CommandIDs, IGitExtension } from './tokens';
import { GitCloneForm } from './widgets/GitCloneForm';
import { showDetails, showError } from './notifications';

const gitClonePluginId = '@jupyterlab/git:clone';

export const gitCloneCommandPlugin: JupyterFrontEndPlugin<void> = {
  id: gitClonePluginId,
  requires: [
    IGitExtension,
    IDefaultFileBrowser,
    IToolbarWidgetRegistry,
    ISettingRegistry
  ],
  optional: [ICommandPalette, ITranslator],
  activate: async (
    app: JupyterFrontEnd,
    gitModel: IGitExtension,
    fileBrowser: IDefaultFileBrowser,
    toolbarRegistry: IToolbarWidgetRegistry,
    settingRegistry: ISettingRegistry,
    palette: ICommandPalette | null,
    translator: ITranslator | null
  ) => {
    translator = translator ?? nullTranslator;
    const trans = translator.load('jupyterlab_git');

    // Attempt to load application settings
    let settings: ISettingRegistry.ISettings | undefined = undefined;
    try {
      settings = await settingRegistry.load(gitClonePluginId);
    } catch (error) {
      console.error(
        trans.__('Failed to load settings for the Git Extension.\n%1', error)
      );
    }
    const popupDuration =
      ((settings?.composite['popupDuration'] as number) ?? 5) * 1000;

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

        if (result.button.accept && result.value?.url) {
          const id = Notification.emit(trans.__('Cloning…'), 'in-progress', {
            autoClose: false
          });
          try {
            const details = await showGitOperationDialog<IGitCloneArgs>(
              gitModel as GitExtension,
              Operation.Clone,
              trans,
              {
                path: app.serviceManager.contents.localPath(
                  fileBrowserModel.path
                ),
                url: result.value.url,
                versioning: result.value.versioning,
                submodules: result.value.submodules
              }
            );
            Notification.update({
              id,
              message: trans.__('Successfully cloned'),
              type: 'success',
              autoClose: popupDuration,
              ...showDetails(details, trans)
            });
            await fileBrowserModel.refresh();
          } catch (error) {
            console.error(
              'Encountered an error when cloning the repository. Error: ',
              error
            );
            Notification.update({
              id,
              message: trans.__('Failed to clone'),
              type: 'error',
              autoClose: popupDuration,
              ...showError(error as Error, trans)
            });
            throw error;
          }
        }
      }
    });

    // Register a clone button to the file browser extension toolbar
    toolbarRegistry.addFactory('FileBrowser', 'gitClone', () =>
      ReactWidget.create(
        <UseSignal
          signal={gitModel.repositoryChanged}
          initialArgs={{
            name: 'pathRepository',
            oldValue: null,
            newValue: gitModel.pathRepository
          }}
        >
          {(_, change?: IChangedArgs<string | null>) => (
            <ToolbarButtonComponent
              enabled={change?.newValue === null}
              icon={cloneIcon}
              onClick={() => {
                app.commands.execute(CommandIDs.gitClone);
              }}
              tooltip={trans.__('Git Clone')}
            />
          )}
        </UseSignal>
      )
    );

    // Add the context menu items for the default file browser
    addFileBrowserContextMenu(
      gitModel,
      fileBrowser,
      app.serviceManager.contents,
      app.contextMenu,
      trans
    );

    if (palette) {
      // Add the commands to the command palette
      const category = 'Git Operations';
      palette.addItem({ command: CommandIDs.gitClone, category });
    }
  },
  autoStart: true
};
