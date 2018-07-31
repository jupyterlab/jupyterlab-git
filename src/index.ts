import { addCommands, CommandIDs } from './gitMenuCommands';

import { PathExt } from '@jupyterlab/coreutils';

import { GitWidget } from './components/GitWidget';

import {
  ILayoutRestorer,
  JupyterLab,
  JupyterLabPlugin
} from '@jupyterlab/application';

import {
  IFileBrowserFactory
} from '@jupyterlab/filebrowser'

import {IMainMenu } from '@jupyterlab/mainmenu';

import { Menu } from '@phosphor/widgets';

import { Token } from '@phosphor/coreutils';

import { gitTabStyle } from './componentsStyle/GitWidgetStyle';

import '../style/variables.css';
import {GitClone} from "./gitClone";


export const EXTENSION_ID = 'jupyter.extensions.git_plugin';

export const IGitExtension = new Token<IGitExtension>(EXTENSION_ID);


/** Function type for diffing a file's revisions */
export type IDiffCallback = (
  filename: string,
  revisionA: string,
  revisionB: string
) => void;


/** Interface for extension class */
export interface IGitExtension {
  registerDiffProvider(filetypes: string[], callback: IDiffCallback): void;
}


/**
 * The default running sessions extension.
 */
const plugin: JupyterLabPlugin<IGitExtension> = {
  id: 'jupyter.extensions.running-sessions-git',
  requires: [IMainMenu, ILayoutRestorer, IFileBrowserFactory],
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
  git_plugin: GitWidget;
  git_clone_widget: GitClone;
  constructor(app: JupyterLab, restorer: ILayoutRestorer, factory: IFileBrowserFactory) {
    this.git_plugin = new GitWidget(
      app,
      { manager: app.serviceManager },
      this.performDiff.bind(this)
    );
    this.git_plugin.id = 'jp-git-sessions';
    this.git_plugin.title.iconClass = `jp-SideBar-tabIcon ${gitTabStyle}`;
    this.git_plugin.title.caption = 'Git';

    // Let the application restorer track the running panel for restoration of
    // application state (e.g. setting the running panel as the current side bar
    // widget).

    restorer.add(this.git_plugin, 'git-sessions');
    app.shell.addToLeftArea(this.git_plugin, { rank: 200 });

    this.git_clone_widget = new GitClone(factory);
  }

  registerDiffProvider(filetypes: string[], callback: IDiffCallback): void {
    filetypes.forEach(fileType => {
      this.diffProviders[fileType] = callback;
    });
  }

  performDiff(
    app: JupyterLab,
    filename: string,
    revisionA: string,
    revisionB: string
  ) {
    let extension = PathExt.extname(filename).toLocaleLowerCase();
    if (this.diffProviders[extension] !== undefined) {
      this.diffProviders[extension](filename, revisionA, revisionB);
    } else {
      app.commands.execute('git:terminal-cmd', {
        cmd: 'git diff ' + revisionA + ' ' + revisionB
      });
    }
  }

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
  let git_extension = new GitExtension(app, restorer, factory);
  const category = 'Git';

  // Rank has been chosen somewhat arbitrarily to give priority to the running
  // sessions widget in the sidebar.
  addCommands(app, app.serviceManager);
  let menu = new Menu({ commands });
  let tutorial = new Menu({ commands });
  tutorial.title.label = ' Tutorial ';
  menu.title.label = category;
  [
    CommandIDs.gitUI,
    CommandIDs.gitTerminal,
    CommandIDs.gitInit
  ].forEach(command => {
    menu.addItem({ command });
  });

  [CommandIDs.setupRemotes, CommandIDs.googleLink].forEach(command => {
    tutorial.addItem({ command });
  });
  menu.addItem({ type: 'submenu', submenu: tutorial });
  mainMenu.addMenu(menu, { rank: 60 });

  return git_extension;
}
