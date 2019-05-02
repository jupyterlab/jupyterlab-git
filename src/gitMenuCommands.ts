import { JupyterLab } from '@jupyterlab/application';
import { Dialog, InstanceTracker, showDialog } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ServiceManager } from '@jupyterlab/services';
import { Terminal } from '@jupyterlab/terminal';
import { Menu } from '@phosphor/widgets';
import { Git } from './git';

/**
 * The command IDs used by the git plugin.
 */
export namespace CommandIDs {
  export const gitUI = 'git:ui';
  export const gitTerminal = 'git:create-new-terminal';
  export const gitInit = 'git:init';
  export const setupRemotes = 'git:tutorial-remotes';
  export const googleLink = 'git:google-link';
}

/**
 * Adds the Menu Items under the "Git" section.
 *
 * @param commands the commands in the JupyterLab App
 * @param mainMenu the IMainMenu instance in the JupyterLab App
 */
export function addMenuItems(commands, mainMenu: IMainMenu) {
  const category = 'Git';
  let menu = new Menu({ commands });
  let tutorial = new Menu({ commands });
  tutorial.title.label = ' Tutorial ';
  menu.title.label = category;
  [CommandIDs.gitUI, CommandIDs.gitTerminal, CommandIDs.gitInit].forEach(
    command => {
      console.log('Adding command for something again again');
      menu.addItem({ command });
    }
  );
  [CommandIDs.setupRemotes, CommandIDs.googleLink].forEach(command => {
    tutorial.addItem({ command });
  });
  menu.addItem({ type: 'submenu', submenu: tutorial });
  mainMenu.addMenu(menu, { rank: 60 });
}

/**
 * Add the commands for the git extension.
 */
export function addCommands(app: JupyterLab, services: ServiceManager) {
  let { commands } = app;
  const namespace = 'terminal';
  const tracker = new InstanceTracker<Terminal>({ namespace });
  let gitApi = new Git();

  /**
   * Get the current path of the working directory in the File Browser, relative to the Jupyter
   * server root.
   */
  function findCurrentFileBrowserPath(): string {
    try {
      let leftSidebarItems = app.shell.widgets('left');
      let fileBrowser = leftSidebarItems.next();
      while (fileBrowser.id !== 'filebrowser') {
        fileBrowser = leftSidebarItems.next();
      }
      return (fileBrowser as any).model.path;
    } catch (err) {}
  }

  /** Add open terminal command */
  commands.addCommand(CommandIDs.gitTerminal, {
    label: 'Open Terminal',
    caption: 'Start a new terminal session to directly use git command',
    execute: args => {
      let currentFileBrowserPath = findCurrentFileBrowserPath();
      let name = args ? (args['name'] as string) : '';
      let terminal = new Terminal();
      terminal.title.closable = true;
      terminal.title.label = '...';
      app.shell.addToMainArea(terminal);
      let promise = name
        ? services.terminals.connectTo(name)
        : services.terminals.startNew();

      return promise
        .then(session => {
          terminal.session = session;
          tracker.add(terminal);
          app.shell.activateById(terminal.id);
          terminal.session.send({
            type: 'stdin',
            content: [
              'cd "' +
                app.info.directories.serverRoot +
                '/' +
                currentFileBrowserPath.split('"').join('\\"') +
                '"\n'
            ]
          });
          return terminal;
        })
        .catch(() => {
          terminal.dispose();
        });
    }
  });

  /** Add open/go to git interface command */
  commands.addCommand(CommandIDs.gitUI, {
    label: 'Git Interface',
    caption: 'Go to Git user interface',
    execute: () => {
      try {
        app.shell.activateById('jp-git-sessions');
      } catch (err) {}
    }
  });

  /** Add git init command */
  commands.addCommand(CommandIDs.gitInit, {
    label: 'Init',
    caption: ' Create an empty Git repository or reinitialize an existing one',
    execute: () => {
      let currentFileBrowserPath = findCurrentFileBrowserPath();
      showDialog({
        title: 'Initialize a Repository',
        body: 'Do you really want to make this directory a Git Repo?',
        buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Yes' })]
      }).then(result => {
        if (result.button.accept) {
          gitApi.init(currentFileBrowserPath);
        }
      });
    }
  });

  /** Add remote tutorial command */
  commands.addCommand(CommandIDs.setupRemotes, {
    label: 'Set Up Remotes',
    caption: 'Learn about Remotes',
    execute: () => {
      window.open(
        'https://www.atlassian.com/git/tutorials/setting-up-a-repository'
      );
    }
  });

  /** Add remote tutorial command */
  commands.addCommand(CommandIDs.googleLink, {
    label: 'Something Else',
    caption: 'Dummy Link ',
    execute: () => {
      window.open('https://www.google.com');
    }
  });
}
