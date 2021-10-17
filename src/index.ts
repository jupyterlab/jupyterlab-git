import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Dialog, showErrorMessage, Toolbar } from '@jupyterlab/apputils';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { FileBrowserModel, IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IStatusBar } from '@jupyterlab/statusbar';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import {
  addCommands,
  addFileBrowserContextMenu,
  createGitMenu
} from './commandsAndMenu';
import { createNotebookDiff } from './components/diff/NotebookDiff';
import { addStatusBarWidget } from './components/StatusWidget';
import { GitExtension } from './model';
import { getServerSettings } from './server';
import { gitIcon } from './style/icons';
import { Git, IGitExtension } from './tokens';
import { addCloneButton } from './widgets/gitClone';
import { GitWidget } from './widgets/GitWidget';

export { DiffModel } from './components/diff/model';
export { NotebookDiff } from './components/diff/NotebookDiff';
export { PlainTextDiff } from './components/diff/PlainTextDiff';
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
    IStatusBar,
    ITranslator
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
  statusBar: IStatusBar,
  translator?: ITranslator
): Promise<IGitExtension> {
  let gitExtension: GitExtension | null = null;
  let settings: ISettingRegistry.ISettings;
  let serverSettings: Git.IServerSettings;
  // Get a reference to the default file browser extension
  // We don't use the current tracked browser because extension like jupyterlab-github
  // or jupyterlab-gitlab are defining new filebrowsers that we don't support.
  // And it is unlikely that another browser than the default will be used.
  // Ref: https://github.com/jupyterlab/jupyterlab-git/issues/1014
  const fileBrowser = factory.defaultBrowser;
  translator = translator || nullTranslator;
  const trans = translator.load('jupyterlab_git');

  // Attempt to load application settings
  try {
    settings = await settingRegistry.load(plugin.id);
  } catch (error) {
    console.error(
      trans.__('Failed to load settings for the Git Extension.\n%1', error)
    );
  }
  try {
    serverSettings = await getServerSettings(trans);
    const { frontendVersion, gitVersion, serverVersion } = serverSettings;

    // Version validation
    if (!gitVersion) {
      throw new Error(
        trans.__(
          'git command not found - please ensure you have Git > 2 installed'
        )
      );
    } else {
      const gitVersion_ = gitVersion.split('.');
      if (Number.parseInt(gitVersion_[0]) < 2) {
        throw new Error(
          trans.__('git command version must be > 2; got %1.', gitVersion)
        );
      }
    }

    if (frontendVersion && frontendVersion !== serverVersion) {
      throw new Error(
        trans.__(
          'The versions of the JupyterLab Git server frontend and backend do not match. ' +
            'The @jupyterlab/git frontend extension has version: %1 ' +
            'while the python package has version %2. ' +
            'Please install identical version of jupyterlab-git Python package and the @jupyterlab/git extension. Try running: pip install --upgrade jupyterlab-git',
          frontendVersion,
          serverVersion
        )
      );
    }
  } catch (error) {
    // If we fall here, nothing will be loaded in the frontend.
    console.error(
      trans.__('Failed to load the jupyterlab-git server extension settings'),
      error
    );
    showErrorMessage(
      trans.__('Failed to load the jupyterlab-git server extension'),
      error.message,
      [Dialog.warnButton({ label: trans.__('Dismiss') })]
    );
    return null;
  }
  // Create the Git model
  gitExtension = new GitExtension(docmanager, app.docRegistry, settings);

  // Whenever we restore the application, sync the Git extension path
  Promise.all([app.restored, fileBrowser.model.restored]).then(() => {
    gitExtension.pathRepository = fileBrowser.model.path;
  });

  const onPathChanged = (
    model: FileBrowserModel,
    change: IChangedArgs<string>
  ) => {
    gitExtension.pathRepository = change.newValue;
  };

  // Whenever the file browser path changes, sync the Git extension path
  fileBrowser.model.pathChanged.connect(onPathChanged);

  const refreshBrowser = () => {
    fileBrowser.model.refresh();
  };

  // Whenever the `HEAD` of the Git repository changes, refresh the file browser
  gitExtension.headChanged.connect(refreshBrowser);

  // Whenever a user adds/renames/saves/deletes/modifies a file within the lab environment, refresh the Git status
  app.serviceManager.contents.fileChanged.connect(() =>
    gitExtension.refreshStatus()
  );

  // Provided we were able to load application settings, create the extension widgets
  if (settings) {
    // Add JupyterLab commands
    addCommands(app, gitExtension, fileBrowser.model, settings, translator);

    // Create the Git widget sidebar
    const gitPlugin = new GitWidget(
      gitExtension,
      settings,
      app.commands,
      fileBrowser.model,
      trans
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
    if (app.version.split('.').slice(0, 2).join('.') < '3.1') {
      // Support JLab 3.0
      mainMenu.addMenu(createGitMenu(app.commands, trans), { rank: 60 });
    }

    // Add a clone button to the file browser extension toolbar
    addCloneButton(gitExtension, fileBrowser, app.commands);

    // Add the status bar widget
    addStatusBarWidget(statusBar, gitExtension, settings, trans);

    // Add the context menu items for the default file browser
    addFileBrowserContextMenu(gitExtension, fileBrowser, app.contextMenu);
  }

  // Register diff providers
  gitExtension.registerDiffProvider(
    'Nbdime',
    ['.ipynb'],
    (model: Git.Diff.IModel, toolbar?: Toolbar, translator?: ITranslator) =>
      createNotebookDiff(model, renderMime, toolbar, translator)
  );

  return gitExtension;
}
