
import {
  addCommands, CommandIDs
 } from './git_mainmenu_command'
import {
	  FileBrowser, IFileBrowserFactory
} from '@jupyterlab/filebrowser';

import {
  PathExt
} from '@jupyterlab/coreutils';

import {
  GitSessions
 } from './components/components'

import {
  ILayoutRestorer, JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
   IMainMenu
} from '@jupyterlab/mainmenu';

import {
   Menu
} from '@phosphor/widgets';
import {
  Token
} from '@phosphor/coreutils';

/**
 * The default running sessions extension.
 */
const plugin: JupyterLabPlugin<IGitExtension> = {
  id: 'jupyter.extensions.running-sessions-git',
  requires: [IFileBrowserFactory, IMainMenu, ILayoutRestorer],
  activate,
  autoStart: true
};


/**
 * Export the plugin as default.
 */
export default plugin;

export const EXTENSION_ID = 'jupyter.extensions.git_plugin'

export const IGitExtension = new Token<IGitExtension>(EXTENSION_ID);

export interface IGitExtension {
  register_diff_provider(filetypes: string[], callback: IDiffCallback);
}

export type IDiffCallback = (filename: string, revisionA: string, revisionB: string) => void;

export class GitExtension implements IGitExtension{
  git_plugin;
  constructor(app: JupyterLab, restorer: ILayoutRestorer){
    this.git_plugin = new GitSessions(app, { manager: app.serviceManager }, this.performDiff.bind(this));
    this.git_plugin.id = 'jp-git-sessions';
    this.git_plugin.title.label = 'Git';
  // Let the application restorer track the running panel for restoration of
  // application state (e.g. setting the running panel as the current side bar
  // widget).

    restorer.add(this.git_plugin, 'git-sessions');
    app.shell.addToLeftArea(this.git_plugin, { rank: 200 });
  }

  register_diff_provider(filetypes: string[], callback: IDiffCallback) {
    for (let fileType of filetypes) {
      this.diffProviders[fileType] = callback;
    }
    console.log('new diff method');
  }

  performDiff(app: JupyterLab, filename: string, revisionA: string, revisionB: string) {
    let extension = PathExt.extname(filename).toLocaleLowerCase();
    console.log(extension);
    console.log(this.diffProviders[extension]);
    if (this.diffProviders[extension]!== undefined) {
      this.diffProviders[extension](filename, revisionA, revisionB);
    } else {
      app.commands.execute('git:terminal-cmd',{'cmd':'git diff '+revisionA+' '+revisionB});
    }
  }

  private diffProviders: { [key: string]: IDiffCallback } = {};

}
/**
 * Activate the running plugin.
 */
function activate(app: JupyterLab, fb:FileBrowser, mainMenu: IMainMenu, restorer: ILayoutRestorer): IGitExtension {
  const { commands} = app;
  let git_extension = new GitExtension(app, restorer);
  const category = 'Git';


  // Rank has been chosen somewhat arbitrarily to give priority to the running
  // sessions widget in the sidebar.

  addCommands(app, app.serviceManager);
  let menu = new Menu({commands});
  let tutorial = new Menu({commands});
  tutorial.title.label = " Tutorial ";
  menu.title.label = category;
  [
    CommandIDs.git_UI,
    CommandIDs.git_terminal,
    CommandIDs.git_pull,
    CommandIDs.git_push,
    CommandIDs.git_init,
  ].forEach(command =>{
    menu.addItem({command});
  });
  
  [
    CommandIDs.setup_remotes,
    CommandIDs.tutorial_Pull,
    CommandIDs.tutorial_Push,
    CommandIDs.link4
  ].forEach(command => {
    tutorial.addItem({command});
  });
  menu.addItem({type: 'submenu' , submenu: tutorial});
  mainMenu.addMenu(menu,{rank:60});
  return git_extension;
}