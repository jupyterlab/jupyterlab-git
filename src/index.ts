import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  Dialog,
  ICommandPalette,
  showErrorMessage
} from '@jupyterlab/apputils';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { FileBrowserModel, IDefaultFileBrowser } from '@jupyterlab/filebrowser';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IStatusBar } from '@jupyterlab/statusbar';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import { gitCloneCommandPlugin } from './cloneCommand';
import {
  addCommands,
  addFileBrowserContextMenu,
  createGitMenu
} from './commandsAndMenu';
import { createImageDiff } from './components/diff/ImageDiff';
import { createNotebookDiff } from './components/diff/NotebookDiff';
import { addStatusBarWidget } from './components/StatusWidget';
import { GitExtension } from './model';
import { getServerSettings } from './server';
import { gitIcon } from './style/icons';
import { CommandIDs, Git, IGitExtension } from './tokens';
import { GitWidget } from './widgets/GitWidget';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';

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
    ILayoutRestorer,
    IEditorLanguageRegistry,
    IEditorServices,
    IDefaultFileBrowser,
    IRenderMimeRegistry,
    ISettingRegistry,
    IDocumentManager
  ],
  optional: [IMainMenu, IStatusBar, ICommandPalette, ITranslator],
  provides: IGitExtension,
  activate,
  autoStart: true
};

/**
 * Export the plugin as default.
 */
export default [plugin, gitCloneCommandPlugin];

/**
 * Activate the running plugin.
 */
async function activate(
  app: JupyterFrontEnd,
  restorer: ILayoutRestorer,
  languageRegistry: IEditorLanguageRegistry,
  editorServices: IEditorServices,
  // Get a reference to the default file browser extension
  // We don't use the current tracked browser because extension like jupyterlab-github
  // or jupyterlab-gitlab are defining new filebrowsers that we don't support.
  // And it is unlikely that another browser than the default will be used.
  // Ref: https://github.com/jupyterlab/jupyterlab-git/issues/1014
  fileBrowser: IDefaultFileBrowser,
  renderMime: IRenderMimeRegistry,
  settingRegistry: ISettingRegistry,
  docmanager: IDocumentManager,
  mainMenu: IMainMenu | null,
  statusBar: IStatusBar | null,
  palette: ICommandPalette | null,
  translator: ITranslator | null
): Promise<IGitExtension> {
  let settings: ISettingRegistry.ISettings | undefined = undefined;
  let serverSettings: Git.IServerSettings;
  translator = translator ?? nullTranslator;
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
  } catch (error: any) {
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
    // @ts-expect-error unable to initialize the extension token.
    return null;
  }
  // Create the Git model
  const gitExtension = new GitExtension(docmanager, app.docRegistry, settings);

  const onPathChanged = (
    model: FileBrowserModel,
    change: IChangedArgs<string>
  ) => {
    gitExtension.pathRepository = app.serviceManager.contents.localPath(
      change.newValue
    );
    gitExtension.refreshBranch();
  };

  // Whenever we restore the application, sync the Git extension path
  Promise.all([app.restored, fileBrowser.model.restored]).then(() => {
    onPathChanged(fileBrowser.model, {
      name: 'path',
      newValue: fileBrowser.model.path,
      oldValue: ''
    });
  });

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
    addCommands(
      app,
      gitExtension,
      editorServices.factoryService.newInlineEditor.bind(
        editorServices.factoryService
      ),
      languageRegistry,
      fileBrowser.model,
      settings,
      translator
    );

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

    if (palette) {
      // Add the commands to the command palette
      const category = 'Git Operations';
      [
        CommandIDs.gitToggleSimpleStaging,
        CommandIDs.gitToggleDoubleClickDiff,
        CommandIDs.gitOpenGitignore,
        CommandIDs.gitInit,
        CommandIDs.gitMerge,
        CommandIDs.gitRebase,
        CommandIDs.gitPush,
        CommandIDs.gitPull,
        CommandIDs.gitResetToRemote,
        CommandIDs.gitManageRemote,
        CommandIDs.gitTerminalCommand
      ].forEach(command => palette.addItem({ command, category }));
    }

    // Let the application restorer track the running panel for restoration of
    // application state (e.g. setting the running panel as the current side bar
    // widget).
    restorer.add(gitPlugin, 'git-sessions');

    // Rank has been chosen somewhat arbitrarily to give priority to the running
    // sessions widget in the sidebar.
    app.shell.add(gitPlugin, 'left', { rank: 200 });

    // Add a menu for the plugin
    if (mainMenu && app.version.split('.').slice(0, 2).join('.') < '3.1') {
      // Support JLab 3.0
      /*mainMenu.addMenu(createGitMenu(app.commands, trans), { rank: 60 });*/
      mainMenu.addMenu(createGitMenu(app.commands, trans));
    }

    // Add the status bar widget
    if (statusBar) {
      addStatusBarWidget(statusBar, gitExtension, settings, trans);
    }

    // Add the context menu items for the default file browser
    addFileBrowserContextMenu(
      gitExtension,
      fileBrowser,
      app.serviceManager.contents,
      app.contextMenu,
      trans
    );
  }

  // Register diff providers
  gitExtension.registerDiffProvider(
    'Nbdime',
    ['.ipynb'],
    (options: Git.Diff.IFactoryOptions) =>
      createNotebookDiff({ ...options, renderMime })
  );

  gitExtension.registerDiffProvider(
    'ImageDiff',
    ['.jpeg', '.jpg', '.png'],
    createImageDiff
  );

  return gitExtension;
}
