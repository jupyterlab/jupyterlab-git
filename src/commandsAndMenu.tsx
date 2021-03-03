/* eslint-disable @typescript-eslint/quotes */
import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  Dialog,
  InputDialog,
  MainAreaWidget,
  ReactWidget,
  showDialog,
  showErrorMessage
} from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { FileBrowser } from '@jupyterlab/filebrowser';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITerminal } from '@jupyterlab/terminal';
import { CommandRegistry } from '@lumino/commands';
import { Menu } from '@lumino/widgets';
import * as React from 'react';
import {
  Diff,
  isDiffSupported,
  RenderMimeProvider
} from './components/diff/Diff';
import { getRefValue, IDiffContext } from './components/diff/model';
import { AUTH_ERROR_MESSAGES } from './git';
import { logger } from './logger';
import { GitExtension } from './model';
import { diffIcon } from './style/icons';
import { Git, Level } from './tokens';
import { GitCredentialsForm } from './widgets/CredentialsBox';
import { GitCloneForm } from './widgets/GitCloneForm';
import {
  ITranslator,
  nullTranslator,
  TranslationBundle
} from '@jupyterlab/translation';

interface IGitCloneArgs {
  /**
   * Path in which to clone the Git repository
   */
  path: string;
  /**
   * Git repository url
   */
  url: string;
}

/**
 * Git operations requiring authentication
 */
enum Operation {
  Clone = 'Clone',
  Pull = 'Pull',
  Push = 'Push'
}

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
  export const gitFileDelete = 'git:context-delete';
  export const gitFileOpen = 'git:context-open';
  export const gitFileUnstage = 'git:context-unstage';
  export const gitFileStage = 'git:context-stage';
  export const gitFileTrack = 'git:context-track';
  export const gitIgnore = 'git:context-ignore';
  export const gitIgnoreExtension = 'git:context-ignoreExtension';
}

export const SUBMIT_COMMIT_COMMAND = 'git:submit-commit';

/**
 * Add the commands for the git extension.
 */
