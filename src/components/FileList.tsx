import { Dialog, showDialog, showErrorMessage } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/coreutils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { JSONObject } from '@phosphor/coreutils';
import { Menu } from '@phosphor/widgets';
import * as React from 'react';
import { GitExtension } from '../model';
import {
  moveFileDownButtonSelectedStyle,
  moveFileDownButtonStyle,
  moveFileUpButtonSelectedStyle,
  moveFileUpButtonStyle
} from '../style/FileListStyle';
import { Git } from '../tokens';
import { openListedFile } from '../utils';
import { GitAuthorForm } from '../widgets/AuthorBox';
import { CommitBox } from './CommitBox';
import { openDiffView } from './diff/DiffWidget';
import { GitStage, IGitStageProps } from './GitStage';
import { GitStageSimple } from './GitStageSimple';

export namespace CommandIDs {
  export const gitFileOpen = 'gf:Open';
  export const gitFileUnstage = 'gf:Unstage';
  export const gitFileStage = 'gf:Stage';
  export const gitFileTrack = 'gf:Track';
  export const gitFileDiscard = 'gf:Discard';
  export const gitFileDiffWorking = 'gf:DiffWorking';
  export const gitFileDiffIndex = 'gf:DiffIndex';
}

export interface IFileListState {
  commitMessage: string;
  disableCommit: boolean;
  showStaged: boolean;
  showUnstaged: boolean;
  showUntracked: boolean;
  contextMenuStaged: Menu;
  contextMenuUnstaged: Menu;
  contextMenuUntracked: Menu;
  contextMenuTypeX: string;
  contextMenuTypeY: string;
  contextMenuFile: string;
  contextMenuIndex: number;
  contextMenuStage: string;
  selectedFile: number;
  selectedStage: string;
  selectedDiscardFile: number;
  disableStaged: boolean;
  disableUnstaged: boolean;
  disableUntracked: boolean;
  disableFiles: boolean;
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

    this.state = {
      commitMessage: '',
      disableCommit: true,
      showStaged: true,
      showUnstaged: true,
      showUntracked: true,
      contextMenuStaged: new Menu({ commands }),
      contextMenuUnstaged: new Menu({ commands }),
      contextMenuUntracked: new Menu({ commands }),
      contextMenuTypeX: '',
      contextMenuTypeY: '',
      contextMenuFile: '',
      contextMenuIndex: -1,
      contextMenuStage: '',
      selectedFile: -1,
      selectedStage: '',
      selectedDiscardFile: -1,
      disableStaged: false,
      disableUnstaged: false,
      disableUntracked: false,
      disableFiles: false
    };

    if (!commands.hasCommand(CommandIDs.gitFileOpen)) {
      commands.addCommand(CommandIDs.gitFileOpen, {
        label: 'Open',
        caption: 'Open selected file',
        execute: async () => {
          await openListedFile(
            this.state.contextMenuTypeX,
            this.state.contextMenuTypeY,
            this.state.contextMenuFile,
            this.props.model
          );
        }
      });
    }

    if (!commands.hasCommand(CommandIDs.gitFileDiffWorking)) {
      commands.addCommand(CommandIDs.gitFileDiffWorking, {
        label: 'Diff',
        caption: 'Diff selected file',
        execute: async () => {
          await openDiffView(
            this.state.contextMenuFile,
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
            this.state.contextMenuFile,
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
          this.addUnstagedFile(this.state.contextMenuFile);
        }
      });
    }

    if (!commands.hasCommand(CommandIDs.gitFileTrack)) {
      commands.addCommand(CommandIDs.gitFileTrack, {
        label: 'Track',
        caption: 'Start tracking selected file',
        execute: () => {
          this.addUntrackedFile(this.state.contextMenuFile);
        }
      });
    }

    if (!commands.hasCommand(CommandIDs.gitFileUnstage)) {
      commands.addCommand(CommandIDs.gitFileUnstage, {
        label: 'Unstage',
        caption: 'Unstage the changes of selected file',
        execute: () => {
          if (this.state.contextMenuTypeX !== 'D') {
            this.resetStagedFile(this.state.contextMenuFile);
          }
        }
      });
    }

    if (!commands.hasCommand(CommandIDs.gitFileDiscard)) {
      commands.addCommand(CommandIDs.gitFileDiscard, {
        label: 'Discard',
        caption: 'Discard recent changes of selected file',
        execute: () => {
          this.updateSelectedFile(
            this.state.contextMenuIndex,
            this.state.contextMenuStage
          );
          this.updateSelectedDiscardFile(this.state.contextMenuIndex);
          this.toggleDisableFiles();
        }
      });
    }

    this.state.contextMenuStaged.addItem({ command: CommandIDs.gitFileOpen });
    this.state.contextMenuStaged.addItem({
      command: CommandIDs.gitFileUnstage
    });
    this.state.contextMenuStaged.addItem({
      command: CommandIDs.gitFileDiffIndex
    });

    this.state.contextMenuUnstaged.addItem({ command: CommandIDs.gitFileOpen });
    this.state.contextMenuUnstaged.addItem({
      command: CommandIDs.gitFileStage
    });
    this.state.contextMenuUnstaged.addItem({
      command: CommandIDs.gitFileDiscard
    });
    this.state.contextMenuUnstaged.addItem({
      command: CommandIDs.gitFileDiffWorking
    });

    this.state.contextMenuUntracked.addItem({
      command: CommandIDs.gitFileOpen
    });
    this.state.contextMenuUntracked.addItem({
      command: CommandIDs.gitFileTrack
    });
  }

