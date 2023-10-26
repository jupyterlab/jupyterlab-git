import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  Dialog,
  InputDialog,
  MainAreaWidget,
  Notification,
  ReactWidget,
  showDialog,
  showErrorMessage
} from '@jupyterlab/apputils';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { PathExt, URLExt } from '@jupyterlab/coreutils';
import { FileBrowser, FileBrowserModel } from '@jupyterlab/filebrowser';
import { Contents } from '@jupyterlab/services';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITerminal } from '@jupyterlab/terminal';
import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import {
  closeIcon,
  ContextMenuSvg,
  Toolbar,
  ToolbarButton
} from '@jupyterlab/ui-components';
import { ArrayExt } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import { PromiseDelegate } from '@lumino/coreutils';
import { Message } from '@lumino/messaging';
import { ContextMenu, DockPanel, Menu, Panel, Widget } from '@lumino/widgets';
import * as React from 'react';
import { CancelledError } from './cancelledError';
import { BranchPicker } from './components/BranchPicker';
import { NewTagDialogBox } from './components/NewTagDialog';
import { DiffModel } from './components/diff/model';
import { createPlainTextDiff } from './components/diff/PlainTextDiff';
import { PreviewMainAreaWidget } from './components/diff/PreviewMainAreaWidget';
import { CONTEXT_COMMANDS } from './components/FileList';
import { ManageRemoteDialogue } from './components/ManageRemoteDialogue';
import { AUTH_ERROR_MESSAGES, requestAPI } from './git';
import { getDiffProvider, GitExtension } from './model';
import {
  addIcon,
  diffIcon,
  discardIcon,
  gitIcon,
  historyIcon,
  openIcon,
  removeIcon,
  tagIcon
} from './style/icons';
import { CommandIDs, ContextCommandIDs, Git, IGitExtension } from './tokens';
import { AdvancedPushForm } from './widgets/AdvancedPushForm';
import { GitCredentialsForm } from './widgets/CredentialsBox';
import { discardAllChanges } from './widgets/discardAllChanges';
import { CheckboxForm } from './widgets/GitResetToRemoteForm';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';
import { showDetails, showError } from './notifications';

export interface IGitCloneArgs {
  /**
   * Path in which to clone the Git repository
   */
  path: string;
  /**
   * Git repository url
   */
  url: string;
  /**
   * Whether to activate git versioning in the clone or not.
   * If false, this will remove the .git folder after cloning.
   */
  versioning?: boolean;
  /**
   * Whether to activate git recurse submodules clone or not.
   */
  submodules?: boolean;
}

/**
 * Git operations requiring authentication
 */
export enum Operation {
  Clone = 'Clone',
  Pull = 'Pull',
  Push = 'Push',
  ForcePush = 'ForcePush',
  Fetch = 'Fetch'
}

interface IFileDiffArgument {
  context?: Git.Diff.IContext;
  filePath: string;
  isText: boolean;
  status?: Git.Status;
  isPreview?: boolean;

  // when file has been relocated
  previousFilePath?: string;
}

export namespace CommandArguments {
  export interface IGitFileDiff {
    files: IFileDiffArgument[];
  }
  export interface IGitContextAction {
    files: Git.IStatusFile[];
  }
  export interface IGitCommitInfo {
    commit: Git.ISingleCommitInfo;
  }
}

function pluralizedContextLabel(singular: string, plural: string) {
  return (args: any) => {
    const { files } = args as any as CommandArguments.IGitContextAction;
    if (files.length > 1) {
      return plural;
    } else {
      return singular;
    }
  };
}

/**
 * Add the commands for the git extension.
 */