export function addCommands(
  app: JupyterFrontEnd,
  model: GitExtension,
  fileBrowser: FileBrowser,
  settings: ISettingRegistry.ISettings,
  renderMime: IRenderMimeRegistry,
  trans: TranslationBundle
) {
  const { commands, shell } = app;

  /**
   * Commit using a keystroke combination when in CommitBox.
   *
   * This command is not accessible from the user interface (not visible),
   * as it is handled by a signal listener in the CommitBox component instead.
   * The label and caption are given to ensure that the command will
   * show up in the shortcut editor UI with a nice description.
   */
  commands.addCommand(SUBMIT_COMMIT_COMMAND, {
    label: 'Commit from the Commit Box',
    caption:
      'Submit the commit using the summary and description from commit box',
    execute: () => void 0,
    isVisible: () => false
  });

  /**
   * Add open terminal in the Git repository
   */
  commands.addCommand(CommandIDs.gitTerminalCommand, {
    label: trans.__('Open Git Repository in Terminal'),
    caption: trans.__('Open a New Terminal to the Git Repository'),
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
    label: trans.__('Git Interface'),
    caption: trans.__('Go to Git user interface'),
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
    label: trans.__('Initialize a Repository'),
    caption: trans.__(
      'Create an empty Git repository or reinitialize an existing one'
    ),
    execute: async () => {
      const currentPath = fileBrowser.model.path;
      const result = await showDialog({
        title: trans.__('Initialize a Repository'),
        body: trans.__('Do you really want to make this directory a Git Repo?'),
        buttons: [
          Dialog.cancelButton({ label: trans.__('Cancel') }),
          Dialog.warnButton({ label: trans.__('Yes') })
        ]
      });

      if (result.button.accept) {
        logger.log({
          message: trans.__('Initializing...'),
          level: Level.RUNNING
        });
        try {
          await model.init(currentPath);
          model.pathRepository = currentPath;
          logger.log({
            message: trans.__('Git repository initialized.'),
            level: Level.SUCCESS
          });
        } catch (error) {
          console.error(
            trans.__(
              'Encountered an error when initializing the repository. Error: '
            ),
            error
          );
          logger.log({
            message: trans.__('Failed to initialize the Git repository'),
            level: Level.ERROR,
            error
          });
        }
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
    label: trans.__('Simple staging'),
    isToggled: () => !!settings.composite['simpleStaging'],
    execute: args => {
      settings.set('simpleStaging', !settings.composite['simpleStaging']);
    }
  });

  /** add toggle for double click opens diffs */
  commands.addCommand(CommandIDs.gitToggleDoubleClickDiff, {
    label: trans.__('Double click opens diff'),
    isToggled: () => !!settings.composite['doubleClickDiff'],
    execute: args => {
      settings.set('doubleClickDiff', !settings.composite['doubleClickDiff']);
    }
  });

  /** Command to add a remote Git repository */
  commands.addCommand(CommandIDs.gitAddRemote, {
    label: trans.__('Add Remote Repository'),
    caption: trans.__('Add a Git remote repository'),
    isEnabled: () => model.pathRepository !== null,
    execute: async args => {
      if (model.pathRepository === null) {
        console.warn(
          trans.__('Not in a Git repository. Unable to add a remote.')
        );
        return;
      }
      let url = args['url'] as string;
      const name = args['name'] as string;

      if (!url) {
        const result = await InputDialog.getText({
          title: trans.__('Add a remote repository'),
          placeholder: trans.__('Remote Git repository URL')
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
          showErrorMessage(
            trans.__('Error when adding remote repository'),
            error
          );
        }
      }
    }
  });

  /** Add git clone command */
  commands.addCommand(CommandIDs.gitClone, {
    label: trans.__('Clone a Repository'),
    caption: trans.__('Clone a repository from a URL'),
    isEnabled: () => model.pathRepository === null,
    execute: async () => {
      const result = await showDialog({
        title: trans.__('Clone a repo'),
        body: new GitCloneForm(trans),
        focusNodeSelector: 'input',
        buttons: [
          Dialog.cancelButton({ label: trans.__('Cancel') }),
          Dialog.okButton({ label: trans.__('CLONE') })
        ]
      });

      if (result.button.accept && result.value) {
        logger.log({
          level: Level.RUNNING,
          message: trans.__('Cloning...')
        });
        try {
          const details = await Private.showGitOperationDialog<IGitCloneArgs>(
            model,
            Operation.Clone,
            trans,
            { path: fileBrowser.model.path, url: result.value }
          );
          logger.log({
            message: trans.__('Successfully cloned'),
            level: Level.SUCCESS,
            details
          });
          await fileBrowser.model.refresh();
        } catch (error) {
          console.error(
            'Encountered an error when cloning the repository. Error: ',
            error
          );
          logger.log({
            message: trans.__('Failed to clone'),
            level: Level.ERROR,
            error
          });
        }
      }
    }
  });

  /** Add git open gitignore command */
  commands.addCommand(CommandIDs.gitOpenGitignore, {
    label: trans.__('Open .gitignore'),
    caption: trans.__('Open .gitignore'),
    isEnabled: () => model.pathRepository !== null,
    execute: async () => {
      await model.ensureGitignore();
    }
  });

  /** Add git push command */
  commands.addCommand(CommandIDs.gitPush, {
    label: trans.__('Push to Remote'),
    caption: trans.__('Push code to remote repository'),
    isEnabled: () => model.pathRepository !== null,
    execute: async () => {
      logger.log({
        level: Level.RUNNING,
        message: trans.__('Pushing...')
      });
      try {
        const details = await Private.showGitOperationDialog(
          model,
          Operation.Push,
          trans
        );
        logger.log({
          message: trans.__('Successfully pushed'),
          level: Level.SUCCESS,
          details
        });
      } catch (error) {
        console.error(
          trans.__('Encountered an error when pushing changes. Error: '),
          error
        );
        logger.log({
          message: trans.__('Failed to push'),
          level: Level.ERROR,
          error
        });
      }
    }
  });

  /** Add git pull command */
  commands.addCommand(CommandIDs.gitPull, {
    label: trans.__('Pull from Remote'),
    caption: trans.__('Pull latest code from remote repository'),
    isEnabled: () => model.pathRepository !== null,
    execute: async () => {
      logger.log({
        level: Level.RUNNING,
        message: trans.__('Pulling...')
      });
      try {
        const details = await Private.showGitOperationDialog(
          model,
          Operation.Pull,
          trans
        );
        logger.log({
          message: trans.__('Successfully pulled'),
          level: Level.SUCCESS,
          details
        });
      } catch (error) {
        console.error(
          'Encountered an error when pulling changes. Error: ',
          error
        );
        logger.log({
          message: trans.__('Failed to pull'),
          level: Level.ERROR,
          error
        });
      }
    }
  });

  /* Context menu commands */
  commands.addCommand(CommandIDs.gitFileOpen, {
    label: trans.__('Open'),
    caption: trans.__('Open selected file'),
    execute: async args => {
      const file: Git.IStatusFileResult = args as any;

      const { x, y, to } = file;
      if (x === 'D' || y === 'D') {
        await showErrorMessage(
          trans.__('Open File Failed'),
          trans.__('This file has been deleted!')
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
    label: trans.__('Diff'),
    caption: trans.__('Diff selected file'),
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
          nbDiffWidget.title.icon = diffIcon;
          nbDiffWidget.title.closable = true;
          nbDiffWidget.addClass('jp-git-diff-parent-diff-widget');

          shell.add(nbDiffWidget, 'main');
          shell.activateById(nbDiffWidget.id);
        }
      } else {
        showErrorMessage(
          trans.__('Diff Not Supported'),
          trans.__(
            `Diff is not supported for %1 files.`,
            PathExt.extname(filePath).toLocaleLowerCase()
          )
        );
      }
    }
  });

  commands.addCommand(CommandIDs.gitFileStage, {
    label: trans.__('Stage'),
    caption: trans.__('Stage the changes of selected file'),
    execute: async args => {
      const selectedFile: Git.IStatusFile = args as any;
      await model.add(selectedFile.to);
    }
  });

  commands.addCommand(CommandIDs.gitFileTrack, {
    label: trans.__('Track'),
    caption: trans.__('Start tracking selected file'),
    execute: async args => {
      const selectedFile: Git.IStatusFile = args as any;
      await model.add(selectedFile.to);
    }
  });

  commands.addCommand(CommandIDs.gitFileUnstage, {
    label: trans.__('Unstage'),
    caption: trans.__('Unstage the changes of selected file'),
    execute: async args => {
      const selectedFile: Git.IStatusFile = args as any;
      if (selectedFile.x !== 'D') {
        await model.reset(selectedFile.to);
      }
    }
  });

  commands.addCommand(CommandIDs.gitFileDelete, {
    label: trans.__('Delete'),
    caption: trans.__('Delete this file'),
    execute: async args => {
      const file: Git.IStatusFile = args as any;
      const result = await showDialog({
        title: trans.__('Delete File'),
        body: (
          <span>
            {trans.__('Are you sure you want to permanently delete')}
            <b>{file.to}</b>? {trans.__('This action cannot be undone.')}
          </span>
        ),
        buttons: [
          Dialog.cancelButton({ label: trans.__('Cancel') }),
          Dialog.warnButton({ label: trans.__('Delete') })
        ]
      });
      if (result.button.accept) {
        try {
          await app.commands.execute('docmanager:delete-file', {
            path: model.getRelativeFilePath(file.to)
          });
        } catch (reason) {
          showErrorMessage(trans.__(`Deleting %1 failed.`, file.to), reason, [
            Dialog.warnButton({ label: trans.__('DISMISS') })
          ]);
        }
      }
    }
  });

  commands.addCommand(CommandIDs.gitFileDiscard, {
    label: trans.__('Discard'),
    caption: trans.__('Discard recent changes of selected file'),
    execute: async args => {
      const file: Git.IStatusFile = args as any;

      const result = await showDialog({
        title: trans.__('Discard changes'),
        body: (
          <span>
            {trans.__(
              'Are you sure you want to permanently discard changes to '
            )}
            <b>{file.to}</b>? {trans.__('This action cannot be undone.')}
          </span>
        ),
        buttons: [
          Dialog.cancelButton({ label: trans.__('Cancel') }),
          Dialog.warnButton({ label: trans.__('Discard') })
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
            Dialog.warnButton({ label: trans.__('DISMISS') })
          ]);
        }
      }
    }
  });

  commands.addCommand(CommandIDs.gitIgnore, {
    label: () => trans.__('Ignore this file (add to .gitignore)'),
    caption: () => trans.__('Ignore this file (add to .gitignore)'),
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
      return trans.__(
        `Ignore %1 extension (add to .gitignore)`,
        PathExt.extname(selectedFile.to)
      );
    },
    caption: trans.__('Ignore this file extension (add to .gitignore)'),
    execute: async args => {
      const selectedFile: Git.IStatusFile = args as any;
      if (selectedFile) {
        const extension = PathExt.extname(selectedFile.to);
        if (extension.length > 0) {
          const result = await showDialog({
            title: trans.__('Ignore file extension'),
            body: trans.__(
              `Are you sure you want to ignore all %1 files within this git repository?`,
              extension
            ),
            buttons: [
              Dialog.cancelButton({ label: trans.__('Cancel') }),
              Dialog.okButton({ label: trans.__('Ignore') })
            ]
          });
          if (result.button.label === trans.__('Ignore')) {
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
 * @param trans - language translator
 * @returns menu
 */
export function createGitMenu(
  commands: CommandRegistry,
  translator?: ITranslator
): Menu {
  const trans = (translator || nullTranslator).load('jupyterlab-git');
  const RESOURCES = [
    {
      text: trans.__('Set Up Remotes'),
      url: 'https://www.atlassian.com/git/tutorials/setting-up-a-repository'
    },
    {
      text: trans.__('Git Documentation'),
      url: 'https://git-scm.com/doc'
    }
  ];

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
  tutorial.title.label = trans.__(' Help ');
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
   * Handle Git operation that may require authentication.
   *
   * @private
   * @param model - Git extension model
   * @param operation - Git operation name
   * @param trans - language translator
   * @param args - Git operation arguments
   * @param authentication - Git authentication information
   * @param retry - Is this operation retried?
   * @returns Promise for displaying a dialog
   */
  export async function showGitOperationDialog<T>(
    model: GitExtension,
    operation: Operation,
    trans?: TranslationBundle,
    args?: T,
    authentication?: Git.IAuth,
    retry = false
  ): Promise<string> {
    try {
      let result: Git.IResultWithMessage;
      // the Git action
      switch (operation) {
        case Operation.Clone:
          // eslint-disable-next-line no-case-declarations
          const { path, url } = (args as any) as IGitCloneArgs;
          result = await model.clone(path, url, authentication);
          break;
        case Operation.Pull:
          result = await model.pull(authentication);
          break;
        case Operation.Push:
          result = await model.push(authentication);
          break;
        default:
          result = { code: -1, message: 'Unknown git command' };
          break;
      }

      return result.message;
    } catch (error) {
      if (
        AUTH_ERROR_MESSAGES.some(
          errorMessage => error.message.indexOf(errorMessage) > -1
        )
      ) {
        // If the error is an authentication error, ask the user credentials
        const credentials = await showDialog({
          title: trans.__('Git credentials required'),
          body: new GitCredentialsForm(
            trans,
            trans.__('Enter credentials for remote repository'),
            retry ? trans.__('Incorrect username or password.') : ''
          )
        });

        if (credentials.button.accept) {
          // Retry the operation if the user provides its credentials
          return await showGitOperationDialog<T>(
            model,
            operation,
            trans,
            args,
            credentials.value,
            true
          );
        }
      }
      // Throw the error if it cannot be handled or
      // if the user did not accept to provide its credentials
      throw error;
    }
  }
}
/* eslint-enable no-inner-declarations */
