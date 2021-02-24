import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  Dialog,
  InputDialog,
  MainAreaWidget,
  ReactWidget,
  showDialog,
  showErrorMessage,
  WidgetTracker
} from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { FileBrowser } from '@jupyterlab/filebrowser';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITerminal } from '@jupyterlab/terminal';
import { CommandRegistry } from '@lumino/commands';
import { Menu } from '@lumino/widgets';
import { ArrayExt, toArray } from '@lumino/algorithm';
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
import {
  addIcon,
  diffIcon,
  discardIcon,
  gitIcon,
  openIcon,
  removeIcon
} from './style/icons';
import {
  CommandIDs,
  ContextCommandIDs,
  Git,
  IGitExtension,
  Level
} from './tokens';
import { GitCredentialsForm } from './widgets/CredentialsBox';
import { GitCloneForm } from './widgets/GitCloneForm';
import { Contents } from '@jupyterlab/services';
import { closeIcon, ContextMenuSvg } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import { CONTEXT_COMMANDS } from './components/FileList';

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

interface IFileDiffArgument {
  context?: IDiffContext;
  filePath: string;
  isText: boolean;
  status?: Git.Status;
}

export namespace CommandArguments {
  export interface IGitFileDiff {
    files: IFileDiffArgument[];
  }
  export interface IGitContextAction {
    files: Git.IStatusFile[];
  }
}

