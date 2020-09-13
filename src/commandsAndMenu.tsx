import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  Dialog,
  InputDialog,
  MainAreaWidget,
  ReactWidget,
  showDialog,
  showErrorMessage
} from '@jupyterlab/apputils';
import { ISettingRegistry, PathExt } from '@jupyterlab/coreutils';
import { FileBrowser } from '@jupyterlab/filebrowser';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ITerminal } from '@jupyterlab/terminal';
import { CommandRegistry } from '@phosphor/commands';
import { Menu } from '@phosphor/widgets';
import * as React from 'react';
import { style } from 'typestyle';
import {
  Diff,
  isDiffSupported,
  RenderMimeProvider
} from './components/diff/Diff';
import { getRefValue, IDiffContext } from './components/diff/model';
import { GitExtension } from './model';
import { Git } from './tokens';
import { GitCredentialsForm } from './widgets/CredentialsBox';
import { doGitClone } from './widgets/gitClone';
import { GitPullPushDialog, Operation } from './widgets/gitPushPull';

const RESOURCES = [
  {
    text: 'Set Up Remotes',
    url: 'https://www.atlassian.com/git/tutorials/setting-up-a-repository'
  },
  {
    text: 'Git Documentation',
    url: 'https://git-scm.com/doc'
  }
];

/**
 * The command IDs used by the git plugin.
 */
export namespace CommandIDs {
  export const gitUI = 'git:ui';
  export const gitTerminalCommand = 'git:terminal-command';
  export const gitInit = 'git:init';
  export const gitOpenUrl = 'git:open-url';
  export const gitToggleSimpleStaging = 'git:toggle-simple-staging';
  export const gitToggleDoubleClickDiff = 'git:toggle-double-click-diff';
  export const gitAddRemote = 'git:add-remote';
  export const gitClone = 'git:clone';
  export const gitOpenGitignore = 'git:open-gitignore';
  export const gitPush = 'git:push';
  export const gitPull = 'git:pull';
  // Context menu commands
  export const gitFileDiff = 'git:context-diff';
  export const gitFileDiscard = 'git:context-discard';
  export const gitFileOpen = 'git:context-open';
  export const gitFileUnstage = 'git:context-unstage';
  export const gitFileStage = 'git:context-stage';
  export const gitFileTrack = 'git:context-track';
  export const gitIgnore = 'git:context-ignore';
  export const gitIgnoreExtension = 'git:context-ignoreExtension';
}

/**
 * Add the commands for the git extension.
 */
