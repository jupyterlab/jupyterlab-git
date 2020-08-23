import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IChangedArgs, ISettingRegistry } from '@jupyterlab/coreutils';
import { Dialog, showErrorMessage } from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { FileBrowserModel, IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IStatusBar } from '@jupyterlab/statusbar';
import { defaultIconRegistry } from '@jupyterlab/ui-components';
import { addCommands, createGitMenu } from './commandsAndMenu';
import { GitExtension } from './model';
import { registerGitIcons } from './style/icons';
import { getServerSettings } from './server';
import { Git, IGitExtension } from './tokens';
import { addCloneButton } from './widgets/gitClone';
import { GitWidget } from './widgets/GitWidget';
import { addStatusBarWidget } from './widgets/StatusWidget';

export { Git, IGitExtension } from './tokens';

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
    ISettingRegistry,
    IDocumentManager,
    IStatusBar
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
  settingRegistry: ISettingRegistry,
  docmanager: IDocumentManager,
  statusBar: IStatusBar
): Promise<IGitExtension> {
  let gitExtension: GitExtension | null = null;
  let settings: ISettingRegistry.ISettings;

  // Register Git icons with the icon registry
  registerGitIcons(defaultIconRegistry);

  let serverSettings: Git.IServerSettings;
  // Get a reference to the default file browser extension
  const filebrowser = factory.defaultBrowser;

  // Attempt to load application settings
  try {
    settings = await settingRegistry.load(plugin.id);
  } catch (error) {
    console.error(`Failed to load settings for the Git Extension.\n${error}`);
  }
  try {
    serverSettings = await getServerSettings();
    const { frontendVersion, gitVersion, serverVersion } = serverSettings;

    // Version validation
    if (!gitVersion) {
      throw new Error(
        'git command not found - please ensure you have Git > 2 installed'
      );
    } else {
      const gitVersion_ = gitVersion.split('.');
      if (Number.parseInt(gitVersion_[0]) < 2) {
        throw new Error(`git command version must be > 2; got ${gitVersion}.`);
      }
    }

    if (frontendVersion && frontendVersion !== serverVersion) {
      throw new Error(
        'The versions of the JupyterLab Git server frontend and backend do not match. ' +
          `The @jupyterlab/git frontend extension has version: ${frontendVersion} ` +
          `while the python package has version ${serverVersion}. ` +
          'Please install identical version of jupyterlab-git Python package and the @jupyterlab/git extension. Try running: pip install --upgrade jupyterlab-git'
      );
    }
  } catch (error) {
    // If we fall here, nothing will be loaded in the frontend.
    console.error(
      'Failed to load the jupyterlab-git server extension settings',
      error
    );
    showErrorMessage(
      'Failed to load the jupyterlab-git server extension',
      error.message,
      [Dialog.warnButton({ label: 'DISMISS' })]
    );
    return null;
  }
  // Create the Git model
  gitExtension = new GitExtension(
    serverSettings.serverRoot,
    app,
    docmanager,
    settings
  );

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
    // Add JupyterLab commands
    addCommands(app, gitExtension, factory.defaultBrowser, settings);

    // Create the Git widget sidebar
    const gitPlugin = new GitWidget(
      gitExtension,
      settings,
      renderMime,
      factory.defaultBrowser.model
    );
    gitPlugin.id = 'jp-git-sessions';
    gitPlugin.title.iconClass = 'jp-SideBar-tabIcon jp-GitIcon';
    gitPlugin.title.caption = 'Git';

    // Let the application restorer track the running panel for restoration of
    // application state (e.g. setting the running panel as the current side bar
    // widget).
    restorer.add(gitPlugin, 'git-sessions');

    // Rank has been chosen somewhat arbitrarily to give priority to the running
    // sessions widget in the sidebar.
    app.shell.add(gitPlugin, 'left', { rank: 200 });

    // Add a menu for the plugin
    mainMenu.addMenu(createGitMenu(app.commands), { rank: 60 });

    // Add a clone button to the file browser extension toolbar
    addCloneButton(gitExtension, factory.defaultBrowser);

    // Add the status bar widget
    addStatusBarWidget(statusBar, gitExtension, settings);
  }

  return gitExtension;
}