export function addCommands(
  app: JupyterFrontEnd,
  gitModel: GitExtension,
  editorFactory: CodeEditor.Factory,
  languageRegistry: IEditorLanguageRegistry,
  fileBrowserModel: FileBrowserModel,
  settings: ISettingRegistry.ISettings,
  translator: ITranslator
): void {
  const { commands, shell, serviceManager } = app;
  const trans = translator.load('jupyterlab_git');

  /**
   * Commit using a keystroke combination when in CommitBox.
   *
   * This command is not accessible from the user interface (not visible),
   * as it is handled by a signal listener in the CommitBox component instead.
   * The label and caption are given to ensure that the command will
   * show up in the shortcut editor UI with a nice description.
   */
  commands.addCommand(CommandIDs.gitSubmitCommand, {
    label: trans.__('Commit from the Commit Box'),
    caption: trans.__(
      'Submit the commit using the summary and description from commit box'
    ),
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
        if (gitModel.pathRepository !== null) {
          const terminal = main.content;
          terminal.session.send({
            type: 'stdin',
            content: [
              `cd "${gitModel.pathRepository
                .split('"')
                .join('\\"')
                .split('`')
                .join('\\`')}"\n`
            ]
          });
        }

        return main;
      } catch (e) {
        console.error(e);
        main.dispose();
      }
    },
    isEnabled: () =>
      gitModel.pathRepository !== null &&
      app.serviceManager.terminals.isAvailable()
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
      const currentPath = app.serviceManager.contents.localPath(
        fileBrowserModel.path
      );
      const result = await showDialog({
        title: trans.__('Initialize a Repository'),
        body: trans.__('Do you really want to make this directory a Git Repo?'),
        buttons: [
          Dialog.cancelButton({ label: trans.__('Cancel') }),
          Dialog.warnButton({ label: trans.__('Yes') })
        ]
      });

      if (result.button.accept) {
        const id = Notification.emit(trans.__('Initializing…'), 'in-progress', {
          autoClose: false
        });
        try {
          await gitModel.init(currentPath);
          gitModel.pathRepository = currentPath;
          Notification.update({
            id,
            message: trans.__('Git repository initialized.'),
            type: 'success',
            autoClose: 5000
          });
        } catch (error) {
          console.error(
            trans.__(
              'Encountered an error when initializing the repository. Error: '
            ),
            error
          );
          Notification.update({
            id,
            message: trans.__('Failed to initialize the Git repository'),
            type: 'error',
            ...showError(error as Error, trans)
          });
        }
      }
    },
    isEnabled: () => gitModel.pathRepository === null
  });

  /** Open URL externally */
  commands.addCommand(CommandIDs.gitOpenUrl, {
    label: args => trans.__(args['text'] as string),
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
  commands.addCommand(CommandIDs.gitManageRemote, {
    label: trans.__('Manage Remote Repositories'),
    caption: trans.__('Manage Remote Repositories'),
    isEnabled: () => gitModel.pathRepository !== null,
    execute: () => {
      if (gitModel.pathRepository === null) {
        console.warn(
          trans.__('Not in a Git repository. Unable to add a remote.')
        );
        return;
      }

      const widgetId = 'git-dialog-ManageRemote';
      let anchor = document.querySelector<HTMLDivElement>(`#${widgetId}`);
      if (!anchor) {
        anchor = document.createElement('div');
        anchor.id = widgetId;
        document.body.appendChild(anchor);
      }

      const dialog = ReactWidget.create(
        <ManageRemoteDialogue
          trans={trans}
          model={gitModel}
          onClose={() => dialog.dispose()}
        />
      );

      Widget.attach(dialog, anchor);
    }
  });

  /** Add git open gitignore command */
  commands.addCommand(CommandIDs.gitOpenGitignore, {
    label: trans.__('Open .gitignore'),
    caption: trans.__('Open .gitignore'),
    isEnabled: () => gitModel.pathRepository !== null,
    execute: async () => {
      await gitModel.ensureGitignore();
    }
  });

  /** Add git push command */
  commands.addCommand(CommandIDs.gitPush, {
    label: args =>
      (args['advanced'] as boolean)
        ? trans.__('Push to Remote (Advanced)')
        : trans.__('Push to Remote'),
    caption: trans.__('Push code to remote repository'),
    isEnabled: () => gitModel.pathRepository !== null,
    execute: async args => {
      let id: string | null = null;
      try {
        let remote;
        let force;

        if (args['advanced'] as boolean) {
          const result = await showDialog({
            title: trans.__('Please select push options.'),
            body: new AdvancedPushForm(trans, gitModel),
            buttons: [
              Dialog.cancelButton({ label: trans.__('Cancel') }),
              Dialog.okButton({ label: trans.__('Proceed') })
            ]
          });
          if (result.button.accept && result.value) {
            remote = result.value.remoteName;
            force = result.value.force;
          } else {
            return;
          }
        }

        id = Notification.emit(trans.__('Pushing…'), 'in-progress', {
          autoClose: false
        });
        const details = await showGitOperationDialog(
          gitModel,
          force ? Operation.ForcePush : Operation.Push,
          trans,
          (args = { remote })
        );

        Notification.update({
          id,
          message: trans.__('Successfully pushed'),
          type: 'success',
          ...showDetails(details, trans)
        });
      } catch (error: any) {
        if (error.name !== 'CancelledError') {
          console.error(
            trans.__('Encountered an error when pushing changes. Error: '),
            error
          );

          const message = trans.__('Failed to push');
          const options = showError(error as Error, trans);
          if (id) {
            Notification.update({
              id,
              message,
              type: 'error',
              ...options
            });
          } else {
            Notification.error(message, options);
          }
        } else {
          if (id) {
            Notification.dismiss(id);
          }
        }
      }
    }
  });

  /** Add git pull command */
  commands.addCommand(CommandIDs.gitPull, {
    label: args =>
      args.force
        ? trans.__('Pull from Remote (Force)')
        : trans.__('Pull from Remote'),
    caption: args =>
      args.force
        ? trans.__(
            'Discard all current changes and pull from remote repository'
          )
        : trans.__('Pull latest code from remote repository'),
    isEnabled: () => gitModel.pathRepository !== null,
    execute: async args => {
      let id: string | null = null;
      try {
        if (args.force) {
          await discardAllChanges(gitModel, trans, args.fallback as boolean);
        }
        id = Notification.emit(trans.__('Pulling…'), 'in-progress', {
          autoClose: false
        });
        const details = await showGitOperationDialog(
          gitModel,
          Operation.Pull,
          trans
        );
        Notification.update({
          id,
          message: trans.__('Successfully pulled'),
          type: 'success',
          ...showDetails(details, trans)
        });
      } catch (error: any) {
        if (error.name !== 'CancelledError') {
          console.error(
            'Encountered an error when pulling changes. Error: ',
            error
          );

          const errorMsg =
            typeof error === 'string' ? error : (error as Error).message;

          // Discard changes then retry pull
          if (
            errorMsg
              .toLowerCase()
              .includes(
                'your local changes to the following files would be overwritten by merge'
              )
          ) {
            await commands.execute(CommandIDs.gitPull, {
              force: true,
              fallback: true
            });
          } else {
            if ((error as any).cancelled) {
              if (id) {
                Notification.dismiss(id);
              }
            } else {
              const message = trans.__('Failed to pull');
              const options = showError(error, trans);
              if (id) {
                Notification.update({
                  id,
                  message,
                  ...options
                });
              } else {
                Notification.error(message, options);
              }
            }
          }
        } else {
          if (id) {
            Notification.dismiss(id);
          }
        }
      }
    }
  });

  /** Add git reset --hard <remote-tracking-branch> command */
  commands.addCommand(CommandIDs.gitResetToRemote, {
    label: trans.__('Reset to Remote'),
    caption: trans.__('Reset Current Branch to Remote State'),
    isEnabled: () => gitModel.pathRepository !== null,
    execute: async () => {
      const result = await showDialog({
        title: trans.__('Reset to Remote'),
        body: new CheckboxForm(
          trans.__(
            'To bring the current branch to the state of its corresponding remote tracking branch, \
            a hard reset will be performed, which may result in some files being permanently deleted \
            and some changes being permanently discarded. Are you sure you want to proceed? \
            This action cannot be undone.'
          ),
          trans.__('Close all opened files to avoid conflicts')
        ),
        buttons: [
          Dialog.cancelButton({ label: trans.__('Cancel') }),
          Dialog.warnButton({ label: trans.__('Proceed') })
        ]
      });
      if (result.button.accept) {
        let id: string | null = null;
        try {
          if (result.value?.checked) {
            id = Notification.emit(
              trans.__('Closing all opened files...'),
              'in-progress'
            );
            await fileBrowserModel.manager.closeAll();
          }
          const message = trans.__('Resetting...');
          if (id) {
            Notification.update({ id, message });
          } else {
            id = Notification.emit(message, 'in-progress', {
              autoClose: false
            });
          }

          await gitModel.resetToCommit(gitModel.status.remote ?? undefined);
          Notification.update({
            id,
            message: trans.__('Successfully reset'),
            type: 'success',
            ...showDetails(
              trans.__(
                'Successfully reset the current branch to its remote state'
              ),
              trans
            )
          });
        } catch (error) {
          console.error(
            'Encountered an error when resetting the current branch to its remote state. Error: ',
            error
          );
          const message = trans.__('Reset failed');
          const options = showError(error as Error, trans);
          if (id) {
            Notification.update({
              id,
              type: 'error',
              message,
              ...options
            });
          } else {
            Notification.error(message, options);
          }
        }
      }
    }
  });

  /**
   * Git display diff command - internal command
   *
   * @params model: The diff model to display
   * @params isText: Optional, whether the content is a plain text
   * @params isMerge: Optional, whether the diff is a merge conflict
   * @returns the main area widget or null
   */
  commands.addCommand(CommandIDs.gitShowDiff, {
    label: trans.__('Show Diff'),
    caption: trans.__('Display a file diff.'),
    execute: async args => {
      const { model, isText, isPreview } = args as any as {
        model: Git.Diff.IModel;
        isText?: boolean;
        isPreview?: boolean;
      };

      const fullPath = PathExt.join(
        model.repositoryPath ?? '/',
        model.filename
      );

      const buildDiffWidget =
        getDiffProvider(fullPath) ??
        (isText &&
          (options =>
            createPlainTextDiff({
              ...options,
              editorFactory,
              languageRegistry
            })));

      if (buildDiffWidget) {
        const id = `git-diff-${fullPath}-${model.reference.label}-${model.challenger.label}`;
        const mainAreaItems = shell.widgets('main');
        let mainAreaItem: Widget | null = null;
        for (const item of mainAreaItems) {
          if (item.id === id) {
            shell.activateById(id);
            mainAreaItem = item;
            break;
          }
        }

        if (!mainAreaItem) {
          const content = new Panel();
          const modelIsLoading = new PromiseDelegate<void>();
          const diffWidget = (mainAreaItem = new PreviewMainAreaWidget<Panel>({
            content,
            reveal: modelIsLoading.promise,
            isPreview
          }));
          diffWidget.id = id;
          diffWidget.title.label = PathExt.basename(model.filename);
          diffWidget.title.caption = fullPath;
          diffWidget.title.icon = diffIcon;
          diffWidget.title.closable = true;
          diffWidget.title.className = 'jp-git-diff-title';
          diffWidget.addClass('jp-git-diff-parent-widget');

          shell.add(diffWidget, 'main');
          shell.activateById(diffWidget.id);

          // Search for the tab
          const dockPanel = (app.shell as any)._dockPanel as DockPanel;

          // Get the index of the most recent tab opened
          let tabPosition = -1;
          const tabBar = Array.from(dockPanel.tabBars()).find(bar => {
            tabPosition = bar.titles.indexOf(diffWidget.title);
            return tabPosition !== -1;
          });

          // Pin the preview screen if applicable
          if (tabBar) {
            PreviewMainAreaWidget.pinWidget(tabPosition, tabBar, diffWidget);
          }

          // Create the diff widget
          try {
            const widget = await buildDiffWidget({
              model,
              toolbar: diffWidget.toolbar,
              translator
            });

            diffWidget.toolbar.addItem('spacer', Toolbar.createSpacerItem());

            // Do not allow the user to refresh during merge conflicts
            if (model.hasConflict) {
              const resolveButton = new ToolbarButton({
                label: trans.__('Mark as resolved'),
                onClick: async () => {
                  if (!widget.isFileResolved) {
                    const result = await showDialog({
                      title: trans.__('Resolve with conflicts'),
                      body: trans.__(
                        'Are you sure you want to mark this file as resolved with merge conflicts?'
                      )
                    });

                    // Bail early if the user wants to finish resolving conflicts
                    if (!result.button.accept) {
                      return;
                    }
                  }

                  try {
                    await serviceManager.contents.save(
                      fullPath,
                      await widget.getResolvedFile()
                    );
                    await gitModel.add(model.filename);
                    await gitModel.refresh();
                  } catch (reason) {
                    Notification.error(
                      (reason as Error).message ?? (reason as string)
                    );
                  } finally {
                    diffWidget.dispose();
                  }
                },
                tooltip: trans.__('Mark file as resolved'),
                className: 'jp-git-diff-resolve'
              });

              diffWidget.toolbar.addItem('resolve', resolveButton);
            } else {
              const refreshButton = new ToolbarButton({
                label: trans.__('Refresh'),
                onClick: async () => {
                  await widget.refresh();
                  refreshButton.hide();
                },
                tooltip: trans.__('Refresh diff widget'),
                className: 'jp-git-diff-refresh'
              });

              refreshButton.hide();
              diffWidget.toolbar.addItem('refresh', refreshButton);

              const refresh = () => {
                refreshButton.show();
              };

              model.changed.connect(refresh);
              widget.disposed.connect(() => model.changed.disconnect(refresh));
            }

            // Load the diff widget
            modelIsLoading.resolve();
            content.addWidget(widget);
          } catch (reason) {
            console.error(reason);
            const msg = `Load Diff Model Error (${
              (reason as Error).message || reason
            })`;
            modelIsLoading.reject(msg);
          }

          if (
            model.challenger.source === Git.Diff.SpecialRef.INDEX ||
            model.challenger.source === Git.Diff.SpecialRef.WORKING ||
            model.reference.source === Git.Diff.SpecialRef.INDEX ||
            model.reference.source === Git.Diff.SpecialRef.WORKING
          ) {
            const maybeClose = (_: IGitExtension, status: Git.IStatus) => {
              const targetFile = status.files.find(
                fileStatus => model.filename === fileStatus.from
              );
              if (!targetFile || targetFile.status === 'unmodified') {
                gitModel.statusChanged.disconnect(maybeClose);
                mainAreaItem!.dispose();
              }
            };
            gitModel.statusChanged.connect(maybeClose);
          }
        }

        return mainAreaItem;
      } else {
        await showErrorMessage(
          trans.__('Diff Not Supported'),
          trans.__(
            'Diff is not supported for %1 files.',
            PathExt.extname(model.filename).toLocaleLowerCase()
          )
        );

        return null;
      }
    },
    icon: diffIcon.bindprops({ stylesheet: 'menuItem' })
  });

  commands.addCommand(CommandIDs.gitMerge, {
    label: trans.__('Merge Branch…'),
    caption: trans.__('Merge selected branch in the current branch'),
    execute: async args => {
      let { branch }: { branch?: string } = args ?? {};

      if (!branch) {
        // Prompts user to pick a branch
        const localBranches = gitModel.branches.filter(
          branch => !branch.is_current_branch && !branch.is_remote_branch
        );

        const widgetId = 'git-dialog-MergeBranch';
        let anchor = document.querySelector<HTMLDivElement>(`#${widgetId}`);
        if (!anchor) {
          anchor = document.createElement('div');
          anchor.id = widgetId;
          document.body.appendChild(anchor);
        }

        const waitForDialog = new PromiseDelegate<string | null>();
        const dialog = ReactWidget.create(
          <BranchPicker
            action="merge"
            currentBranch={gitModel.currentBranch?.name ?? ''}
            branches={localBranches}
            onClose={(branch?: string) => {
              dialog.dispose();
              waitForDialog.resolve(branch ?? null);
            }}
            trans={trans}
          />
        );

        Widget.attach(dialog, anchor);

        branch = (await waitForDialog.promise) ?? undefined;
      }

      if (branch) {
        const id = Notification.emit(
          trans.__("Merging branch '%1'…", branch),
          'in-progress'
        );
        try {
          await gitModel.merge(branch);
        } catch (err) {
          Notification.update({
            id,
            type: 'error',
            message: trans.__(
              "Failed to merge branch '%1' into '%2'.",
              branch,
              gitModel.currentBranch?.name
            ),
            ...showError(err as Error, trans)
          });
          return;
        }

        Notification.update({
          id,
          type: 'success',
          message: trans.__(
            "Branch '%1' merged into '%2'.",
            branch,
            gitModel.currentBranch?.name
          )
        });
      }
    },
    isEnabled: () =>
      gitModel.branches.some(
        branch => !branch.is_current_branch && !branch.is_remote_branch
      )
  });

  commands.addCommand(CommandIDs.gitRebase, {
    label: trans.__('Rebase branch…'),
    caption: trans.__('Rebase current branch onto the selected branch'),
    execute: async args => {
      let { branch }: { branch?: string } = args ?? {};

      if (!branch) {
        // Prompts user to pick a branch
        const localBranches = gitModel.branches.filter(
          branch => !branch.is_current_branch && !branch.is_remote_branch
        );

        const widgetId = 'git-dialog-MergeBranch';
        let anchor = document.querySelector<HTMLDivElement>(`#${widgetId}`);
        if (!anchor) {
          anchor = document.createElement('div');
          anchor.id = widgetId;
          document.body.appendChild(anchor);
        }

        const waitForDialog = new PromiseDelegate<string | null>();
        const dialog = ReactWidget.create(
          <BranchPicker
            action="rebase"
            currentBranch={gitModel.currentBranch?.name ?? ''}
            branches={localBranches}
            onClose={(branch?: string) => {
              dialog.dispose();
              waitForDialog.resolve(branch ?? null);
            }}
            trans={trans}
          />
        );

        Widget.attach(dialog, anchor);

        branch = (await waitForDialog.promise) ?? undefined;
      }

      if (branch) {
        const id = Notification.emit(
          trans.__("Rebasing current branch onto '%1'…", branch),
          'in-progress'
        );
        try {
          await gitModel.rebase(branch);
        } catch (err) {
          Notification.update({
            id,
            type: 'error',
            message: trans.__(
              "Failed to rebase branch '%1' onto '%2'.",
              gitModel.currentBranch?.name,
              branch
            ),
            ...showError(err as Error, trans)
          });
          return;
        }

        Notification.update({
          id,
          type: 'success',
          message: trans.__(
            "Branch '%1' rebase onto '%2'.",
            gitModel.currentBranch?.name,
            branch
          )
        });
      }
    },
    isEnabled: () =>
      gitModel.branches.some(
        branch => !branch.is_current_branch && !branch.is_remote_branch
      )
  });

  commands.addCommand(CommandIDs.gitResolveRebase, {
    label: (args = {}) => {
      switch (args.action) {
        case 'continue':
          return trans.__('Continue rebase');
        case 'skip':
          return trans.__('Skip current commit');
        case 'abort':
          return trans.__('Abort rebase');
        default:
          return trans.__('Resolve rebase');
      }
    },
    caption: (args = {}) => {
      switch (args.action) {
        case 'continue':
          return trans.__(
            'Continue the rebase by committing the current state.'
          );
        case 'skip':
          return trans.__('Skip current commit and continue the rebase.');
        case 'abort':
          return trans.__('Abort the rebase');
        default:
          return trans.__('Resolve rebase');
      }
    },
    execute: async (args: { action?: string } = {}) => {
      const { action } = args;

      if (['continue', 'abort', 'skip'].includes(action ?? '')) {
        const message =
          (action => {
            switch (action) {
              case 'continue':
                return trans.__('Continue the rebase…');
              case 'skip':
                return trans.__('Skip current commit…');
              case 'abort':
                return trans.__('Abort the rebase…');
            }
          })(action) ?? '';

        const id = Notification.emit(message, 'in-progress', {
          autoClose: false
        });
        try {
          await gitModel.resolveRebase(action as any);
        } catch (err) {
          const message =
            (action => {
              switch (action) {
                case 'continue':
                  return trans.__('Fail to continue rebasing.');
                case 'skip':
                  return trans.__('Fail to skip current commit when rebasing.');
                case 'abort':
                  return trans.__('Fail to abort the rebase.');
              }
            })(action) ?? '';
          Notification.update({
            id,
            type: 'error',
            message,
            ...showError(err as Error, trans)
          });
          return;
        }

        const message_ =
          (action => {
            switch (action) {
              case 'continue':
                return trans.__('Commit submitted continuing rebase.');
              case 'skip':
                return trans.__('Current commit skipped.');
              case 'abort':
                return trans.__('Rebase aborted.');
            }
          })(action) ?? '';
        Notification.update({
          id,
          type: 'success',
          message: message_,
          autoClose: 5000
        });
      }
    },
    isEnabled: () => gitModel.status.state === Git.State.REBASING
  });

  commands.addCommand(CommandIDs.gitStash, {
    label: trans.__('Stash Changes'),
    caption: trans.__('Stash all current changes'),
    isEnabled: () => gitModel.pathRepository !== null,
    execute: async args => {
      const stashDialog = await InputDialog.getText({
        // Default stash message is the last commit hash and message
        title: trans.__('Do you want to stash your changes? '),
        placeholder: trans.__('Stash message (optional)'),
        okLabel: trans.__('Stash')
      });
      const stashMsg = stashDialog.value ?? '';

      if (stashDialog.button.accept) {
        const id = Notification.emit(
          trans.__('Stashing changes'),
          'in-progress',
          { autoClose: false }
        );
        try {
          await gitModel.stashChanges(stashMsg);
          // Success
          Notification.update({
            id,
            message: trans.__('Successfully stashed'),
            type: 'success',
            autoClose: 5000
          });
        } catch (error: any) {
          console.error(
            'Encountered an error when pulling changes. Error: ',
            error
          );
          Notification.update({
            id,
            message: trans.__('Failed to stash'),
            type: 'error',
            ...showError(error as Error, trans)
          });
        }
      }
    }
  });

  /**
   *  Calls refreshStash
   *
   */
  commands.addCommand(CommandIDs.gitStashList, {
    label: trans.__('Stash List'),
    caption: trans.__('Get all the stashed changes'),
    // Check if we are in a git repository
    isEnabled: () => gitModel.pathRepository !== null,
    execute: async args => {
      try {
        await gitModel.refreshStash();
        Notification.info(trans.__('Got the stash list'));
      } catch (err) {
        Notification.error(
          trans.__('Failed to get the stash'),
          showError(err as Error, trans)
        );
      }
    }
  });

  /* Context menu commands */
  commands.addCommand(ContextCommandIDs.gitFileOpen, {
    label: trans.__('Open'),
    caption: pluralizedContextLabel(
      trans.__('Open selected file'),
      trans.__('Open selected files')
    ),
    execute: async args => {
      const { files } = args as any as CommandArguments.IGitContextAction;
      for (const file of files) {
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
              path: gitModel.getRelativeFilePath(to)
            });
          } else {
            console.log('Cannot open a folder here');
          }
        } catch (err) {
          console.error(`Fail to open ${to}.`);
        }
      }
    },
    icon: openIcon.bindprops({ stylesheet: 'menuItem' })
  });

  commands.addCommand(ContextCommandIDs.openFileFromDiff, {
    label: trans.__('Open File'),
    caption: trans.__('Open file from its diff view'),
    execute: async _ => {
      const domNode = app.contextMenuHitTest((node: HTMLElement) => {
        const nodeId = node.dataset.id;
        return nodeId?.substring(0, 8) === 'git-diff' ?? false;
      });
      if (!domNode) {
        return;
      }

      const matches = Array.from(shell.widgets('main')).filter(
        widget => widget.id === domNode.dataset.id
      );

      if (matches.length === 0) {
        return;
      }

      const diffModel = (
        ((matches[0] as MainAreaWidget).content as Panel)
          .widgets[0] as Git.Diff.IDiffWidget
      ).model;

      const filename = diffModel.filename;

      if (
        diffModel.reference.source === Git.Diff.SpecialRef.INDEX ||
        diffModel.reference.source === Git.Diff.SpecialRef.WORKING ||
        diffModel.challenger.source === Git.Diff.SpecialRef.INDEX ||
        diffModel.challenger.source === Git.Diff.SpecialRef.WORKING
      ) {
        const file = gitModel.status.files.find(
          fileStatus => fileStatus.from === filename
        );
        if (file) {
          commands.execute(ContextCommandIDs.gitFileOpen, {
            files: [file]
          } as any);
        }
      } else {
        commands.execute('docmanager:open', {
          path: gitModel.getRelativeFilePath(filename)
        });
      }
    }
  });

  commands.addCommand(ContextCommandIDs.gitFileDiff, {
    label: trans.__('Diff'),
    caption: pluralizedContextLabel(
      trans.__('Diff selected file'),
      trans.__('Diff selected files')
    ),
    execute: async args => {
      const { files } = args as any as CommandArguments.IGitFileDiff;
      if (!gitModel.pathRepository) {
        return;
      }

      for (const file of files) {
        const {
          context,
          filePath,
          previousFilePath,
          isText,
          status,
          isPreview
        } = file;

        // nothing to compare to for untracked files
        if (status === 'untracked') {
          continue;
        }

        const repositoryPath = gitModel.pathRepository;
        const filename = filePath;
        const fullPath = PathExt.join(repositoryPath, filename);

        const diffContext: Git.Diff.IContext = {
          currentRef: '',
          previousRef: 'HEAD',
          ...context
        };

        if (status === 'unmerged') {
          diffContext.baseRef = Git.Diff.SpecialRef.BASE;
          diffContext.currentRef =
            gitModel.status.state !== Git.State.MERGING
              ? gitModel.status.state === Git.State.REBASING
                ? 'REBASE_HEAD'
                : 'CHERRY_PICK_HEAD'
              : 'MERGE_HEAD';
        } else if (!diffContext.currentRef) {
          diffContext.currentRef =
            status === 'staged'
              ? Git.Diff.SpecialRef.INDEX
              : Git.Diff.SpecialRef.WORKING;
        }

        const challengerRef = Git.Diff.SpecialRef[diffContext.currentRef as any]
          ? { special: Git.Diff.SpecialRef[diffContext.currentRef as any] }
          : { git: diffContext.currentRef };

        // Base props used for Diff Model
        const props: Omit<Git.Diff.IModel, 'changed' | 'hasConflict'> = {
          challenger: {
            content: async () => {
              return requestAPI<Git.IDiffContent>(
                URLExt.join(repositoryPath, 'content'),
                'POST',
                {
                  filename,
                  // @ts-expect-error this is serializable
                  reference: challengerRef
                }
              ).then(data => data.content);
            },
            label:
              (Git.Diff.SpecialRef[diffContext.currentRef as any] as any) ||
              diffContext.currentRef,
            source: diffContext.currentRef,
            updateAt: Date.now()
          },
          filename,
          reference: {
            content: async () => {
              return requestAPI<Git.IDiffContent>(
                URLExt.join(repositoryPath, 'content'),
                'POST',
                {
                  filename: previousFilePath ?? filename,
                  reference: { git: diffContext.previousRef }
                }
              ).then(data => data.content);
            },
            label:
              (Git.Diff.SpecialRef[diffContext.previousRef as any] as any) ||
              diffContext.previousRef,
            source: diffContext.previousRef,
            updateAt: Date.now()
          },
          repositoryPath
        };

        // Case when file is relocated
        if (previousFilePath) {
          props.reference.label = `${previousFilePath} (${props.reference.label.slice(
            0,
            7
          )})`;
          props.challenger.label = `${filePath} (${props.challenger.label.slice(
            0,
            7
          )})`;
        }

        if (diffContext.baseRef) {
          props.reference.label = trans.__('Current');
          props.challenger.label = trans.__('Incoming');

          // Only add base when diff-ing merge conflicts
          props.base = {
            content: async () => {
              return requestAPI<Git.IDiffContent>(
                URLExt.join(repositoryPath, 'content'),
                'POST',
                {
                  filename,
                  reference: {
                    special: Git.Diff.SpecialRef[diffContext.baseRef as any]
                  }
                }
              ).then(data => data.content);
            },
            label: trans.__('Result'),
            source: diffContext.baseRef,
            updateAt: Date.now()
          };
        }

        // Create the diff widget
        const model = new DiffModel(props);

        const widget = await commands.execute(CommandIDs.gitShowDiff, {
          model,
          isText,
          isPreview
        } as any);

        if (widget) {
          // Trigger diff model update
          if (diffContext.previousRef === 'HEAD') {
            const updateHead = () => {
              model.reference = {
                ...model.reference,
                updateAt: Date.now()
              };
            };

            gitModel.headChanged.connect(updateHead);

            widget.disposed.connect(() => {
              gitModel.headChanged.disconnect(updateHead);
            });
          }

          // If the diff is on the current file and it is updated => diff model changed
          if (diffContext.currentRef === Git.Diff.SpecialRef.WORKING) {
            const updateCurrent = (
              m: Contents.IManager,
              change: Contents.IChangedArgs
            ) => {
              const updateAt = new Date(
                change.newValue?.last_modified ?? 0
              ).valueOf();
              if (
                app.serviceManager.contents.localPath(
                  change.newValue?.path ?? ''
                ) === fullPath &&
                model.challenger.updateAt !== updateAt
              ) {
                model.challenger = {
                  ...model.challenger,
                  updateAt
                };
              }
            };

            // More robust than fileBrowser.model.fileChanged
            app.serviceManager.contents.fileChanged.connect(updateCurrent);

            widget.disposed.connect(() => {
              app.serviceManager.contents.fileChanged.disconnect(updateCurrent);
            });
          }
        }
      }
    },
    icon: diffIcon.bindprops({ stylesheet: 'menuItem' })
  });

  commands.addCommand(ContextCommandIDs.gitFileAdd, {
    label: trans.__('Add'),
    caption: pluralizedContextLabel(
      trans.__('Stage or track the changes to selected file'),
      trans.__('Stage or track the changes of selected files')
    ),
    execute: async args => {
      const { files } = args as any as CommandArguments.IGitContextAction;
      for (const file of files) {
        await gitModel.add(file.to);
      }
    },
    icon: addIcon.bindprops({ stylesheet: 'menuItem' })
  });

  commands.addCommand(ContextCommandIDs.gitFileStage, {
    label: trans.__('Stage'),
    caption: pluralizedContextLabel(
      trans.__('Stage the changes of selected file'),
      trans.__('Stage the changes of selected files')
    ),
    execute: async args => {
      const { files } = args as any as CommandArguments.IGitContextAction;
      for (const file of files) {
        await gitModel.add(file.to);
      }
    },
    icon: addIcon.bindprops({ stylesheet: 'menuItem' })
  });

  commands.addCommand(ContextCommandIDs.gitFileTrack, {
    label: trans.__('Track'),
    caption: pluralizedContextLabel(
      trans.__('Start tracking selected file'),
      trans.__('Start tracking selected files')
    ),
    execute: async args => {
      const { files } = args as any as CommandArguments.IGitContextAction;
      for (const file of files) {
        await gitModel.add(file.to);
      }
    },
    icon: addIcon.bindprops({ stylesheet: 'menuItem' })
  });

  commands.addCommand(ContextCommandIDs.gitFileUnstage, {
    label: trans.__('Unstage'),
    caption: pluralizedContextLabel(
      trans.__('Unstage the changes of selected file'),
      trans.__('Unstage the changes of selected files')
    ),
    execute: async args => {
      const { files } = args as any as CommandArguments.IGitContextAction;
      for (const file of files) {
        if (file.x !== 'D') {
          await gitModel.reset(file.to);
        }
      }
    },
    icon: removeIcon.bindprops({ stylesheet: 'menuItem' })
  });

  function representFiles(files: Git.IStatusFile[]): JSX.Element {
    const elements = files.map(file => (
      <li key={file.to}>
        <b>{file.to}</b>
      </li>
    ));
    return <ul>{elements}</ul>;
  }

  commands.addCommand(ContextCommandIDs.gitFileDelete, {
    label: trans.__('Delete'),
    caption: pluralizedContextLabel(
      trans.__('Delete this file'),
      trans.__('Delete these files')
    ),
    execute: async args => {
      const { files } = args as any as CommandArguments.IGitContextAction;
      const fileList = representFiles(files);

      const result = await showDialog({
        title: trans.__('Delete Files'),
        body: (
          <span>
            {trans.__(
              'Are you sure you want to permanently delete the following files? \
              This action cannot be undone.'
            )}
            {fileList}
          </span>
        ),
        buttons: [
          Dialog.cancelButton({ label: trans.__('Cancel') }),
          Dialog.warnButton({ label: trans.__('Delete') })
        ]
      });
      if (result.button.accept) {
        for (const file of files) {
          try {
            await app.commands.execute('docmanager:delete-file', {
              path: gitModel.getRelativeFilePath(file.to)
            });
          } catch (reason: any) {
            showErrorMessage(trans.__('Deleting %1 failed.', file.to), reason, [
              Dialog.warnButton({ label: trans.__('Dismiss') })
            ]);
          }
        }
      }
    },
    icon: closeIcon.bindprops({ stylesheet: 'menuItem' })
  });

  commands.addCommand(ContextCommandIDs.gitFileDiscard, {
    label: trans.__('Discard'),
    caption: pluralizedContextLabel(
      trans.__('Discard recent changes of selected file'),
      trans.__('Discard recent changes of selected files')
    ),
    execute: async args => {
      const { files } = args as any as CommandArguments.IGitContextAction;
      const fileList = representFiles(files);

      const result = await showDialog({
        title: trans.__('Discard changes'),
        body: (
          <span>
            {trans.__(
              'Are you sure you want to permanently discard changes to the following files? \
              This action cannot be undone.'
            )}
            {fileList}
          </span>
        ),
        buttons: [
          Dialog.cancelButton({ label: trans.__('Cancel') }),
          Dialog.warnButton({ label: trans.__('Discard') })
        ]
      });
      if (result.button.accept) {
        for (const file of files) {
          try {
            if (
              file.status === 'staged' ||
              file.status === 'partially-staged'
            ) {
              await gitModel.reset(file.to);
            }
            if (
              file.status === 'unstaged' ||
              (file.status === 'partially-staged' && file.x !== 'A')
            ) {
              // resetting an added file moves it to untracked category => checkout will fail
              await gitModel.checkout({ filename: file.to });
            }
          } catch (reason: any) {
            showErrorMessage(
              trans.__('Discard changes for %1 failed.', file.to),
              reason,
              [Dialog.warnButton({ label: trans.__('Dismiss') })]
            );
          }
        }
      }
    },
    icon: discardIcon.bindprops({ stylesheet: 'menuItem' })
  });

  commands.addCommand(ContextCommandIDs.gitIgnore, {
    label: pluralizedContextLabel(
      trans.__('Ignore this file (add to .gitignore)'),
      trans.__('Ignore these files (add to .gitignore)')
    ),
    caption: pluralizedContextLabel(
      trans.__('Ignore this file (add to .gitignore)'),
      trans.__('Ignore these files (add to .gitignore)')
    ),
    execute: async args => {
      const { files } = args as any as CommandArguments.IGitContextAction;
      for (const file of files) {
        if (file) {
          await gitModel.ignore(file.to, false);
        }
      }
    }
  });

  commands.addCommand(ContextCommandIDs.gitIgnoreExtension, {
    label: args => {
      const { files } = args as any as CommandArguments.IGitContextAction;
      const extensions = files
        .map(file => PathExt.extname(file.to))
        .filter(extension => extension.length > 0)
        .filter((item, index, arr) => arr.indexOf(item) === index);
      return trans._n(
        'Ignore %2 extension (add to .gitignore)',
        'Ignore %2 extensions (add to .gitignore)',
        extensions.length,
        extensions.join(', ')
      );
    },
    caption: pluralizedContextLabel(
      trans.__('Ignore this file extension (add to .gitignore)'),
      trans.__('Ignore these files extension (add to .gitignore)')
    ),
    execute: async args => {
      const { files } = args as any as CommandArguments.IGitContextAction;
      for (const selectedFile of files) {
        if (selectedFile) {
          const extension = PathExt.extname(selectedFile.to);
          if (extension.length > 0) {
            const result = await showDialog({
              title: trans.__('Ignore file extension'),
              body: trans.__(
                'Are you sure you want to ignore all %1 files within this git repository?',
                extension
              ),
              buttons: [
                Dialog.cancelButton(),
                Dialog.okButton({ label: trans.__('Ignore') })
              ]
            });
            if (result.button.label === trans.__('Ignore')) {
              await gitModel.ignore(selectedFile.to, true);
            }
          }
        }
      }
    },
    isVisible: args => {
      const { files } = args as any as CommandArguments.IGitContextAction;
      return files.some(selectedFile => {
        const extension = PathExt.extname(selectedFile.to);
        return extension.length > 0;
      });
    }
  });

  commands.addCommand(ContextCommandIDs.gitFileHistory, {
    label: trans.__('History'),
    caption: trans.__('View the history of this file'),
    execute: args => {
      const { files } = args as any as CommandArguments.IGitContextAction;
      const file = files[0];
      if (!file) {
        return;
      }
      gitModel.selectedHistoryFile = file;
      shell.activateById('jp-git-sessions');
    },
    isEnabled: args => {
      const { files } = args as any as CommandArguments.IGitContextAction;
      return files.length === 1;
    },
    icon: historyIcon.bindprops({ stylesheet: 'menuItem' })
  });

  commands.addCommand(ContextCommandIDs.gitNoAction, {
    label: trans.__('No actions available'),
    isEnabled: () => false,
    execute: () => void 0
  });

  commands.addCommand(ContextCommandIDs.gitTagAdd, {
    label: trans.__('Add Tag'),
    caption: trans.__('Add tag pointing to selected commit'),
    execute: async args => {
      const commit = args as any as CommandArguments.IGitCommitInfo;

      const widgetId = 'git-dialog-AddTag';
      let anchor = document.querySelector<HTMLDivElement>(`#${widgetId}`);
      if (!anchor) {
        anchor = document.createElement('div');
        anchor.id = widgetId;
        document.body.appendChild(anchor);
      }

      const tagDialog = true;
      const isSingleCommit = true;

      const waitForDialog = new PromiseDelegate<string | null>();
      const dialog = ReactWidget.create(
        <NewTagDialogBox
          pastCommits={[commit.commit]}
          model={gitModel}
          trans={trans}
          open={tagDialog}
          onClose={(tagName?: string) => {
            dialog.dispose();
            waitForDialog.resolve(tagName ?? null);
          }}
          isSingleCommit={isSingleCommit}
        />
      );

      Widget.attach(dialog, anchor);

      const tagName = await waitForDialog.promise;

      if (tagName) {
        const id = Notification.emit(
          trans.__("Create tag pointing to '%1'...", commit.commit.commit_msg),
          'in-progress'
        );
        try {
          await gitModel.setTag(tagName, commit.commit.commit);
        } catch (err) {
          Notification.update({
            id,
            message: trans.__(
              "Failed to create tag '%1' poining to '%2'.",
              tagName,
              commit
            ),
            type: 'error',
            ...showError(err as any, trans)
          });
          return;
        }

        Notification.update({
          id,
          message: trans.__(
            "Created tag '%1' pointing to '%2'.",
            tagName,
            commit
          ),
          type: 'success'
        });
      }
    },
    icon: tagIcon.bindprops({ stylesheet: 'menuItem' })
  });
}