export function addCommands(
  app: JupyterFrontEnd,
  model: GitExtension,
  fileBrowser: FileBrowser,
  settings: ISettingRegistry.ISettings,
  renderMime: IRenderMimeRegistry
) {
  const { commands, shell } = app;

  /**
   * Add open terminal in the Git repository
   */
  commands.addCommand(CommandIDs.gitTerminalCommand, {
    label: 'Open Git Repository in Terminal',
    caption: 'Open a New Terminal to the Git Repository',
    execute: async args => {
      const main = (await commands.execute(
        'terminal:create-new',
        args
      )) as MainAreaWidget<ITerminal.ITerminal>;

      try {
        if (model.pathRepository !== null) {
          const terminal = main.content;
          terminal.session.send({
            type: 'stdin',
            content: [`cd "${model.pathRepository.split('"').join('\\"')}"\n`]
          });
        }

        return main;
      } catch (e) {
        console.error(e);
        main.dispose();
      }
    },
    isEnabled: () => model.pathRepository !== null
  });

  /** Add open/go to git interface command */
  commands.addCommand(CommandIDs.gitUI, {
    label: 'Git Interface',
    caption: 'Go to Git user interface',
    execute: () => {
      try {
        shell.activateById('jp-git-sessions');
      } catch (err) {
        console.error('Fail to open Git tab.');
      }
    }
  });

  /** Add git init command */
  commands.addCommand(CommandIDs.gitInit, {
    label: 'Initialize a Repository',
    caption: 'Create an empty Git repository or reinitialize an existing one',
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
    },
    isEnabled: () => model.pathRepository === null
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

  /** add toggle for double click opens diffs */
  commands.addCommand(CommandIDs.gitToggleDoubleClickDiff, {
    label: 'Double click opens diff',
    isToggled: () => !!settings.composite['doubleClickDiff'],
    execute: args => {
      settings.set('doubleClickDiff', !settings.composite['doubleClickDiff']);
    }
  });

  /** Command to add a remote Git repository */
  commands.addCommand(CommandIDs.gitAddRemote, {
    label: 'Add Remote Repository',
    caption: 'Add a Git remote repository',
    isEnabled: () => model.pathRepository !== null,
    execute: async args => {
      if (model.pathRepository === null) {
        console.warn('Not in a Git repository. Unable to add a remote.');
        return;
      }
      let url = args['url'] as string;
      const name = args['name'] as string;

      if (!url) {
        const result = await InputDialog.getText({
          title: 'Add a remote repository',
          placeholder: 'Remote Git repository URL'
        });

        if (result.button.accept) {
          url = result.value;
        }
      }

      if (url) {
        try {
          await model.addRemote(url, name);
        } catch (error) {
          console.error(error);
          showErrorMessage('Error when adding remote repository', error);
        }
      }
    }
  });

  /** Add git clone command */
  commands.addCommand(CommandIDs.gitClone, {
    label: 'Clone a Repository',
    caption: 'Clone a repository from a URL',
    isEnabled: () => model.pathRepository === null,
    execute: async () => {
      await doGitClone(model, fileBrowser.model.path);
      fileBrowser.model.refresh();
    }
  });

  /** Add git open gitignore command */
  commands.addCommand(CommandIDs.gitOpenGitignore, {
    label: 'Open .gitignore',
    caption: 'Open .gitignore',
    isEnabled: () => model.pathRepository !== null,
    execute: async () => {
      await model.ensureGitignore();
    }
  });

  /** Add git push command */
  commands.addCommand(CommandIDs.gitPush, {
    label: 'Push to Remote',
    caption: 'Push code to remote repository',
    isEnabled: () => model.pathRepository !== null,
    execute: async () => {
      await Private.showGitOperationDialog(model, Operation.Push).catch(
        reason => {
          console.error(
            `Encountered an error when pushing changes. Error: ${reason}`
          );
        }
      );
    }
  });

  /** Add git pull command */
  commands.addCommand(CommandIDs.gitPull, {
    label: 'Pull from Remote',
    caption: 'Pull latest code from remote repository',
    isEnabled: () => model.pathRepository !== null,
    execute: async () => {
      await Private.showGitOperationDialog(model, Operation.Pull).catch(
        reason => {
          console.error(
            `Encountered an error when pulling changes. Error: ${reason}`
          );
        }
      );
    }
  });

  /* Context menu commands */
  commands.addCommand(CommandIDs.gitFileOpen, {
    label: 'Open',
    caption: 'Open selected file',
    execute: async args => {
      const file: Git.IStatusFileResult = args as any;

      const { x, y, to } = file;
      if (x === 'D' || y === 'D') {
        await showErrorMessage(
          'Open File Failed',
          'This file has been deleted!'
        );
        return;
      }
      try {
        if (to[to.length - 1] !== '/') {
          commands.execute('docmanager:open', {
            path: model.getRelativeFilePath(to)
          });
        } else {
          console.log('Cannot open a folder here');
        }
      } catch (err) {
        console.error(`Fail to open ${to}.`);
      }
    }
  });

  commands.addCommand(CommandIDs.gitFileDiff, {
    label: 'Diff',
    caption: 'Diff selected file',
    execute: args => {
      const { context, filePath, isText, status } = (args as any) as {
        context?: IDiffContext;
        filePath: string;
        isText: boolean;
        status?: Git.Status;
      };

      let diffContext = context;
      if (!diffContext) {
        const specialRef = status === 'staged' ? 'INDEX' : 'WORKING';
        diffContext = {
          currentRef: { specialRef },
          previousRef: { gitRef: 'HEAD' }
        };
      }

      if (isDiffSupported(filePath) || isText) {
        const id = `nbdiff-${filePath}-${getRefValue(diffContext.currentRef)}`;
        const mainAreaItems = shell.widgets('main');
        let mainAreaItem = mainAreaItems.next();
        while (mainAreaItem) {
          if (mainAreaItem.id === id) {
            shell.activateById(id);
            break;
          }
          mainAreaItem = mainAreaItems.next();
        }

        if (!mainAreaItem) {
          const serverRepoPath = model.getRelativeFilePath();
          const nbDiffWidget = ReactWidget.create(
            <RenderMimeProvider value={renderMime}>
              <Diff
                path={filePath}
                diffContext={diffContext}
                topRepoPath={serverRepoPath}
              />
            </RenderMimeProvider>
          );
          nbDiffWidget.id = id;
          nbDiffWidget.title.label = PathExt.basename(filePath);
          nbDiffWidget.title.iconClass = style({
            backgroundImage: 'var(--jp-icon-diff)'
          });
          nbDiffWidget.title.closable = true;
          nbDiffWidget.addClass('jp-git-diff-parent-diff-widget');

          shell.add(nbDiffWidget, 'main');
          shell.activateById(nbDiffWidget.id);
        }
      } else {
        showErrorMessage(
          'Diff Not Supported',
          `Diff is not supported for ${PathExt.extname(
            filePath
          ).toLocaleLowerCase()} files.`
        );
      }
    }
  });

  commands.addCommand(CommandIDs.gitFileStage, {
    label: 'Stage',
    caption: 'Stage the changes of selected file',
    execute: async args => {
      const selectedFile: Git.IStatusFile = args as any;
      await model.add(selectedFile.to);
    }
  });

  commands.addCommand(CommandIDs.gitFileTrack, {
    label: 'Track',
    caption: 'Start tracking selected file',
    execute: async args => {
      const selectedFile: Git.IStatusFile = args as any;
      await model.add(selectedFile.to);
    }
  });

  commands.addCommand(CommandIDs.gitFileUnstage, {
    label: 'Unstage',
    caption: 'Unstage the changes of selected file',
    execute: async args => {
      const selectedFile: Git.IStatusFile = args as any;
      if (selectedFile.x !== 'D') {
        await model.reset(selectedFile.to);
      }
    }
  });

  commands.addCommand(CommandIDs.gitFileDiscard, {
    label: 'Discard',
    caption: 'Discard recent changes of selected file',
    execute: async args => {
      const file: Git.IStatusFile = args as any;

      const result = await showDialog({
        title: 'Discard changes',
        body: (
          <span>
            Are you sure you want to permanently discard changes to{' '}
            <b>{file.to}</b>? This action cannot be undone.
          </span>
        ),
        buttons: [
          Dialog.cancelButton(),
          Dialog.warnButton({ label: 'Discard' })
        ]
      });
      if (result.button.accept) {
        try {
          if (file.status === 'staged' || file.status === 'partially-staged') {
            await model.reset(file.to);
          }
          if (
            file.status === 'unstaged' ||
            (file.status === 'partially-staged' && file.x !== 'A')
          ) {
            // resetting an added file moves it to untracked category => checkout will fail
            await model.checkout({ filename: file.to });
          }
        } catch (reason) {
          showErrorMessage(`Discard changes for ${file.to} failed.`, reason, [
            Dialog.warnButton({ label: 'DISMISS' })
          ]);
        }
      }
    }
  });

  commands.addCommand(CommandIDs.gitIgnore, {
    label: () => 'Ignore this file (add to .gitignore)',
    caption: () => 'Ignore this file (add to .gitignore)',
    execute: async args => {
      const selectedFile: Git.IStatusFile = args as any;
      if (selectedFile) {
        await model.ignore(selectedFile.to, false);
      }
    }
  });

  commands.addCommand(CommandIDs.gitIgnoreExtension, {
    label: args => {
      const selectedFile: Git.IStatusFile = args as any;
      return `Ignore ${PathExt.extname(
        selectedFile.to
      )} extension (add to .gitignore)`;
    },
    caption: 'Ignore this file extension (add to .gitignore)',
    execute: async args => {
      const selectedFile: Git.IStatusFile = args as any;
      if (selectedFile) {
        const extension = PathExt.extname(selectedFile.to);
        if (extension.length > 0) {
          const result = await showDialog({
            title: 'Ignore file extension',
            body: `Are you sure you want to ignore all ${extension} files within this git repository?`,
            buttons: [
              Dialog.cancelButton(),
              Dialog.okButton({ label: 'Ignore' })
            ]
          });
          if (result.button.label === 'Ignore') {
            await model.ignore(selectedFile.to, true);
          }
        }
      }
    },
    isVisible: args => {
      const selectedFile: Git.IStatusFile = args as any;
      const extension = PathExt.extname(selectedFile.to);
      return extension.length > 0;
    }
  });
}

/**
 * Adds commands and menu items.
 *
 * @private
 * @param app - Jupyter front end
 * @param gitExtension - Git extension instance
 * @param fileBrowser - file browser instance
 * @param settings - extension settings
 * @returns menu
 */
export function createGitMenu(commands: CommandRegistry): Menu {
  const menu = new Menu({ commands });
  menu.title.label = 'Git';
  [
    CommandIDs.gitInit,
    CommandIDs.gitClone,
    CommandIDs.gitPush,
    CommandIDs.gitPull,
    CommandIDs.gitAddRemote,
    CommandIDs.gitTerminalCommand
  ].forEach(command => {
    menu.addItem({ command });
  });

  menu.addItem({ type: 'separator' });

  menu.addItem({ command: CommandIDs.gitToggleSimpleStaging });

  menu.addItem({ command: CommandIDs.gitToggleDoubleClickDiff });

  menu.addItem({ type: 'separator' });

  menu.addItem({ command: CommandIDs.gitOpenGitignore });

  menu.addItem({ type: 'separator' });

  const tutorial = new Menu({ commands });
  tutorial.title.label = ' Help ';
  RESOURCES.map(args => {
    tutorial.addItem({
      args,
      command: CommandIDs.gitOpenUrl
    });
  });

  menu.addItem({ type: 'submenu', submenu: tutorial });

  return menu;
}

/* eslint-disable no-inner-declarations */
namespace Private {
  /**
   * Displays an error dialog when a Git operation fails.
   *
   * @private
   * @param model - Git extension model
   * @param operation - Git operation name
   * @returns Promise for displaying a dialog
   */
  export async function showGitOperationDialog(
    model: GitExtension,
    operation: Operation
  ): Promise<void> {
    const title = `Git ${operation}`;
    let result = await showDialog({
      title: title,
      body: new GitPullPushDialog(model, operation),
      buttons: [Dialog.okButton({ label: 'DISMISS' })]
    });
    let retry = false;
    while (!result.button.accept) {
      const credentials = await showDialog({
        title: 'Git credentials required',
        body: new GitCredentialsForm(
          'Enter credentials for remote repository',
          retry ? 'Incorrect username or password.' : ''
        ),
        buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'OK' })]
      });

      if (!credentials.button.accept) {
        break;
      }

      result = await showDialog({
        title: title,
        body: new GitPullPushDialog(model, operation, credentials.value),
        buttons: [Dialog.okButton({ label: 'DISMISS' })]
      });
      retry = true;
    }
  }
}
/* eslint-enable no-inner-declarations */
