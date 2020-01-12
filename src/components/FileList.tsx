import { Dialog, showErrorMessage } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/coreutils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { Menu } from '@phosphor/widgets';
import * as React from 'react';
import { GitExtension } from '../model';
import { Git } from '../tokens';
import { openListedFile } from '../utils';
import { openDiffView } from './diff/DiffWidget';
import { GitStage, IGitStageSharedProps } from './GitStage';
import { GitStageSimple } from './GitStageSimple';

export namespace CommandIDs {
  export const gitFileOpen = 'git:context-open';
  export const gitFileUnstage = 'git:context-unstage';
  export const gitFileStage = 'git:context-stage';
  export const gitFileTrack = 'git:context-track';
  export const gitFileDiscard = 'git:context-discard';
  export const gitFileDiffWorking = 'git:context-diffWorking';
  export const gitFileDiffIndex = 'git:context-diffIndex';
}

export interface IFileListState {
  selectedFile: Git.IStatusFileResult | null;
}

export interface IFileListProps {
  stagedFiles: Git.IStatusFileResult[];
  unstagedFiles: Git.IStatusFileResult[];
  untrackedFiles: Git.IStatusFileResult[];
  model: GitExtension;
  renderMime: IRenderMimeRegistry;
  settings: ISettingRegistry.ISettings;
}

export class FileList extends React.Component<IFileListProps, IFileListState> {
  constructor(props: IFileListProps) {
    super(props);

    const commands = this.props.model.commands;
    this._contextMenuStaged = new Menu({ commands });
    this._contextMenuUnstaged = new Menu({ commands });
    this._contextMenuUntracked = new Menu({ commands });

    this.state = {
      selectedFile: null
    };

    if (!commands.hasCommand(CommandIDs.gitFileOpen)) {
      commands.addCommand(CommandIDs.gitFileOpen, {
        label: 'Open',
        caption: 'Open selected file',
        execute: async () => {
          await openListedFile(this.state.selectedFile, this.props.model);
        }
      });
    }

    if (!commands.hasCommand(CommandIDs.gitFileDiffWorking)) {
      commands.addCommand(CommandIDs.gitFileDiffWorking, {
        label: 'Diff',
        caption: 'Diff selected file',
        execute: async () => {
          await openDiffView(
            this.state.selectedFile.to,
            this.props.model,
            {
              currentRef: { specialRef: 'WORKING' },
              previousRef: { gitRef: 'HEAD' }
            },
            this.props.renderMime
          );
        }
      });
    }

    if (!commands.hasCommand(CommandIDs.gitFileDiffIndex)) {
      commands.addCommand(CommandIDs.gitFileDiffIndex, {
        label: 'Diff',
        caption: 'Diff selected file',
        execute: async () => {
          await openDiffView(
            this.state.selectedFile.to,
            this.props.model,
            {
              currentRef: { specialRef: 'INDEX' },
              previousRef: { gitRef: 'HEAD' }
            },
            this.props.renderMime
          );
        }
      });
    }

    if (!commands.hasCommand(CommandIDs.gitFileStage)) {
      commands.addCommand(CommandIDs.gitFileStage, {
        label: 'Stage',
        caption: 'Stage the changes of selected file',
        execute: () => {
          this.addFile(this.state.selectedFile.to);
        }
      });
    }

    if (!commands.hasCommand(CommandIDs.gitFileTrack)) {
      commands.addCommand(CommandIDs.gitFileTrack, {
        label: 'Track',
        caption: 'Start tracking selected file',
        execute: () => {
          this.addFile(this.state.selectedFile.to);
        }
      });
    }

    if (!commands.hasCommand(CommandIDs.gitFileUnstage)) {
      commands.addCommand(CommandIDs.gitFileUnstage, {
        label: 'Unstage',
        caption: 'Unstage the changes of selected file',
        execute: () => {
          if (this.state.selectedFile.x !== 'D') {
            this.resetStagedFile(this.state.selectedFile.to);
          }
        }
      });
    }

    if (!commands.hasCommand(CommandIDs.gitFileDiscard)) {
      commands.addCommand(CommandIDs.gitFileDiscard, {
        label: 'Discard',
        caption: 'Discard recent changes of selected file',
        execute: () => {
          this.discardChanges(this.state.selectedFile.to);
        }
      });
    }

    [
      CommandIDs.gitFileOpen,
      CommandIDs.gitFileUnstage,
      CommandIDs.gitFileDiffIndex
    ].forEach(command => {
      this._contextMenuStaged.addItem({ command });
    });

    [
      CommandIDs.gitFileOpen,
      CommandIDs.gitFileStage,
      CommandIDs.gitFileDiscard,
      CommandIDs.gitFileDiffWorking
    ].forEach(command => {
      this._contextMenuUnstaged.addItem({ command });
    });

    [CommandIDs.gitFileOpen, CommandIDs.gitFileTrack].forEach(command => {
      this._contextMenuUntracked.addItem({ command });
    });
  }

  /** Handle right-click on a staged file */
  contextMenuStaged = (event: React.MouseEvent) => {
    event.preventDefault();
    this._contextMenuStaged.open(event.clientX, event.clientY);
  };