/**
 * Adds commands and menu items.
 *
 * @param commands - Jupyter App commands registry
 *  @param trans - language translator
 * @returns menu
 */
export function createGitMenu(
  commands: CommandRegistry,
  trans: TranslationBundle
): Menu {
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
  menu.title.label = trans.__('Git');
  [
    CommandIDs.gitInit,
    CommandIDs.gitClone,
    CommandIDs.gitMerge,
    CommandIDs.gitPush,
    CommandIDs.gitPull,
    CommandIDs.gitResetToRemote,
    CommandIDs.gitManageRemote,
    CommandIDs.gitTerminalCommand,
    CommandIDs.gitStash
  ].forEach(command => {
    menu.addItem({ command });
    if (command === CommandIDs.gitPush) {
      menu.addItem({ command, args: { advanced: true } });
    }
    if (command === CommandIDs.gitPull) {
      menu.addItem({ command, args: { force: true } });
    }
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

export function addMenuItems(
  commands: ContextCommandIDs[],
  contextMenu: Menu,
  selectedFiles: Git.IStatusFile[]
): void {
  commands.forEach(command => {
    if (command === ContextCommandIDs.gitFileDiff) {
      contextMenu.addItem({
        command,
        args: {
          files: selectedFiles.map(file => {
            return {
              filePath: file.to,
              isText: !file.is_binary,
              status: file.status
            };
          })
        } as CommandArguments.IGitFileDiff as any
      });
    } else {
      contextMenu.addItem({
        command,
        args: {
          files: selectedFiles
        } as CommandArguments.IGitContextAction as any
      });
    }
  });
}

export function addHistoryMenuItems(
  commands: ContextCommandIDs[],
  contextMenu: Menu,
  selectedCommit: Git.ISingleCommitInfo
): void {
  commands.forEach(command => {
    contextMenu.addItem({
      command,
      args: {
        commit: selectedCommit
      } as CommandArguments.IGitCommitInfo as any
    });
  });
}

/**
 * Populate Git context submenu depending on the selected files.
 */
export function addFileBrowserContextMenu(
  model: IGitExtension,
  filebrowser: FileBrowser,
  contents: Contents.IManager,
  contextMenu: ContextMenuSvg,
  trans: TranslationBundle
): void {
  let gitMenu: Menu | null = null;
  let _commands: ContextCommandIDs[];
  let _paths: string[];

  function updateItems(menu: Menu): void {
    const wasShown = menu.isVisible;
    const parent = menu.parentMenu;

    const items = Array.from(filebrowser.selectedItems());
    const statuses = new Set<Git.Status>(
      // @ts-expect-error file cannot be undefined or null
      items
        .map(item => {
          const itemPath = contents.localPath(item.path);
          return model.pathRepository === null
            ? undefined
            : model.getFile(itemPath)?.status;
        })
        .filter(status => typeof status !== 'undefined')
    );

    // get commands and de-duplicate them
    const allCommands = new Set<ContextCommandIDs>(
      // flatten the list of lists of commands
      []
        // @ts-expect-error status can index the context commands object
        .concat(...[...statuses].map(status => CONTEXT_COMMANDS[status!]))
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

    const commandsChanged =
      !_commands ||
      _commands.length !== allCommands.size ||
      !_commands.every(command => allCommands.has(command));

    const paths = items.map(item => item.path);

    const filesChanged = !_paths || !ArrayExt.shallowEqual(_paths, paths);

    if (commandsChanged || filesChanged) {
      const commandsList = [...allCommands];
      menu.clearItems();
      addMenuItems(
        commandsList,
        menu,
        // @ts-expect-error file cannot be undefined or null
        (paths ?? [])
          .map(path => model.getFile(path))
          // if file cannot be resolved (has no action available),
          // omit the undefined result
          .filter(file => !['null', 'undefined'].includes(typeof file))
      );

      if (wasShown) {
        // show the menu again after downtime for refresh
        parent!.triggerActiveItem();
      }
      _commands = commandsList;
      _paths = paths;
    }
  }

  function updateGitMenu(contextMenu: ContextMenu) {
    if (!gitMenu) {
      gitMenu =
        contextMenu.menu.items.find(
          item =>
            item.type === 'submenu' && item.submenu?.id === 'jp-contextmenu-git'
        )?.submenu ?? null;
    }

    if (!gitMenu) {
      return; // Bail early if the open with menu is not displayed
    }

    // Render using the most recent model (even if possibly outdated)
    updateItems(gitMenu);
    const renderedStatus = model.status;

    // Trigger refresh before the menu is displayed
    model
      .refreshStatus()
      .then(() => {
        if (model.status !== renderedStatus) {
          // update items if needed
          updateItems(gitMenu!);
        }
      })
      .catch(error => {
        console.error(
          'Fail to refresh model when displaying git context menu.',
          error
        );
      });
  }

  // as any is to support JLab 3.1 feature
  if ((contextMenu as any).opened) {
    (contextMenu as any).opened.connect(updateGitMenu);
  } else {
    // matches only non-directory items

    class GitMenu extends Menu {
      protected onBeforeAttach(msg: Message): void {
        updateGitMenu(contextMenu);
        super.onBeforeAttach(msg);
      }
    }

    const selectorNotDir = '.jp-DirListing-item[data-isdir="false"]';
    gitMenu = new GitMenu({ commands: contextMenu.menu.commands });
    gitMenu.title.label = trans.__('Git');
    gitMenu.title.icon = gitIcon.bindprops({ stylesheet: 'menuItem' });

    contextMenu.addItem({
      type: 'submenu',
      submenu: gitMenu,
      selector: selectorNotDir,
      rank: 5
    });
  }
}

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
  model: IGitExtension,
  operation: Operation,
  trans: TranslationBundle,
  args?: T,
  authentication?: Git.IAuth,
  retry = false
): Promise<string> {
  /**
   * Returns the current remote's URL based on the current remote name and all the remotes
   */
  async function getCurrentRemote(currentRemoteName: string): Promise<string> {
    const remoteList = await model.getRemotes().then(remoteList => {
      return remoteList;
    });

    const currentRemote = remoteList.find(
      remoteURI => remoteURI.name === currentRemoteName
    );

    if (currentRemote) {
      return currentRemote?.url;
    } else {
      return '';
    }
  }

  /**
   * Returns the Git provider based on the domain name of the url
   */
  function getGitProviderHost(remoteUrl: string): string {
    // Regex returns the word between "https" and "."
    const re = /https:\/\/([^.]+)\./;
    const result = remoteUrl.match(re) ?? [];
    const gitProvider = result[1];
    return gitProvider;
  }

  try {
    let result: Git.IResultWithMessage;
    // the Git action
    switch (operation) {
      case Operation.Clone:
        // eslint-disable-next-line no-case-declarations
        const { path, url, versioning, submodules } =
          args as any as IGitCloneArgs;
        result = await model.clone(
          path,
          url,
          authentication,
          versioning ?? true,
          submodules ?? false
        );
        break;
      case Operation.Pull:
        result = await model.pull(authentication);
        break;
      case Operation.Push:
        result = await model.push(
          authentication,
          false,
          (args as unknown as { remote: string })['remote']
        );
        break;
      case Operation.ForcePush:
        result = await model.push(
          authentication,
          true,
          (args as unknown as { remote: string })['remote']
        );
        break;
      case Operation.Fetch:
        result = await model.fetch(authentication);
        model.credentialsRequired = false;
        break;
      default:
        result = { code: -1, message: 'Unknown git command' };
        break;
    }
    return result.message;
  } catch (error) {
    if (
      AUTH_ERROR_MESSAGES.some(
        errorMessage => (error as Error).message.indexOf(errorMessage) > -1
      )
    ) {
      // Change the placeholder message for GitHub
      let gitPasswordPlaceholder = trans.__('password / personal access token');
      let remoteGitProvider = '';

      switch (operation) {
        case Operation.Clone:
          // eslint-disable-next-line no-case-declarations
          const { url: encodedArgsUrl } = args as any as IGitCloneArgs;
          remoteGitProvider = getGitProviderHost(
            decodeURIComponent(encodedArgsUrl)
          );
          break;
        case Operation.Push:
        case Operation.ForcePush:
        case Operation.Pull:
          // If the remote is defined, check it against the remote URI list
          if (model.currentBranch?.upstream) {
            // Compare the remote against the URI list
            const remoteName = model.currentBranch.upstream.split('/')[0];
            const currentRemoteUrl = await getCurrentRemote(remoteName);
            remoteGitProvider = currentRemoteUrl
              ? getGitProviderHost(currentRemoteUrl)
              : '';
          } else {
            // if the remote is undefined, use first remote URI
            const remoteList = await model.getRemotes().then(remoteList => {
              return remoteList;
            });
            remoteGitProvider = getGitProviderHost(remoteList[0]?.url);
          }
          break;

        case Operation.Fetch:
          remoteGitProvider = await model
            .getRemotes()
            .then(remoteList => remoteList[0]?.url);
          break;
        default:
          break;
      }
      // GitHub only verifies with personal access tokens
      if (remoteGitProvider && remoteGitProvider.toLowerCase() === 'github') {
        gitPasswordPlaceholder = trans.__('personal access token');
      }
      // If the error is an authentication error, ask the user credentials
      const credentials = await showDialog({
        title: trans.__('Git credentials required'),
        body: new GitCredentialsForm(
          trans,
          trans.__('Enter credentials for remote repository'),
          retry ? trans.__('Incorrect username or password.') : '',
          gitPasswordPlaceholder
        )
      });

      if (credentials.button.accept) {
        // Retry the operation if the user provides its credentials
        return await showGitOperationDialog<T>(
          model,
          operation,
          trans,
          args,
          credentials.value ?? undefined,
          true
        );
      } else {
        throw new CancelledError();
      }
    }
    // Throw the error if it cannot be handled or
    // if the user did not accept to provide its credentials
    throw error;
  }
}
