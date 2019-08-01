import { addCommands, CommandIDs } from './gitMenuCommands';

import { PathExt } from '@jupyterlab/coreutils';

import { GitWidget } from './components/GitWidget';

import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { Menu } from '@phosphor/widgets';

import { Token } from '@phosphor/coreutils';

import { gitTabStyle } from './componentsStyle/GitWidgetStyle';

import { IDiffCallback } from './git';
export { IDiffCallback } from './git';

import '../style/variables.css';
import '../style/diff.css';
import '../style/diff.css';
import { GitClone } from './widgets/gitClone';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

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
const plugin: JupyterFrontEndPlugin<IGitExtension> = {
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
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer,
    factory: IFileBrowserFactory,
    renderMime: IRenderMimeRegistry
  ) {
    this.app = app;
    this.gitPlugin = new GitWidget(
      app,
      { manager: app.serviceManager },
      this.performDiff.bind(this),
      renderMime
    );
    this.gitPlugin.id = 'jp-git-sessions';
    this.gitPlugin.title.iconClass = `jp-SideBar-tabIcon ${gitTabStyle}`;
    this.gitPlugin.title.caption = 'Git';

    // Let the application restorer track the running panel for restoration of
    // application state (e.g. setting the running panel as the current side bar
    // widget).

    restorer.add(this.gitPlugin, 'git-sessions');
    app.shell.add(this.gitPlugin, 'left', { rank: 200 });

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

  private app: JupyterFrontEnd;
  private diffProviders: { [key: string]: IDiffCallback } = {};
}

/**
 * Activate the running plugin.
 */
function activate(
  app: JupyterFrontEnd,
  mainMenu: IMainMenu,
  restorer: ILayoutRestorer,
  factory: IFileBrowserFactory,
  renderMime: IRenderMimeRegistry
): IGitExtension {
  const { commands } = app;
  let gitExtension = new GitExtension(app, restorer, factory, renderMime);

  const category = 'Git';
  // Rank has been chosen somewhat arbitrarily to give priority to the running
  // sessions widget in the sidebar.
  addCommands(app, app.serviceManager);
  let menu = new Menu({ commands });
  let tutorial = new Menu({ commands });
  tutorial.title.label = ' Tutorial ';
  menu.title.label = category;
  [CommandIDs.gitUI, CommandIDs.gitTerminal, CommandIDs.gitInit].forEach(
    command => {
      menu.addItem({ command });
    }
  );

  [CommandIDs.setupRemotes, CommandIDs.googleLink].forEach(command => {
    tutorial.addItem({ command });
  });
  menu.addItem({ type: 'submenu', submenu: tutorial });
  mainMenu.addMenu(menu, { rank: 60 });

  return gitExtension;
}
