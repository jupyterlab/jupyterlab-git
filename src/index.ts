import {
  addCommands, CommandIDs
 } from './git_mainmenu_command'
import {
	  FileBrowser, IFileBrowserFactory
} from '@jupyterlab/filebrowser';

import {
  GitSessions
 } from './components/components'

 import {
  ServiceManager
} from '@jupyterlab/services';

import {
  ILayoutRestorer, JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
  IServiceManager
} from '@jupyterlab/services';

import {
   IMainMenu
} from '@jupyterlab/apputils';

import {
  ConsolePanel
} from '@jupyterlab/console';

import {
  Session
} from '@jupyterlab/services';

import {
   Menu
} from '@phosphor/widgets';

/**
 * The default running sessions extension.
 */
const plugin: JupyterLabPlugin<void> = {
  activate,
  id: 'jupyter.extensions.running-sessions-git',
  requires: [IServiceManager, IFileBrowserFactory, IMainMenu, ILayoutRestorer],
  autoStart: true
};


/**
 * Export the plugin as default.
 */
export default plugin;


/**
 * Activate the running plugin.
 */
function activate(app: JupyterLab, services: ServiceManager, fb:FileBrowser, mainMenu: IMainMenu, restorer: ILayoutRestorer, panel: ConsolePanel,model: Session.IModel): void {
  const { commands} = app;
  const category = 'Git';
  let git_plugin = new GitSessions(app, { manager: services });
  git_plugin.id = 'jp-git-sessions';
  git_plugin.title.label = 'Git';
  // Let the application restorer track the running panel for restoration of
  // application state (e.g. setting the running panel as the current side bar
  // widget).

  restorer.add(git_plugin, 'git-sessions');

  // Rank has been chosen somewhat arbitrarily to give priority to the running
  // sessions widget in the sidebar.
  app.shell.addToLeftArea(git_plugin, { rank: 200 });

  addCommands(app, services);
  let menu = new Menu({commands});
  let tutorial = new Menu({commands});
  tutorial.title.label = " Tutorial ";
  menu.title.label = category;
  [
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
}