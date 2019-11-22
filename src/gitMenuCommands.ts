import { JupyterFrontEnd } from '@jupyterlab/application';
import { Dialog, MainAreaWidget, showDialog } from '@jupyterlab/apputils';
import { FileBrowser } from '@jupyterlab/filebrowser';
import { ITerminal } from '@jupyterlab/terminal';
import { IGitExtension } from './tokens';
import { ISettingRegistry } from '@jupyterlab/coreutils';

/**
 * The command IDs used by the git plugin.
 */
export namespace CommandIDs {
  export const gitUI = 'git:ui';
  export const gitTerminalCommand = 'git:terminal-command';
  export const gitInit = 'git:init';
  export const gitOpenUrl = 'git:open-url';
  export const gitToggleSimpleStaging = 'git:toggle-simple-staging';
}

/**
 * Add the commands for the git extension.
 */
export function addCommands(
  app: JupyterFrontEnd,
  model: IGitExtension,
  fileBrowser: FileBrowser,
  settings: ISettingRegistry.ISettings
) {
  const { commands, shell } = app;

  /**
   * Add open terminal and run command
   *
   * Argument 'cmd' can be passed at the execute function to specify the command to execute
   */
  commands.addCommand(CommandIDs.gitTerminalCommand, {
    label: 'Git Command in Terminal',
    caption: 'Open a new terminal to perform git command',
    execute: async args => {
      let changeDirectoryCommand =
        model.pathRepository === null
          ? ''
          : 'cd "' + model.pathRepository.split('"').join('\\"') + '"';
      let gitCommand = (args['cmd'] as string) || '';
      let linkCommand =
        changeDirectoryCommand !== '' && gitCommand !== '' ? '&&' : '';

      const main = (await commands.execute(
        'terminal:create-new',
        args
      )) as MainAreaWidget<ITerminal.ITerminal>;

      const terminal = main.content;
      try {
        terminal.session.send({
          type: 'stdin',
          content: [changeDirectoryCommand + linkCommand + gitCommand + '\n']
        });

        return main;
      } catch (e) {
        console.error(e);
        main.dispose();
      }
    }
  });

  /** Add open/go to git interface command */
  commands.addCommand(CommandIDs.gitUI, {
    label: 'Git Interface',
    caption: 'Go to Git user interface',
    execute: () => {
      try {
        shell.activateById('jp-git-sessions');
      } catch (err) {}
    }
  });

  /** Add git init command */
  commands.addCommand(CommandIDs.gitInit, {
    label: 'Init',
    caption: ' Create an empty Git repository or reinitialize an existing one',
    execute: async () => {
      const currentPath = fileBrowser.model.path;
      const result = await showDialog({
        title: 'Initialize a Repository',
        body: 'Do you really want to make this directory a Git Repo?',
        buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Yes' })]
      });

      if (result.button.accept) {
        await model.init(currentPath);
        model.pathRepository = currentPath;
      }
    }
  });

  /** Open URL externally */
  commands.addCommand(CommandIDs.gitOpenUrl, {
    label: args => args['text'] as string,
    execute: args => {
      const url = args['url'] as string;
      window.open(url);
    }
  });

  /** add toggle for simple staging */
  commands.addCommand(CommandIDs.gitToggleSimpleStaging, {
    label: 'Simple staging',
    isToggled: () => !!settings.composite['simpleStaging'],
    execute: args => {
      settings.set('simpleStaging', !settings.composite['simpleStaging']);
    }
  });
}
