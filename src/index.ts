import {
  ILayoutRestorer,
  JupyterLab,
  JupyterLabPlugin
} from '@jupyterlab/application';
import { PathExt } from '@jupyterlab/coreutils';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { Token } from '@phosphor/coreutils';
import '../style/variables.css';
import { GitWidget } from './components/GitWidget';
import { gitTabStyle } from './componentsStyle/GitWidgetStyle';
import { IDiffCallback } from './git';
import { GitClone } from './gitClone';
import { addCommands, addMenuItems } from './gitMenuCommands';

export { IDiffCallback } from './git';

export const EXTENSION_ID = 'jupyter.extensions.git_plugin';

// tslint:disable-next-line: variable-name
export const IGitExtension = new Token<IGitExtension>(EXTENSION_ID);

/** Interface for extension class */
export interface IGitExtension {
  registerDiffProvider(filetypes: string[], callback: IDiffCallback): void;
}

/**
 * The default running sessions extension.
 */
const plugin: JupyterLabPlugin<IGitExtension> = {
  id: 'jupyter.extensions.running-sessions-git',
  requires: [
    IMainMenu,
    ILayoutRestorer,
    IFileBrowserFactory,
    IRenderMimeRegistry
  ],
  provides: IGitExtension,
  activate,
  autoStart: true
};

/**
 * Export the plugin as default.
 */
export default plugin;

/** Main extension class */
export class GitExtension implements IGitExtension {
  gitPlugin: GitWidget;
  gitCloneWidget: GitClone;
  constructor(
    app: JupyterLab,
    restorer: ILayoutRestorer,
    factory: IFileBrowserFactory
  ) {
    this.app = app;
    this.gitPlugin = new GitWidget(
      app,
      { manager: app.serviceManager },
      this.performDiff.bind(this)
    );
    this.gitPlugin.id = 'jp-git-sessions';
    this.gitPlugin.title.iconClass = `jp-SideBar-tabIcon ${gitTabStyle}`;
    this.gitPlugin.title.caption = 'Git';

    // Let the application restorer track the running panel for restoration of
    // application state (e.g. setting the running panel as the current side bar
    // widget).

    restorer.add(this.gitPlugin, 'git-sessions');
    app.shell.addToLeftArea(this.gitPlugin, { rank: 200 });

    this.gitCloneWidget = new GitClone(factory);
  }

  registerDiffProvider(filetypes: string[], callback: IDiffCallback): void {
    filetypes.forEach(fileType => {
      this.diffProviders[fileType] = callback;
    });
  }

  performDiff(filename: string, revisionA: string, revisionB: string) {
    let extension = PathExt.extname(filename).toLocaleLowerCase();
    if (this.diffProviders[extension] !== undefined) {
      this.diffProviders[extension](filename, revisionA, revisionB);
    } else {
      this.app.commands.execute('git:terminal-cmd', {
        cmd: 'git diff ' + revisionA + ' ' + revisionB
      });
    }
  }

  private app: JupyterLab;
  private diffProviders: { [key: string]: IDiffCallback } = {};
}

/**
 * Activate the running plugin.
 */
function activate(
  app: JupyterLab,
  mainMenu: IMainMenu,
  restorer: ILayoutRestorer,
  factory: IFileBrowserFactory
): IGitExtension {
  const { commands } = app;
  let gitExtension = new GitExtension(app, restorer, factory);

  // Rank has been chosen somewhat arbitrarily to give priority to the running
  // sessions widget in the sidebar.
  addCommands(app, app.serviceManager);
  addMenuItems(commands, mainMenu);

  return gitExtension;
}
