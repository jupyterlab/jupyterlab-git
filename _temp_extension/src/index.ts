import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Initialization data for the @jupyterlab/git extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab/git:plugin',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log('JupyterLab extension @jupyterlab/git is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('@jupyterlab/git settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for @jupyterlab/git.', reason);
        });
    }
  }
};

export default plugin;
