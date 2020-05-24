import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import {
  FileBrowser,
  FileBrowserModel,
  IFileBrowserFactory
} from '@jupyterlab/filebrowser';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { Menu } from '@lumino/widgets';
import { addCommands, CommandIDs } from './gitMenuCommands';
import { GitExtension } from './model';
import { IGitExtension } from './tokens';
import { addCloneButton } from './widgets/gitClone';
import { GitWidget } from './widgets/GitWidget';
import { gitIcon } from './style/icons';

export { Git, IGitExtension } from './tokens';

const RESOURCES = [
  {
    text: 'Set Up Remotes',
    url: 'https://www.atlassian.com/git/tutorials/setting-up-a-repository'
  },
  {
    text: 'Git Documentation',
    url: 'https://git-scm.com/doc'
  }
];

/**
 * The default running sessions extension.
 */
const plugin: JupyterFrontEndPlugin<IGitExtension> = {
  id: '@jupyterlab/git:plugin',
  requires: [
    IMainMenu,
    ILayoutRestorer,
    IFileBrowserFactory,
    IRenderMimeRegistry,
    ISettingRegistry
  ],
  provides: IGitExtension,
  activate,
  autoStart: true
};

/**
 * Export the plugin as default.
 */
export default plugin;

/**
 * Activate the running plugin.
 */
async function activate(
  app: JupyterFrontEnd,
  mainMenu: IMainMenu,
  restorer: ILayoutRestorer,
  factory: IFileBrowserFactory,
  renderMime: IRenderMimeRegistry,
  settingRegistry: ISettingRegistry
): Promise<IGitExtension> {
  let settings: ISettingRegistry.ISettings;

  // Get a reference to the default file browser extension
  const filebrowser = factory.defaultBrowser;

  // Attempt to load application settings
  try {
    settings = await settingRegistry.load(plugin.id);
  } catch (error) {
    console.error(`Failed to load settings for the Git Extension.\n${error}`);
  }
  // Create the Git model
  const gitExtension = new GitExtension(app, settings);

  // Whenever we restore the application, sync the Git extension path
  Promise.all([app.restored, filebrowser.model.restored]).then(() => {
    gitExtension.pathRepository = filebrowser.model.path;
  });

  // Whenever the file browser path changes, sync the Git extension path
  filebrowser.model.pathChanged.connect(
    (model: FileBrowserModel, change: IChangedArgs<string>) => {
      gitExtension.pathRepository = change.newValue;
    }
  );
  // Whenever a user adds/renames/saves/deletes/modifies a file within the lab environment, refresh the Git status
  filebrowser.model.fileChanged.connect(() => gitExtension.refreshStatus());

  // Provided we were able to load application settings, create the extension widgets
  if (settings) {
    // Create the Git widget sidebar
    const gitPlugin = new GitWidget(
      gitExtension,
      settings,
      renderMime,
      factory.defaultBrowser.model
    );
    gitPlugin.id = 'jp-git-sessions';
    gitPlugin.title.icon = gitIcon;
    gitPlugin.title.caption = 'Git';

    // Let the application restorer track the running panel for restoration of
    // application state (e.g. setting the running panel as the current side bar
    // widget).
    restorer.add(gitPlugin, 'git-sessions');

    // Rank has been chosen somewhat arbitrarily to give priority to the running
    // sessions widget in the sidebar.
    app.shell.add(gitPlugin, 'left', { rank: 200 });

    // Add a menu for the plugin
    mainMenu.addMenu(
      createGitMenu(app, gitExtension, factory.defaultBrowser, settings),
      { rank: 60 }
    );
  }
  // Add a clone button to the file browser extension toolbar
  addCloneButton(gitExtension, factory.defaultBrowser);

  return gitExtension;
}

/**
 * Add commands and menu items
 */
function createGitMenu(
  app: JupyterFrontEnd,
  gitExtension: IGitExtension,
  fileBrowser: FileBrowser,
  settings: ISettingRegistry.ISettings
): Menu {
  const { commands } = app;
  addCommands(app, gitExtension, fileBrowser, settings);

  const menu = new Menu({ commands });
  menu.title.label = 'Git';
  [
    CommandIDs.gitUI,
    CommandIDs.gitTerminalCommand,
    CommandIDs.gitInit,
    CommandIDs.gitClone,
    CommandIDs.gitAddRemote
  ].forEach(command => {
    menu.addItem({ command });
  });

  const tutorial = new Menu({ commands });
  tutorial.title.label = ' Tutorial ';
  RESOURCES.map(args => {
    tutorial.addItem({
      args,
      command: CommandIDs.gitOpenUrl
    });
  });
  menu.addItem({ type: 'submenu', submenu: tutorial });

  menu.addItem({ type: 'separator' });

  menu.addItem({ command: CommandIDs.gitToggleSimpleStaging });

  return menu;
}