  /** Handle right-click on a staged file */
  contextMenuStaged = (
    event: any,
    typeX: string,
    typeY: string,
    file: string,
    index: number,
    stage: string
  ) => {
    event.persist();
    event.preventDefault();
    this.setState(
      {
        contextMenuTypeX: typeX,
        contextMenuTypeY: typeY,
        contextMenuFile: file,
        contextMenuIndex: index,
        contextMenuStage: stage
      },
      () => this.state.contextMenuStaged.open(event.clientX, event.clientY)
    );
  };

  /** Handle right-click on an unstaged file */
  contextMenuUnstaged = (
    event: any,
    typeX: string,
    typeY: string,
    file: string,
    index: number,
    stage: string
  ) => {
    event.persist();
    event.preventDefault();
    this.setState(
      {
        contextMenuTypeX: typeX,
        contextMenuTypeY: typeY,
        contextMenuFile: file,
        contextMenuIndex: index,
        contextMenuStage: stage
      },
      () => this.state.contextMenuUnstaged.open(event.clientX, event.clientY)
    );
  };

  /** Handle right-click on an untracked file */
  contextMenuUntracked = (
    event: any,
    typeX: string,
    typeY: string,
    file: string,
    index: number,
    stage: string
  ) => {
    event.persist();
    event.preventDefault();
    this.setState(
      {
        contextMenuTypeX: typeX,
        contextMenuTypeY: typeY,
        contextMenuFile: file,
        contextMenuIndex: index,
        contextMenuStage: stage
      },
      () => this.state.contextMenuUntracked.open(event.clientX, event.clientY)
    );
  };

  /** Toggle display of staged files */
  displayStaged = (): void => {
    this.setState({ showStaged: !this.state.showStaged });
  };

  /** Toggle display of unstaged files */
  displayUnstaged = (): void => {
    this.setState({ showUnstaged: !this.state.showUnstaged });
  };

  /** Toggle display of untracked files */
  displayUntracked = (): void => {
    this.setState({ showUntracked: !this.state.showUntracked });
  };

