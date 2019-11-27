import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IChangedArgs, ISettingRegistry } from '@jupyterlab/coreutils';
import {
  FileBrowser,
  FileBrowserModel,
  IFileBrowserFactory
} from '@jupyterlab/filebrowser';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { defaultIconRegistry } from '@jupyterlab/ui-components';
import { Menu } from '@phosphor/widgets';
import { addCommands, CommandIDs } from './gitMenuCommands';
import { GitExtension } from './model';
import { registerGitIcons } from './style/icons';
import { IGitExtension } from './tokens';
import { addCloneButton } from './widgets/gitClone';
import { GitWidget } from './widgets/GitWidget';

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
function activate(
  app: JupyterFrontEnd,
  mainMenu: IMainMenu,
  restorer: ILayoutRestorer,
  factory: IFileBrowserFactory,
  renderMime: IRenderMimeRegistry,
  settingRegistry: ISettingRegistry
): IGitExtension {
  const key = plugin.id;

  registerGitIcons(defaultIconRegistry);

  // Create the Git model
  let gitExtension = new GitExtension(app);

  // Connect file browser with git model
  const filebrowser = factory.defaultBrowser;

  // Whenever the file browser path changes, sync the Git extension path
  filebrowser.model.pathChanged.connect(
    (model: FileBrowserModel, change: IChangedArgs<string>) => {
      gitExtension.pathRepository = change.newValue;
    }
  );

  // Whenever a user adds/renames/saves/deletes/modifies a file within the lab environment, refresh the Git status
  filebrowser.model.fileChanged.connect(() => gitExtension.refreshStatus());

  // Whenever we restore the application, sync the Git extension path
  Promise.all([app.restored, filebrowser.model.restored]).then(() => {
    gitExtension.pathRepository = filebrowser.model.path;
  });

  /* Create the widgets */
  settingRegistry
    .load(key)
    .then(settings => {
      // Create the Git widget sidebar
      const gitPlugin = new GitWidget(gitExtension, settings, renderMime);
      gitPlugin.id = 'jp-git-sessions';
      gitPlugin.title.iconClass = `jp-SideBar-tabIcon jp-GitIcon`;
      gitPlugin.title.caption = 'Git';

      // Let the application restorer track the running panel for restoration of
      // application state (e.g. setting the running panel as the current side bar
      // widget).
      restorer.add(gitPlugin, 'git-sessions');
      // Rank has been chosen somewhat arbitrarily to give priority to the running
      // sessions widget in the sidebar.
      app.shell.add(gitPlugin, 'left', { rank: 200 });

      // add a menu for the plugin
      mainMenu.addMenu(
        createGitMenu(app, gitExtension, factory.defaultBrowser, settings),
        { rank: 60 }
      );

      // Sync the refresh interval to the current settings:
      gitExtension.refreshInterval = settings.composite
        .refreshInterval as number;

      // Listen for changes to extension settings:
      settings.changed.connect((settings: ISettingRegistry.ISettings) => {
        gitExtension.refreshInterval = settings.composite
          .refreshInterval as number;
      });
    })
    .catch(reason => {
      console.error(
        `Failed to load settings for the Git Exetnsion.\n${reason}`
      );
    });

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

  let menu = new Menu({ commands });
  menu.title.label = 'Git';
  [CommandIDs.gitUI, CommandIDs.gitTerminalCommand, CommandIDs.gitInit].forEach(
    command => {
      menu.addItem({ command });
    }
  );

  let tutorial = new Menu({ commands });
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
