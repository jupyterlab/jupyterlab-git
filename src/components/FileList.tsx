import * as React from 'react';
import { Dialog, showDialog, showErrorMessage } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/coreutils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { Menu } from '@phosphor/widgets';
import { GitExtension } from '../model';
import { hiddenButtonStyle } from '../style/ActionButtonStyle';
import { Git } from '../tokens';
import { decodeStage, openListedFile } from '../utils';
import { ActionButton } from './ActionButton';
import { openDiffView } from './diff/DiffWidget';
import { FileItem, IFileItemSharedProps } from './FileItem';
import { FileItemSimple } from './FileItemSimple';
import { GitStage } from './GitStage';

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
    const result = await showDialog({
      title: 'Discard all changes',
      body: `Are you sure you want to permanently discard changes to all files? This action cannot be undone.`,
      buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard' })]
    });
    if (result.button.accept) {
      try {
        await this.props.model.checkout();
      } catch (reason) {
        showErrorMessage('Discard all unstaged changes failed.', reason);
      }
    }
  };

  /** Discard changes in all unstaged and staged files */
  discardAllChanges = async () => {
    const result = await showDialog({
      title: 'Discard all changes',
      body: `Are you sure you want to permanently discard changes to all files? This action cannot be undone.`,
      buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard' })]
    });
    if (result.button.accept) {
      try {
        await this.props.model.resetToCommit();
      } catch (reason) {
        showErrorMessage('Discard all changes failed.', reason);
      }
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

  private _renderStaged(sharedProps: IFileItemSharedProps) {
    return (
      <GitStage
        actions={
          <ActionButton
            className={hiddenButtonStyle}
            disabled={this.props.stagedFiles.length === 0}
            iconName={'git-remove'}
            title={'Unstage all changes'}
            onClick={this.resetAllStagedFiles}
          />
        }
        collapsible
        heading={'Staged'}
        nFiles={this.props.stagedFiles.length}
      >
        {this.props.stagedFiles.map((file: Git.IStatusFileResult) => {
          return (
            <FileItem
              key={file.to}
              stage={'staged'}
              file={file}
              moveFile={this.resetStagedFile}
              discardFile={null}
              moveFileTitle={'Unstage this change'}
              contextMenu={this.contextMenuStaged}
              selected={this._isSelectedFile(file)}
              {...sharedProps}
            />
          );
        })}
      </GitStage>
    );
  }

  private _renderChanged(sharedProps: IFileItemSharedProps) {
    const disabled = this.props.unstagedFiles.length === 0;
    return (
      <GitStage
        actions={
          <React.Fragment>
            <ActionButton
              className={hiddenButtonStyle}
              disabled={disabled}
              iconName={'git-discard'}
              title={'Discard All Changes'}
              onClick={this.discardAllUnstagedFiles}
            />
            <ActionButton
              className={hiddenButtonStyle}
              disabled={disabled}
              iconName={'git-add'}
              title={'Stage all changes'}
              onClick={this.addAllUnstagedFiles}
            />
          </React.Fragment>
        }
        collapsible
        heading={'Changed'}
        nFiles={this.props.unstagedFiles.length}
      >
        {this.props.unstagedFiles.map((file: Git.IStatusFileResult) => {
          return (
            <FileItem
              key={file.to}
              stage={'unstaged'}
              file={file}
              moveFile={this.addFile}
              discardFile={this.discardChanges}
              moveFileTitle={'Stage this change'}
              contextMenu={this.contextMenuUnstaged}
              selected={this._isSelectedFile(file)}
              {...sharedProps}
            />
          );
        })}
      </GitStage>
    );
  }

  private _renderUntracked(sharedProps: IFileItemSharedProps) {
    return (
      <GitStage
        actions={
          <ActionButton
            className={hiddenButtonStyle}
            disabled={this.props.untrackedFiles.length === 0}
            iconName={'git-add'}
            title={'Track all untracked files'}
            onClick={this.addAllUntrackedFiles}
          />
        }
        collapsible
        heading={'Untracked'}
        nFiles={this.props.untrackedFiles.length}
      >
        {this.props.untrackedFiles.map((file: Git.IStatusFileResult) => {
          return (
            <FileItem
              key={file.to}
              stage={'untracked'}
              file={file}
              moveFile={this.addFile}
              discardFile={null}
              moveFileTitle={'Track this file'}
              contextMenu={this.contextMenuUntracked}
              selected={this._isSelectedFile(file)}
              {...sharedProps}
            />
          );
        })}
      </GitStage>
    );
  }

  render() {
    const sharedProps: IFileItemSharedProps = {
      model: this.props.model,
      selectFile: this.updateSelectedFile,
      renderMime: this.props.renderMime
    };

    if (this.props.settings.composite['simpleStaging']) {
      const files = this.allFilesExcludingUnmodified;
      return (
        <div>
          <GitStage
            actions={
              <ActionButton
                className={hiddenButtonStyle}
                disabled={files.length === 0}
                iconName={'git-discard'}
                title={'Discard All Changes'}
                onClick={this.discardAllChanges}
              />
            }
            heading={'Changed'}
            nFiles={files.length}
          >
            {files.map((file: Git.IStatusFileResult) => {
              return (
                <FileItemSimple
                  key={file.to}
                  file={file}
                  stage={decodeStage(file.x, file.y)}
                  model={this.props.model}
                  discardFile={this.discardChanges}
                  renderMime={this.props.renderMime}
                />
              );
            })}
          </GitStage>
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

  private _isSelectedFile(candidate: Git.IStatusFileResult): boolean {
    if (this.state.selectedFile === null) {
      return false;
    }

    return (
      this.state.selectedFile.x === candidate.x &&
      this.state.selectedFile.y === candidate.y &&
      this.state.selectedFile.from === candidate.from &&
      this.state.selectedFile.to === candidate.to
    );
  }

  private _contextMenuStaged: Menu;
  private _contextMenuUnstaged: Menu;
  private _contextMenuUntracked: Menu;
}