  updateSelectedStage = (stage: string): void => {
    this.setState({ selectedStage: stage });
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
  addUnstagedFile = async (file: string) => {
    await this.props.model.add(file);
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

  /** Add a specific untracked file */
  addUntrackedFile = async (file: string) => {
    await this.props.model.add(file);
  };

  disableStagesForDiscardAll = () => {
    this.setState({
      disableStaged: !this.state.disableStaged,
      disableUntracked: !this.state.disableUntracked
    });
  };

  updateSelectedDiscardFile = (index: number): void => {
    this.setState({ selectedDiscardFile: index });
  };

  toggleDisableFiles = (): void => {
    this.setState({ disableFiles: !this.state.disableFiles });
  };

  updateSelectedFile = (file: number, stage: string) => {
    this.setState({ selectedFile: file }, () =>
      this.updateSelectedStage(stage)
    );
  };

  /** Commit all staged files */
  commitAllStagedFiles = async (message: string): Promise<void> => {
    try {
      if (
        message &&
        message !== '' &&
        (await this._hasIdentity(this.props.model.pathRepository))
      ) {
        await this.props.model.commit(message);
      }
    } catch (error) {
      console.error(error);
      showErrorMessage('Fail to commit', error);
    }
  };

  render() {
    const sharedProps = {
      model: this.props.model,
      selectedFile: this.state.selectedFile,
      updateSelectedFile: this.updateSelectedFile,
      selectedStage: this.state.selectedStage,
      updateSelectedStage: this.updateSelectedStage,
      selectedDiscardFile: this.state.selectedDiscardFile,
      updateSelectedDiscardFile: this.updateSelectedDiscardFile,
      disableFiles: this.state.disableFiles,
      toggleDisableFiles: this.toggleDisableFiles,
      renderMime: this.props.renderMime
    };

    const Staged = (props: Partial<IGitStageProps> = {}) => (
      <GitStage
        heading={'Staged'}
        files={this.props.stagedFiles}
        showFiles={this.state.showStaged}
        displayFiles={this.displayStaged}
        moveAllFiles={this.resetAllStagedFiles}
        discardAllFiles={null}
        discardFile={null}
        moveFile={this.resetStagedFile}
        moveFileIconClass={moveFileDownButtonStyle}
        moveFileIconSelectedClass={moveFileDownButtonSelectedStyle}
        moveAllFilesTitle={'Unstage all changes'}
        moveFileTitle={'Unstage this change'}
        contextMenu={this.contextMenuStaged}
        disableOthers={null}
        isDisabled={this.state.disableStaged}
        {...sharedProps}
        {...props}
      />
    );

    const Changed = (props: Partial<IGitStageProps> = {}) => (
      <GitStage
        heading={'Changed'}
        files={this.props.unstagedFiles}
        showFiles={this.state.showUnstaged}
        displayFiles={this.displayUnstaged}
        moveAllFiles={this.addAllUnstagedFiles}
        discardAllFiles={this.discardAllUnstagedFiles}
        discardFile={this.discardChanges}
        moveFile={this.addUnstagedFile}
        moveFileIconClass={moveFileUpButtonStyle}
        moveFileIconSelectedClass={moveFileUpButtonSelectedStyle}
        moveAllFilesTitle={'Stage all changes'}
        moveFileTitle={'Stage this change'}
        contextMenu={this.contextMenuUnstaged}
        disableOthers={this.disableStagesForDiscardAll}
        isDisabled={this.state.disableUnstaged}
        {...sharedProps}
        {...props}
      />
    );

    const Untracked = (props: Partial<IGitStageProps> = {}) => (
      <GitStage
        heading={'Untracked'}
        files={this.props.untrackedFiles}
        showFiles={this.state.showUntracked}
        displayFiles={this.displayUntracked}
        moveAllFiles={this.addAllUntrackedFiles}
        discardAllFiles={null}
        discardFile={null}
        moveFile={this.addUntrackedFile}
        moveFileIconClass={moveFileUpButtonStyle}
        moveFileIconSelectedClass={moveFileUpButtonSelectedStyle}
        moveAllFilesTitle={'Track all untracked files'}
        moveFileTitle={'Track this file'}
        contextMenu={this.contextMenuUntracked}
        disableOthers={null}
        isDisabled={this.state.disableUntracked}
        {...sharedProps}
        {...props}
      />
    );

    const allFilesExcludingUnmodified = () =>
      this.props.untrackedFiles.concat(
        this.props.unstagedFiles,
        this.props.stagedFiles
      );

    return (
      <div onContextMenu={event => event.preventDefault()}>
        <CommitBox
          hasFiles={this.props.stagedFiles.length > 0}
          commitFunc={this.commitAllStagedFiles}
        />
        {this.props.settings.composite['simpleStaging'] ? (
          <div>
            <GitStageSimple
              heading={'Changed'}
              files={allFilesExcludingUnmodified()}
              model={this.props.model}
              discardAllFiles={this.discardAllChanges}
              discardFile={this.discardChanges}
              renderMime={this.props.renderMime}
            />
          </div>
        ) : (
          <div>
            <Staged />
            <Changed />
            <Untracked />
          </div>
        )}
      </div>
    );
  }

  /**
   * Does the user have an known git identity.
   *
   * @param path Top repository path
   * @returns Success status
   */
  private async _hasIdentity(path: string): Promise<boolean> {
    // If the repository path changes, check the identity
    if (path !== this._previousTopRepoPath) {
      try {
        const apiResponse = await this.props.model.config();
        if (apiResponse.ok) {
          const options: JSONObject = (await apiResponse.json()).options;
          const keys = Object.keys(options);
          // If the user name or email is unknown, ask the user to set it.
          if (keys.indexOf('user.name') < 0 || keys.indexOf('user.email') < 0) {
            let result = await showDialog({
              title: 'Who is committing?',
              body: new GitAuthorForm()
            });
            if (!result.button.accept) {
              console.log('User refuses to set his identity.');
              return false;
            }
            const identity = result.value;
            const response = await this.props.model.config({
              'user.name': identity.name,
              'user.email': identity.email
            });

            if (!response.ok) {
              console.log(await response.text());
              return false;
            }
          }
          this._previousTopRepoPath = path;
        }
      } catch (error) {
        throw new Error('Fail to set your identity. ' + error.message);
      }
    }

    return Promise.resolve(true);
  }

  private _previousTopRepoPath: string = null;
}