  /** Handle right-click on an unstaged file */
  contextMenuUnstaged = (event: React.MouseEvent) => {
    event.preventDefault();
    this._contextMenuUnstaged.open(event.clientX, event.clientY);
  };

  /** Handle right-click on an untracked file */
  contextMenuUntracked = (event: React.MouseEvent) => {
    event.preventDefault();
    this._contextMenuUntracked.open(event.clientX, event.clientY);
  };

  /** Reset all staged files */
  resetAllStagedFiles = async () => {
    await this.props.model.reset();
  };

  /** Reset a specific staged file */
  resetStagedFile = async (file: string) => {
    await this.props.model.reset(file);
  };

  /** Add all unstaged files */
  addAllUnstagedFiles = async () => {
    await this.props.model.addAllUnstaged();
  };

  /** Discard changes in all unstaged files */
  discardAllUnstagedFiles = async () => {
    try {
      await this.props.model.checkout();
    } catch (reason) {
      showErrorMessage('Discard all unstaged changes failed.', reason, [
        Dialog.warnButton({ label: 'DISMISS' })
      ]);
    }
  };

  /** Discard changes in all unstaged and staged files */
  discardAllChanges = async () => {
    try {
      await this.props.model.resetToCommit();
    } catch (reason) {
      showErrorMessage('Discard all changes failed.', reason, [
        Dialog.warnButton({ label: 'DISMISS' })
      ]);
    }
  };

  /** Add a specific unstaged file */
  addFile = async (...file: string[]) => {
    await this.props.model.add(...file);
  };

  /** Discard changes in a specific unstaged or staged file */
  discardChanges = async (file: string) => {
    try {
      await this.props.model.reset(file);
      await this.props.model.checkout({ filename: file });
    } catch (reason) {
      showErrorMessage(`Discard changes for ${file} failed.`, reason, [
        Dialog.warnButton({ label: 'DISMISS' })
      ]);
    }
  };

  /** Add all untracked files */
  addAllUntrackedFiles = async () => {
    await this.props.model.addAllUntracked();
  };

  addAllMarkedFiles = async () => {
    await this.addFile(...this.markedFiles.map(file => file.to));
  };

  updateSelectedFile = (file: Git.IStatusFileResult | null) => {
    this.setState({ selectedFile: file });
  };

  get markedFiles() {
    return this.allFilesExcludingUnmodified.filter(file =>
      this.props.model.getMark(file.to)
    );
  }

  get allFilesExcludingUnmodified() {
    let files = this.props.untrackedFiles.concat(
      this.props.unstagedFiles,
      this.props.stagedFiles
    );

    files.sort((a, b) => a.to.localeCompare(b.to));
    return files;
  }

  private _renderStaged(sharedProps: IGitStageSharedProps) {
    return (
      <GitStage
        heading={'Staged'}
        files={this.props.stagedFiles}
        moveAllFiles={this.resetAllStagedFiles}
        discardAllFiles={null}
        discardFile={null}
        moveFile={this.resetStagedFile}
        moveAllFilesTitle={'Unstage all changes'}
        moveFileTitle={'Unstage this change'}
        contextMenu={this.contextMenuStaged}
        {...sharedProps}
      />
    );
  }

  private _renderChanged(sharedProps: IGitStageSharedProps) {
    return (
      <GitStage
        heading={'Changed'}
        files={this.props.unstagedFiles}
        moveAllFiles={this.addAllUnstagedFiles}
        discardAllFiles={this.discardAllUnstagedFiles}
        discardFile={this.discardChanges}
        moveFile={this.addFile}
        moveAllFilesTitle={'Stage all changes'}
        moveFileTitle={'Stage this change'}
        contextMenu={this.contextMenuUnstaged}
        {...sharedProps}
      />
    );
  }

  private _renderUntracked(sharedProps: IGitStageSharedProps) {
    return (
      <GitStage
        heading={'Untracked'}
        files={this.props.untrackedFiles}
        moveAllFiles={this.addAllUntrackedFiles}
        discardAllFiles={null}
        discardFile={null}
        moveFile={this.addFile}
        moveAllFilesTitle={'Track all untracked files'}
        moveFileTitle={'Track this file'}
        contextMenu={this.contextMenuUntracked}
        {...sharedProps}
      />
    );
  }

  render() {
    const sharedProps: IGitStageSharedProps = {
      model: this.props.model,
      selectedFile: this.state.selectedFile,
      selectFile: this.updateSelectedFile,
      renderMime: this.props.renderMime
    };

    if (this.props.settings.composite['simpleStaging']) {
      return (
        <div>
          <GitStageSimple
            heading={'Changed'}
            files={this.allFilesExcludingUnmodified}
            model={this.props.model}
            discardAllFiles={this.discardAllChanges}
            discardFile={this.discardChanges}
            renderMime={this.props.renderMime}
          />
        </div>
      );
    } else {
      return (
        <div onContextMenu={event => event.preventDefault()}>
          {this._renderStaged(sharedProps)}
          {this._renderChanged(sharedProps)}
          {this._renderUntracked(sharedProps)}
        </div>
      );
    }
  }

  private _contextMenuStaged: Menu;
  private _contextMenuUnstaged: Menu;
  private _contextMenuUntracked: Menu;
}