function pluralizedContextLabel(singular: string, plural: string) {
  return (args: any) => {
    const { files } = (args as any) as CommandArguments.IGitContextAction;
    if (files.length > 1) {
      return plural;
    } else {
      return singular;
    }
  };
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
  renderMime: IRenderMimeRegistry
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
        logger.log({
          message: 'Initializing...',
          level: Level.RUNNING
        });
        try {
          await model.init(currentPath);
          model.pathRepository = currentPath;
          logger.log({
            message: 'Git repository initialized.',
            level: Level.SUCCESS
          });
        } catch (error) {
          console.error(
            'Encountered an error when initializing the repository. Error: ',
            error
          );
          logger.log({
            message: 'Failed to initialize the Git repository',
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
      const result = await showDialog({
        title: 'Clone a repo',
        body: new GitCloneForm(),
        focusNodeSelector: 'input',
        buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'CLONE' })]
      });

      if (result.button.accept && result.value) {
        logger.log({
          level: Level.RUNNING,
          message: 'Cloning...'
        });
        try {
          const details = await Private.showGitOperationDialog<IGitCloneArgs>(
            model,
            Operation.Clone,
            { path: fileBrowser.model.path, url: result.value }
          );
          logger.log({
            message: 'Successfully cloned',
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
            message: 'Failed to clone',
            level: Level.ERROR,
            error
          });
        }
      }
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
      logger.log({
        level: Level.RUNNING,
        message: 'Pushing...'
      });
      try {
        const details = await Private.showGitOperationDialog(
          model,
          Operation.Push
        );
        logger.log({
          message: 'Successfully pushed',
          level: Level.SUCCESS,
          details
        });
      } catch (error) {
        console.error(
          'Encountered an error when pushing changes. Error: ',
          error
        );
        logger.log({
          message: 'Failed to push',
          level: Level.ERROR,
          error
        });
      }
    }
  });

  /** Add git pull command */
  commands.addCommand(CommandIDs.gitPull, {
    label: 'Pull from Remote',
    caption: 'Pull latest code from remote repository',
    isEnabled: () => model.pathRepository !== null,
    execute: async () => {
      logger.log({
        level: Level.RUNNING,
        message: 'Pulling...'
      });
      try {
        const details = await Private.showGitOperationDialog(
          model,
          Operation.Pull
        );
        logger.log({
          message: 'Successfully pulled',
          level: Level.SUCCESS,
          details
        });
      } catch (error) {
        console.error(
          'Encountered an error when pulling changes. Error: ',
          error
        );
        logger.log({
          message: 'Failed to pull',
          level: Level.ERROR,
          error
        });
      }
    }
  });

  /* Context menu commands */
  commands.addCommand(ContextCommandIDs.gitFileOpen, {
    label: 'Open',
    caption: pluralizedContextLabel(
      'Open selected file',
      'Open selected files'
    ),
    execute: async args => {
      const { files } = (args as any) as CommandArguments.IGitContextAction;
      for (const file of files) {
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
    },
    icon: openIcon
  });

  commands.addCommand(ContextCommandIDs.gitFileDiff, {
    label: 'Diff',
    caption: pluralizedContextLabel(
      'Diff selected file',
      'Diff selected files'
    ),
    execute: args => {
      const { files } = (args as any) as CommandArguments.IGitFileDiff;
      for (const file of files) {
        const { context, filePath, isText, status } = file;

        let diffContext = context;
        if (!diffContext) {
          const specialRef = status === 'staged' ? 'INDEX' : 'WORKING';
          diffContext = {
            currentRef: { specialRef },
            previousRef: { gitRef: 'HEAD' }
          };
        }

        if (isDiffSupported(filePath) || isText) {
          const id = `nbdiff-${filePath}-${getRefValue(
            diffContext.currentRef
          )}`;
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
            'Diff Not Supported',
            `Diff is not supported for ${PathExt.extname(
              filePath
            ).toLocaleLowerCase()} files.`
          );
        }
      }
    },
    icon: diffIcon
  });

  commands.addCommand(ContextCommandIDs.gitFileAdd, {
    label: 'Add',
    caption: pluralizedContextLabel(
      'Stage or track the changes to selected file',
      'Stage or track the changes of selected files'
    ),
    execute: async args => {
      const { files } = (args as any) as CommandArguments.IGitContextAction;
      for (const file of files) {
        await model.add(file.to);
      }
    },
    icon: addIcon
  });

  commands.addCommand(ContextCommandIDs.gitFileStage, {
    label: 'Stage',
    caption: pluralizedContextLabel(
      'Stage the changes of selected file',
      'Stage the changes of selected files'
    ),
    execute: async args => {
      const { files } = (args as any) as CommandArguments.IGitContextAction;
      for (const file of files) {
        await model.add(file.to);
      }
    },
    icon: addIcon
  });

  commands.addCommand(ContextCommandIDs.gitFileTrack, {
    label: 'Track',
    caption: pluralizedContextLabel(
      'Start tracking selected file',
      'Start tracking selected files'
    ),
    execute: async args => {
      const { files } = (args as any) as CommandArguments.IGitContextAction;
      for (const file of files) {
        await model.add(file.to);
      }
    },
    icon: addIcon
  });

  commands.addCommand(ContextCommandIDs.gitFileUnstage, {
    label: 'Unstage',
    caption: pluralizedContextLabel(
      'Unstage the changes of selected file',
      'Unstage the changes of selected files'
    ),
    execute: async args => {
      const { files } = (args as any) as CommandArguments.IGitContextAction;
      for (const file of files) {
        if (file.x !== 'D') {
          await model.reset(file.to);
        }
      }
    },
    icon: removeIcon
  });

  function representFiles(files: Git.IStatusFile[]): JSX.Element {
    if (files.length > 1) {
      const elements = files.map(file => (
        <li key={file.to}>
          <b>{file.to}</b>
        </li>
      ));
      return <ul>{elements}</ul>;
    } else {
      return <b>{files[0].to}</b>;
    }
  }

  commands.addCommand(ContextCommandIDs.gitFileDelete, {
    label: 'Delete',
    caption: pluralizedContextLabel('Delete this file', 'Delete these files'),
    execute: async args => {
      const { files } = (args as any) as CommandArguments.IGitContextAction;
      const fileList = representFiles(files);

      const result = await showDialog({
        title: 'Delete Files',
        body: (
          <span>
            Are you sure you want to permanently delete
            {fileList}? This action cannot be undone.
          </span>
        ),
        buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Delete' })]
      });
      if (result.button.accept) {
        for (const file of files) {
          try {
            await app.commands.execute('docmanager:delete-file', {
              path: model.getRelativeFilePath(file.to)
            });
          } catch (reason) {
            showErrorMessage(`Deleting ${file.to} failed.`, reason, [
              Dialog.warnButton({ label: 'DISMISS' })
            ]);
          }
        }
      }
    },
    icon: closeIcon
  });

  commands.addCommand(ContextCommandIDs.gitFileDiscard, {
    label: 'Discard',
    caption: pluralizedContextLabel(
      'Discard recent changes of selected file',
      'Discard recent changes of selected files'
    ),
    execute: async args => {
      const { files } = (args as any) as CommandArguments.IGitContextAction;
      const fileList = representFiles(files);

      const result = await showDialog({
        title: 'Discard changes',
        body: (
          <span>
            Are you sure you want to permanently discard changes to {fileList}?
            This action cannot be undone.
          </span>
        ),
        buttons: [
          Dialog.cancelButton(),
          Dialog.warnButton({ label: 'Discard' })
        ]
      });
      if (result.button.accept) {
        for (const file of files) {
          try {
            if (
              file.status === 'staged' ||
              file.status === 'partially-staged'
            ) {
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
    },
    icon: discardIcon
  });

  commands.addCommand(ContextCommandIDs.gitIgnore, {
    label: pluralizedContextLabel(
      'Ignore this file (add to .gitignore)',
      'Ignore these files (add to .gitignore)'
    ),
    caption: pluralizedContextLabel(
      'Ignore this file (add to .gitignore)',
      'Ignore these files (add to .gitignore)'
    ),
    execute: async args => {
      const { files } = (args as any) as CommandArguments.IGitContextAction;
      for (const file of files) {
        if (file) {
          await model.ignore(file.to, false);
        }
      }
    }
  });

  commands.addCommand(ContextCommandIDs.gitIgnoreExtension, {
    label: args => {
      const { files } = (args as any) as CommandArguments.IGitContextAction;
      const extensions = files
        .map(file => PathExt.extname(file.to))
        .filter(extension => extension.length > 0);
      const subject = extensions.length > 1 ? 'extensions' : 'extension';
      return `Ignore ${extensions.join(', ')} ${subject} (add to .gitignore)`;
    },
    caption: pluralizedContextLabel(
      'Ignore this file extension (add to .gitignore)',
      'Ignore these files extension (add to .gitignore)'
    ),
    execute: async args => {
      const { files } = (args as any) as CommandArguments.IGitContextAction;
      for (const selectedFile of files) {
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
      }
    },
    isVisible: args => {
      const { files } = (args as any) as CommandArguments.IGitContextAction;
      return files.some(selectedFile => {
        const extension = PathExt.extname(selectedFile.to);
        return extension.length > 0;
      });
    }
  });

  commands.addCommand(ContextCommandIDs.gitNoAction, {
    label: 'No actions available',
    isEnabled: () => false,
    execute: () => void 0
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

// matches only non-directory items
const selectorNotDir = '.jp-DirListing-item[data-isdir="false"]';

export function addMenuItems(
  commands: ContextCommandIDs[],
  contextMenu: Menu,
  selectedFiles: Git.IStatusFile[]
): void {
  commands.forEach(command => {
    if (command === ContextCommandIDs.gitFileDiff) {
      contextMenu.addItem({
        command,
        args: ({
          files: selectedFiles.map(file => {
            return {
              filePath: file.to,
              isText: !file.is_binary,
              status: file.status
            };
          })
        } as CommandArguments.IGitFileDiff) as any
      });
    } else {
      contextMenu.addItem({
        command,
        args: ({
          files: selectedFiles
        } as CommandArguments.IGitContextAction) as any
      });
    }
  });
}

/**
 *
 */
export function addFileBrowserContextMenu(
  model: IGitExtension,
  tracker: WidgetTracker<FileBrowser>,
  commands: CommandRegistry,
  contextMenu: ContextMenuSvg
): void {
  function getSelectedBrowserItems(): Contents.IModel[] {
    const widget = tracker.currentWidget;
    if (!widget) {
      return [];
    }
    return toArray(widget.selectedItems());
  }

  class GitMenu extends Menu {
    private _commands: ContextCommandIDs[];
    private _paths: string[];

    protected onBeforeAttach(msg: Message) {
      // Render using the most recent model (even if possibly outdated)
      this.updateItems();
      const renderedStatus = model.status;

      // Trigger refresh before the menu is displayed
      model
        .refreshStatus()
        .then(() => {
          if (model.status !== renderedStatus) {
            // update items if needed
            this.updateItems();
          }
        })
        .catch(error => {
          console.error(
            'Fail to refresh model when displaying git context menu.',
            error
          );
        });
      super.onBeforeAttach(msg);
    }

    protected updateItems(): void {
      const wasShown = this.isVisible;
      const parent = this.parentMenu;

      const items = getSelectedBrowserItems();
      const statuses = new Set<Git.Status>(
        items
          .map(item => model.getFile(item.path)?.status)
          .filter(status => typeof status !== 'undefined')
      );

      // get commands and de-duplicate them
      const allCommands = new Set<ContextCommandIDs>(
        // flatten the list of lists of commands
        []
          .concat(...[...statuses].map(status => CONTEXT_COMMANDS[status]))
          // filter out the Open and Delete commands as
          // those are not needed in file browser
          .filter(
            command =>
              command !== ContextCommandIDs.gitFileOpen &&
              command !== ContextCommandIDs.gitFileDelete &&
              typeof command !== 'undefined'
          )
          // replace stage and track with a single "add" operation
          .map(command =>
            command === ContextCommandIDs.gitFileStage ||
            command === ContextCommandIDs.gitFileTrack
              ? ContextCommandIDs.gitFileAdd
              : command
          )
      );

      // if looking at a tracked file with no changes,
      // it has no status, nor any actions available
      // (although `git rm` would be a valid action)
      if (allCommands.size === 0 && statuses.size === 0) {
        allCommands.add(ContextCommandIDs.gitNoAction);
      }

      const commandsChanged =
        !this._commands ||
        this._commands.length !== allCommands.size ||
        !this._commands.every(command => allCommands.has(command));

      const paths = items.map(item => item.path);

      const filesChanged =
        !this._paths || !ArrayExt.shallowEqual(this._paths, paths);

      if (commandsChanged || filesChanged) {
        const commandsList = [...allCommands];
        this.clearItems();
        addMenuItems(
          commandsList,
          this,
          paths.map(path => model.getFile(path))
        );
        if (wasShown) {
          // show he menu again after downtime for refresh
          parent.triggerActiveItem();
        }
        this._commands = commandsList;
        this._paths = paths;
      }
    }

    onBeforeShow(msg: Message): void {
      super.onBeforeShow(msg);
    }
  }

  const gitMenu = new GitMenu({ commands });
  gitMenu.title.label = 'Git';
  gitMenu.title.icon = gitIcon.bindprops({ stylesheet: 'menuItem' });

  contextMenu.addItem({
    type: 'submenu',
    submenu: gitMenu,
    selector: selectorNotDir,
    rank: 5
  });
}

/* eslint-disable no-inner-declarations */
namespace Private {
  /**
   * Handle Git operation that may require authentication.
   *
   * @private
   * @param model - Git extension model
   * @param operation - Git operation name
   * @param args - Git operation arguments
   * @param authentication - Git authentication information
   * @param retry - Is this operation retried?
   * @returns Promise for displaying a dialog
   */
  export async function showGitOperationDialog<T>(
    model: GitExtension,
    operation: Operation,
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
          title: 'Git credentials required',
          body: new GitCredentialsForm(
            'Enter credentials for remote repository',
            retry ? 'Incorrect username or password.' : ''
          )
        });

        if (credentials.button.accept) {
          // Retry the operation if the user provides its credentials
          return await showGitOperationDialog<T>(
            model,
            operation,
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
