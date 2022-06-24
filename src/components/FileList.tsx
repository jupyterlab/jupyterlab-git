import { Dialog, showDialog, showErrorMessage } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { CommandRegistry } from '@lumino/commands';
import { Menu } from '@lumino/widgets';
import { TranslationBundle } from '@jupyterlab/translation';
import * as React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ListChildComponentProps } from 'react-window';
import { addMenuItems, CommandArguments } from '../commandsAndMenu';
import { getDiffProvider, GitExtension } from '../model';
import { hiddenButtonStyle } from '../style/ActionButtonStyle';
import { fileListWrapperClass } from '../style/FileListStyle';
import {
  addIcon,
  diffIcon,
  discardIcon,
  openIcon,
  removeIcon
} from '../style/icons';
import { ContextCommandIDs, CommandIDs, Git } from '../tokens';
import { ActionButton } from './ActionButton';
import { FileItem } from './FileItem';
import { GitStage } from './GitStage';
import { discardAllChanges } from '../widgets/discardAllChanges';

export interface IFileListState {
  selectedFiles: Git.IStatusFile[];
  lastClickedFile: Git.IStatusFile | null;
  selectedFileStatus: Git.Status | null;
}

export interface IFileListProps {
  /**
   * Modified files
   */
  files: Git.IStatusFile[];
  /**
   * Git extension model
   */
  model: GitExtension;
  /**
   * Jupyter App commands registry
   */
  commands: CommandRegistry;
  /**
   * Extension settings
   */
  settings: ISettingRegistry.ISettings;
  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

export type ContextCommands = Record<Git.Status, ContextCommandIDs[]>;

export const CONTEXT_COMMANDS: ContextCommands = {
  'partially-staged': [
    ContextCommandIDs.gitFileOpen,
    ContextCommandIDs.gitFileUnstage,
    ContextCommandIDs.gitFileDiff,
    ContextCommandIDs.gitFileHistory
  ],
  'remote-changed': [ContextCommandIDs.gitFileOpen],
  unstaged: [
    ContextCommandIDs.gitFileOpen,
    ContextCommandIDs.gitFileStage,
    ContextCommandIDs.gitFileDiscard,
    ContextCommandIDs.gitFileDiff,
    ContextCommandIDs.gitFileHistory
  ],
  untracked: [
    ContextCommandIDs.gitFileOpen,
    ContextCommandIDs.gitFileTrack,
    ContextCommandIDs.gitIgnore,
    ContextCommandIDs.gitIgnoreExtension,
    ContextCommandIDs.gitFileDelete
  ],
  staged: [
    ContextCommandIDs.gitFileOpen,
    ContextCommandIDs.gitFileUnstage,
    ContextCommandIDs.gitFileDiff,
    ContextCommandIDs.gitCommitAmendStaged,
    ContextCommandIDs.gitFileHistory
  ],
  unmodified: [ContextCommandIDs.gitFileHistory],
  unmerged: [ContextCommandIDs.gitFileDiff]
};

const SIMPLE_CONTEXT_COMMANDS: ContextCommands = {
  'partially-staged': [
    ContextCommandIDs.gitFileOpen,
    ContextCommandIDs.gitFileDiscard,
    ContextCommandIDs.gitFileDiff,
    ContextCommandIDs.gitFileHistory
  ],
  'remote-changed': [ContextCommandIDs.gitFileOpen],
  staged: [
    ContextCommandIDs.gitFileOpen,
    ContextCommandIDs.gitFileDiscard,
    ContextCommandIDs.gitFileDiff,
    ContextCommandIDs.gitFileHistory
  ],
  unstaged: [
    ContextCommandIDs.gitFileOpen,
    ContextCommandIDs.gitFileDiscard,
    ContextCommandIDs.gitFileDiff,
    ContextCommandIDs.gitFileHistory
  ],
  untracked: [
    ContextCommandIDs.gitFileOpen,
    ContextCommandIDs.gitIgnore,
    ContextCommandIDs.gitIgnoreExtension,
    ContextCommandIDs.gitFileDelete
  ],
  unmodified: [ContextCommandIDs.gitFileHistory],
  unmerged: [ContextCommandIDs.gitFileDiff]
};

/**
 * Compare fileA and fileB.
 * @param fileA
 * @param fileB
 * @returns true if fileA and fileB are equal, otherwise, false.
 */
const filesAreEqual = (fileA: Git.IStatusFile, fileB: Git.IStatusFile) => {
  return (
    fileA.x === fileB.x &&
    fileA.y === fileB.y &&
    fileA.from === fileB.from &&
    fileA.to === fileB.to &&
    fileA.status === fileB.status
  );
};

export class FileList extends React.Component<IFileListProps, IFileListState> {
  constructor(props: IFileListProps) {
    super(props);

    this.state = {
      selectedFiles: [],
      lastClickedFile: null,
      selectedFileStatus: null
    };
  }

  /**
   * Open the context menu on the advanced view
   *
   * @param selectedFile The file on which the context menu is opened
   * @param event The click event
   */
  openContextMenu = (
    selectedFile: Git.IStatusFile,
    event: React.MouseEvent
  ): void => {
    event.preventDefault();
    let selectedFiles: Git.IStatusFile[];
    if (
      !this.state.selectedFiles.some(file => filesAreEqual(file, selectedFile))
    ) {
      this.selectOnlyOneFile(selectedFile);
      selectedFiles = [selectedFile];
    } else {
      selectedFiles = this.state.selectedFiles;
    }
    const selectedFileStatuses: Git.Status[] = selectedFiles.reduce(
      (statuses, file) => {
        if (!statuses.includes(file.status)) {
          statuses.push(file.status);
        }
        return statuses;
      },
      []
    );
    const contextMenu = new Menu({ commands: this.props.commands });

    const contextCommandsForEachFileType: ContextCommandIDs[][] =
      selectedFileStatuses.map(status => CONTEXT_COMMANDS[status]);

    const intersect = (...sets: ContextCommandIDs[][]) => {
      if (sets.length === 0) {
        return [];
      }
      if (sets.length === 1) {
        return sets[0];
      }
      const res: ContextCommandIDs[] = [];
      const smallestSetIdx = sets.reduce(
        (smallestIdx, set, currentIdx, sets) => {
          if (set.length < sets[smallestIdx].length) {
            return currentIdx;
          }
          return smallestIdx;
        },
        0
      );
      const smallestSet = sets[smallestSetIdx];
      for (const command of smallestSet) {
        if (sets.every(set => set.includes(command))) {
          res.push(command);
        }
      }
      return res;
    };
    const commands = intersect(...contextCommandsForEachFileType);
    addMenuItems(commands, contextMenu, selectedFiles);

    contextMenu.open(event.clientX, event.clientY);
  };

  /**
   * Open the context menu on the simple view
   *
   * @param selectedFile The file on which the context menu is opened
   * @param event The click event
   */
  openSimpleContextMenu = (
    selectedFile: Git.IStatusFile,
    event: React.MouseEvent
  ): void => {
    event.preventDefault();

    const contextMenu = new Menu({ commands: this.props.commands });
    const commands = SIMPLE_CONTEXT_COMMANDS[selectedFile.status];
    addMenuItems(commands, contextMenu, [selectedFile]);
    contextMenu.open(event.clientX, event.clientY);
  };

  /** Reset all staged files */
  resetAllStagedFiles = async (event: React.MouseEvent): Promise<void> => {
    event.stopPropagation();
    await this.props.model.reset();
  };

  /** Reset staged selected files */
  resetSelectedFiles = (file: Git.IStatusFile): void => {
    if (
      this.state.selectedFiles.some(fileStatus =>
        filesAreEqual(fileStatus, file)
      )
    ) {
      this.state.selectedFiles.forEach(file => this.props.model.reset(file.to));
    } else {
      this.props.model.reset(file.to);
    }
  };

  /** If the clicked file is selected, open all selected files.
   * If the clicked file is not selected, open the clicked file only.
   */
  openSelectedFiles = (clikedFile: Git.IStatusFile): void => {
    if (
      this.state.selectedFiles.some(fileStatus =>
        filesAreEqual(fileStatus, clikedFile)
      )
    ) {
      this.props.commands.execute(ContextCommandIDs.gitFileOpen, {
        files: this.state.selectedFiles
      } as CommandArguments.IGitContextAction as any);
    } else {
      this.props.commands.execute(ContextCommandIDs.gitFileOpen, {
        files: [clikedFile]
      } as CommandArguments.IGitContextAction as any);
    }
  };

  /** Add all unstaged files */
  addAllUnstagedFiles = async (event: React.MouseEvent): Promise<void> => {
    event.stopPropagation();

    await this.props.model.addAllUnstaged();
  };

  /** Discard changes in all unstaged files */
  discardAllUnstagedFiles = async (event: React.MouseEvent): Promise<void> => {
    event.stopPropagation();

    const result = await showDialog({
      title: this.props.trans.__('Discard all changes'),
      body: this.props.trans.__(
        'Are you sure you want to permanently discard changes to all unstaged files? This action cannot be undone.'
      ),
      buttons: [
        Dialog.cancelButton({ label: this.props.trans.__('Cancel') }),
        Dialog.warnButton({ label: this.props.trans.__('Discard') })
      ]
    });
    if (result.button.accept) {
      try {
        await this.props.model.checkout();
      } catch (reason) {
        showErrorMessage(
          this.props.trans.__('Discard all unstaged changes failed.'),
          reason
        );
      }
    }
  };

  /** Discard changes in all unstaged and staged files */
  discardAllChanges = async (event: React.MouseEvent): Promise<void> => {
    event.stopPropagation();
    await discardAllChanges(this.props.model, this.props.trans);
  };

  /** Add a specific unstaged file */
  addFile = async (...file: string[]): Promise<void> => {
    await this.props.model.add(...file);
  };

  /** Discard changes in a specific unstaged or staged file */
  discardChanges = (files: Git.IStatusFile[]): void => {
    files.forEach(async file => {
      await this.props.commands.execute(ContextCommandIDs.gitFileDiscard, {
        files: [file]
      } as CommandArguments.IGitContextAction as any);
    });
  };

  /** Add all untracked files */
  addAllUntrackedFiles = async (event: React.MouseEvent): Promise<void> => {
    event.stopPropagation();
    await this.props.model.addAllUntracked();
  };

  addAllMarkedFiles = async (): Promise<void> => {
    await this.addFile(...this.markedFiles.map(file => file.to));
  };

  selectOnlyOneFile = (file: Git.IStatusFile): void => {
    this.setState({
      selectedFiles: [file],
      lastClickedFile: file,
      selectedFileStatus: file.status
    });
  };

  toggleFile = (file: Git.IStatusFile): void => {
    if (file.status !== this.state.selectedFileStatus) {
      this.selectOnlyOneFile(file);
      return;
    }

    const fileStatus = this.state.selectedFiles.find(fileStatus =>
      filesAreEqual(fileStatus, file)
    );
    if (!fileStatus) {
      this.setState({
        selectedFiles: [...this.state.selectedFiles, file],
        lastClickedFile: file
      });
    } else {
      this.setState({
        selectedFiles: this.state.selectedFiles.filter(
          fileStatus => !filesAreEqual(fileStatus, file)
        ),
        lastClickedFile: file
      });
    }
  };

  removeDuplicateSelectedFiles = (): void => {
    const selectedFiles = this.state.selectedFiles.filter(
      (file, index, arr) => index === arr.findIndex(f => filesAreEqual(f, file))
    );
    this.setState({ selectedFiles });
  };

  selectFiles = (files: Git.IStatusFile[]): void => {
    this.setState(
      {
        selectedFiles: [...this.state.selectedFiles, ...files]
      },
      () => this.removeDuplicateSelectedFiles()
    );
  };

  handleShiftClick = (file: Git.IStatusFile): void => {
    if (
      !this.state.lastClickedFile ||
      file.status !== this.state.selectedFileStatus
    ) {
      this.selectOnlyOneFile(file);
      return;
    }
    const statusesInOrder: Git.Status[] = [
      'unmerged',
      'remote-changed',
      'staged',
      'unstaged',
      'untracked'
    ];
    const partiallyStagedFiles = this.props.files.filter(
      file => file.status === 'partially-staged'
    );

    // files that are not partially staged
    const filesSortedByStatus: Git.IStatusFile[] = this.props.files.filter(
      file => file.status !== 'partially-staged'
    );
    // add partially staged files to the array as two item (staged and unstaged)
    partiallyStagedFiles.forEach(partiallyStagedFile => {
      filesSortedByStatus.push({
        ...partiallyStagedFile,
        status: 'staged'
      });
      filesSortedByStatus.push({
        ...partiallyStagedFile,
        status: 'unstaged'
      });
    });

    // sort the array by file status then by filename
    filesSortedByStatus.sort((a, b) => {
      if (a.status !== b.status) {
        return (
          statusesInOrder.indexOf(a.status) - statusesInOrder.indexOf(b.status)
        );
      } else {
        return a.to.localeCompare(b.to);
      }
    });

    const lastClickedFileIndex = filesSortedByStatus.findIndex(fileStatus =>
      filesAreEqual(fileStatus, this.state.lastClickedFile)
    );
    const currentFileIndex = filesSortedByStatus.findIndex(fileStatus =>
      filesAreEqual(fileStatus, file)
    );

    if (currentFileIndex > lastClickedFileIndex) {
      this.selectFiles(
        filesSortedByStatus.slice(lastClickedFileIndex, currentFileIndex + 1)
      );
    } else {
      this.selectFiles(
        filesSortedByStatus.slice(currentFileIndex, lastClickedFileIndex + 1)
      );
    }
  };

  pullFromRemote = async (event: React.MouseEvent): Promise<void> => {
    await this.props.commands.execute(CommandIDs.gitPull, {});
  };

  get markedFiles(): Git.IStatusFile[] {
    return this.props.files.filter(file => this.props.model.getMark(file.to));
  }

  /**
   * Render the modified files
   */
  render(): JSX.Element {
    const remoteChangedFiles: Git.IStatusFile[] = [];
    const unmergedFiles: Git.IStatusFile[] = [];
    console.log(this.state);
    if (this.props.settings.composite['simpleStaging']) {
      const otherFiles: Git.IStatusFile[] = [];

      this.props.files.forEach(file => {
        switch (file.status) {
          case 'remote-changed':
            remoteChangedFiles.push(file);
            break;
          case 'unmerged':
            unmergedFiles.push(file);
            break;
          default:
            otherFiles.push(file);
            break;
        }
      });

      return (
        <div className={fileListWrapperClass}>
          <AutoSizer disableWidth={true}>
            {({ height }) => (
              <>
                {this._renderUnmerged(unmergedFiles, height, false)}
                {this._renderRemoteChanged(remoteChangedFiles, height)}
                {this._renderSimpleStage(otherFiles, height)}
              </>
            )}
          </AutoSizer>
        </div>
      );
    } else {
      const stagedFiles: Git.IStatusFile[] = [];
      const unstagedFiles: Git.IStatusFile[] = [];
      const untrackedFiles: Git.IStatusFile[] = [];

      this.props.files.forEach(file => {
        switch (file.status) {
          case 'staged':
            stagedFiles.push(file);
            break;
          case 'unstaged':
            unstagedFiles.push(file);
            break;
          case 'untracked':
            untrackedFiles.push(file);
            break;
          case 'partially-staged':
            stagedFiles.push({
              ...file,
              status: 'staged'
            });
            unstagedFiles.push({
              ...file,
              status: 'unstaged'
            });
            break;
          case 'unmerged':
            unmergedFiles.push(file);
            break;
          case 'remote-changed':
            remoteChangedFiles.push(file);
            break;
          default:
            break;
        }
      });

      return (
        <div
          className={fileListWrapperClass}
          onContextMenu={event => event.preventDefault()}
        >
          <AutoSizer disableWidth={true}>
            {({ height }) => (
              <>
                {this._renderUnmerged(unmergedFiles, height)}
                {this._renderRemoteChanged(remoteChangedFiles, height)}
                {this._renderStaged(stagedFiles, height)}
                {this._renderChanged(unstagedFiles, height)}
                {this._renderUntracked(untrackedFiles, height)}
              </>
            )}
          </AutoSizer>
        </div>
      );
    }
  }

  /**
   * Test if a file is selected
   * @param candidate file to test
   */
  private _isSelectedFile(candidate: Git.IStatusFile): boolean {
    if (this.state.selectedFiles === null) {
      return false;
    }

    return this.state.selectedFiles.some(
      file =>
        file.x === candidate.x &&
        file.y === candidate.y &&
        file.from === candidate.from &&
        file.to === candidate.to &&
        file.status === candidate.status
    );
  }

  /**
   * Render an unmerged file
   *
   * Note: This is actually a React.FunctionComponent but defined as
   * a private method as it needs access to FileList properties.
   *
   * @param rowProps Row properties
   */
  private _renderUnmergedRow = (
    rowProps: ListChildComponentProps
  ): JSX.Element => {
    const { data, index, style } = rowProps;
    const file = data[index] as Git.IStatusFile;
    const diffButton = this._createDiffButton(file);
    return (
      <FileItem
        trans={this.props.trans}
        actions={!file.is_binary && diffButton}
        contextMenu={this.openContextMenu}
        file={file}
        model={this.props.model}
        selected={this._isSelectedFile(file)}
        toggleFile={this.toggleFile}
        handleShiftClick={this.handleShiftClick}
        selectOnlyOneFile={this.selectOnlyOneFile}
        onDoubleClick={() => this._openDiffViews([file])}
        style={{ ...style }}
      />
    );
  };

  private _renderUnmerged(
    files: Git.IStatusFile[],
    height: number,
    collapsible = true
  ) {
    // Hide section if no merge conflicts are present
    return files.length > 0 ? (
      <GitStage
        collapsible={collapsible}
        files={files}
        heading={this.props.trans.__('Conflicted')}
        height={height}
        rowRenderer={this._renderUnmergedRow}
      />
    ) : null;
  }

  /**
   * Render a staged file
   *
   * Note: This is actually a React.FunctionComponent but defined as
   * a private method as it needs access to FileList properties.
   *
   * @param rowProps Row properties
   */
  private _renderStagedRow = (
    rowProps: ListChildComponentProps
  ): JSX.Element => {
    const doubleClickDiff = this.props.settings.get('doubleClickDiff')
      .composite as boolean;
    const { data, index, style } = rowProps;
    const file = data[index] as Git.IStatusFile;
    const diffButton = this._createDiffButton(file);
    return (
      <FileItem
        trans={this.props.trans}
        actions={
          <React.Fragment>
            <ActionButton
              className={hiddenButtonStyle}
              icon={openIcon}
              title={this.props.trans.__('Open this file')}
              onClick={() => this.openSelectedFiles(file)}
            />
            {diffButton}
            <ActionButton
              className={hiddenButtonStyle}
              icon={removeIcon}
              title={this.props.trans.__('Unstage this change')}
              onClick={() => {
                this.resetSelectedFiles(file);
              }}
            />
          </React.Fragment>
        }
        file={file}
        contextMenu={this.openContextMenu}
        model={this.props.model}
        selected={this._isSelectedFile(file)}
        toggleFile={this.toggleFile}
        handleShiftClick={this.handleShiftClick}
        selectOnlyOneFile={this.selectOnlyOneFile}
        onDoubleClick={
          doubleClickDiff
            ? diffButton
              ? () => this._openDiffViews([file])
              : () => undefined
            : () => this.openSelectedFiles(file)
        }
        style={style}
      />
    );
  };

  /**
   * Render the staged files list.
   *
   * @param files The staged files
   * @param height The height of the HTML element
   */
  private _renderStaged(files: Git.IStatusFile[], height: number) {
    return (
      <GitStage
        actions={
          <ActionButton
            className={hiddenButtonStyle}
            disabled={files.length === 0}
            icon={removeIcon}
            title={this.props.trans.__('Unstage all changes')}
            onClick={this.resetAllStagedFiles}
          />
        }
        collapsible
        files={files}
        heading={this.props.trans.__('Staged')}
        height={height}
        rowRenderer={this._renderStagedRow}
      />
    );
  }

  /**
   * Render a changed file
   *
   * Note: This is actually a React.FunctionComponent but defined as
   * a private method as it needs access to FileList properties.
   *
   * @param rowProps Row properties
   */
  private _renderChangedRow = (
    rowProps: ListChildComponentProps
  ): JSX.Element => {
    const doubleClickDiff = this.props.settings.get('doubleClickDiff')
      .composite as boolean;
    const { data, index, style } = rowProps;
    const file = data[index] as Git.IStatusFile;
    const diffButton = this._createDiffButton(file);
    return (
      <FileItem
        trans={this.props.trans}
        actions={
          <React.Fragment>
            <ActionButton
              className={hiddenButtonStyle}
              icon={openIcon}
              title={this.props.trans.__('Open this file')}
              onClick={() => this.openSelectedFiles(file)}
            />
            {diffButton}
            <ActionButton
              className={hiddenButtonStyle}
              icon={discardIcon}
              title={this.props.trans.__('Discard changes')}
              onClick={() => {
                this.discardChanges(this.state.selectedFiles);
              }}
            />
            <ActionButton
              className={hiddenButtonStyle}
              icon={addIcon}
              title={this.props.trans.__('Stage this change')}
              onClick={() => {
                this.addFile(...this.state.selectedFiles.map(file => file.to));
              }}
            />
          </React.Fragment>
        }
        file={file}
        contextMenu={this.openContextMenu}
        model={this.props.model}
        selected={this._isSelectedFile(file)}
        toggleFile={this.toggleFile}
        handleShiftClick={this.handleShiftClick}
        selectOnlyOneFile={this.selectOnlyOneFile}
        onDoubleClick={
          doubleClickDiff
            ? diffButton
              ? () => this._openDiffViews([file])
              : () => undefined
            : () => this.openSelectedFiles(file)
        }
        style={style}
      />
    );
  };

  /**
   * Render the changed files list
   *
   * @param files Changed files
   * @param height Height of the HTML element
   */
  private _renderChanged(files: Git.IStatusFile[], height: number) {
    const disabled = files.length === 0;
    return (
      <GitStage
        actions={
          <React.Fragment>
            <ActionButton
              className={hiddenButtonStyle}
              disabled={disabled}
              icon={discardIcon}
              title={this.props.trans.__('Discard All Changes')}
              onClick={this.discardAllUnstagedFiles}
            />
            <ActionButton
              className={hiddenButtonStyle}
              disabled={disabled}
              icon={addIcon}
              title={this.props.trans.__('Stage all changes')}
              onClick={this.addAllUnstagedFiles}
            />
          </React.Fragment>
        }
        collapsible
        heading={this.props.trans.__('Changed')}
        height={height}
        files={files}
        rowRenderer={this._renderChangedRow}
      />
    );
  }

  /**
   * Render a untracked file.
   *
   * Note: This is actually a React.FunctionComponent but defined as
   * a private method as it needs access to FileList properties.
   *
   * @param rowProps Row properties
   */
  private _renderUntrackedRow = (
    rowProps: ListChildComponentProps
  ): JSX.Element => {
    const doubleClickDiff = this.props.settings.get('doubleClickDiff')
      .composite as boolean;
    const { data, index, style } = rowProps;
    const file = data[index] as Git.IStatusFile;
    return (
      <FileItem
        trans={this.props.trans}
        actions={
          <React.Fragment>
            <ActionButton
              className={hiddenButtonStyle}
              icon={openIcon}
              title={this.props.trans.__('Open this file')}
              onClick={() => this.openSelectedFiles(file)}
            />
            <ActionButton
              className={hiddenButtonStyle}
              icon={addIcon}
              title={this.props.trans.__('Track this file')}
              onClick={() => {
                this.addFile(...this.state.selectedFiles.map(file => file.to));
              }}
            />
          </React.Fragment>
        }
        file={file}
        contextMenu={this.openContextMenu}
        model={this.props.model}
        onDoubleClick={() => {
          if (!doubleClickDiff) {
            this.props.commands.execute(ContextCommandIDs.gitFileOpen, {
              files: [file]
            } as CommandArguments.IGitContextAction as any);
          }
        }}
        selected={this._isSelectedFile(file)}
        toggleFile={this.toggleFile}
        handleShiftClick={this.handleShiftClick}
        selectOnlyOneFile={this.selectOnlyOneFile}
        style={style}
      />
    );
  };

  /**
   * Render the untracked files list.
   *
   * @param files Untracked files
   * @param height Height of the HTML element
   */
  private _renderUntracked(files: Git.IStatusFile[], height: number) {
    return (
      <GitStage
        actions={
          <ActionButton
            className={hiddenButtonStyle}
            disabled={files.length === 0}
            icon={addIcon}
            title={this.props.trans.__('Track all untracked files')}
            onClick={this.addAllUntrackedFiles}
          />
        }
        collapsible
        heading={this.props.trans.__('Untracked')}
        height={height}
        files={files}
        rowRenderer={this._renderUntrackedRow}
      />
    );
  }

  /**
   * Render the remote changed list.
   *
   * Note: This is actually a React.FunctionComponent but defined as
   * a private method as it needs access to FileList properties.
   *
   * @param rowProps Row properties
   */
  private _renderRemoteChangedRow = (
    rowProps: ListChildComponentProps
  ): JSX.Element => {
    const doubleClickDiff = this.props.settings.get('doubleClickDiff')
      .composite as boolean;
    const { data, index, style } = rowProps;
    const file = data[index] as Git.IStatusFile;
    return (
      <FileItem
        trans={this.props.trans}
        actions={
          <React.Fragment>
            <ActionButton
              className={hiddenButtonStyle}
              icon={openIcon}
              title={this.props.trans.__('Open this file')}
              onClick={() => this.openSelectedFiles(file)}
            />
          </React.Fragment>
        }
        file={file}
        contextMenu={this.openContextMenu}
        model={this.props.model}
        onDoubleClick={() => {
          if (!doubleClickDiff) {
            this.props.commands.execute(ContextCommandIDs.gitFileOpen, {
              files: [file]
            } as CommandArguments.IGitContextAction as any);
          }
        }}
        selected={this._isSelectedFile(file)}
        toggleFile={this.toggleFile}
        handleShiftClick={this.handleShiftClick}
        selectOnlyOneFile={this.selectOnlyOneFile}
        style={style}
      />
    );
  };

  /**
   * Render the a file that has changed on remote to files list.
   *
   * @param files Untracked files
   * @param height Height of the HTML element
   */
  private _renderRemoteChanged(files: Git.IStatusFile[], height: number) {
    return (
      files.length > 0 && (
        <GitStage
          actions={
            <ActionButton
              className={hiddenButtonStyle}
              disabled={files.length === 0}
              icon={addIcon}
              title={this.props.trans.__('Pull from remote branch')}
              onClick={this.pullFromRemote}
            />
          }
          collapsible
          heading={this.props.trans.__('Remote Changes')}
          height={height}
          files={files}
          rowRenderer={this._renderRemoteChangedRow}
        />
      )
    );
  }

  /**
   * Render a modified file in simple mode.
   *
   * Note: This is actually a React.FunctionComponent but defined as
   * a private method as it needs access to FileList properties.
   *
   * @param rowProps Row properties
   */
  private _renderSimpleStageRow = (rowProps: ListChildComponentProps) => {
    const { data, index, style } = rowProps;
    const file = data[index] as Git.IStatusFile;
    const doubleClickDiff = this.props.settings.get('doubleClickDiff')
      .composite as boolean;

    const openFile = () => {
      this.props.commands.execute(ContextCommandIDs.gitFileOpen, {
        files: [file]
      } as CommandArguments.IGitContextAction as any);
    };

    // Default value for actions and double click
    let actions: JSX.Element = (
      <ActionButton
        className={hiddenButtonStyle}
        icon={openIcon}
        title={this.props.trans.__('Open this file')}
        onClick={openFile}
      />
    );
    let onDoubleClick = doubleClickDiff ? (): void => undefined : openFile;

    if (file.status === 'unstaged' || file.status === 'partially-staged') {
      const diffButton = this._createDiffButton(file);
      actions = (
        <React.Fragment>
          <ActionButton
            className={hiddenButtonStyle}
            icon={openIcon}
            title={this.props.trans.__('Open this file')}
            onClick={openFile}
          />
          {diffButton}
          <ActionButton
            className={hiddenButtonStyle}
            icon={discardIcon}
            title={this.props.trans.__('Discard changes')}
            onClick={() => {
              this.discardChanges([file]);
            }}
          />
        </React.Fragment>
      );
      onDoubleClick = doubleClickDiff
        ? diffButton
          ? () => this._openDiffViews([file])
          : () => undefined
        : openFile;
    } else if (file.status === 'staged') {
      const diffButton = this._createDiffButton(file);
      actions = (
        <React.Fragment>
          <ActionButton
            className={hiddenButtonStyle}
            icon={openIcon}
            title={this.props.trans.__('Open this file')}
            onClick={openFile}
          />
          {diffButton}
          <ActionButton
            className={hiddenButtonStyle}
            icon={discardIcon}
            title={this.props.trans.__('Discard changes')}
            onClick={() => {
              this.discardChanges([file]);
            }}
          />
        </React.Fragment>
      );
      onDoubleClick = doubleClickDiff
        ? diffButton
          ? () => this._openDiffViews([file])
          : () => undefined
        : openFile;
    }

    return (
      <FileItem
        trans={this.props.trans}
        actions={actions}
        file={file}
        markBox={true}
        model={this.props.model}
        onDoubleClick={onDoubleClick}
        contextMenu={this.openSimpleContextMenu}
        toggleFile={this.toggleFile}
        handleShiftClick={this.handleShiftClick}
        selectOnlyOneFile={this.selectOnlyOneFile}
        style={style}
      />
    );
  };

  /**
   * Render the modified files in simple mode.
   *
   * @param files Modified files
   * @param height Height of the HTML element
   */
  private _renderSimpleStage(files: Git.IStatusFile[], height: number) {
    return (
      <GitStage
        actions={
          <ActionButton
            className={hiddenButtonStyle}
            disabled={files.length === 0}
            icon={discardIcon}
            title={this.props.trans.__('Discard All Changes')}
            onClick={this.discardAllChanges}
          />
        }
        heading={this.props.trans.__('Changed')}
        height={height}
        files={files}
        rowRenderer={this._renderSimpleStageRow}
      />
    );
  }

  /**
   * Creates a button element which, depending on the settings, is used
   * to either request a diff of the file, or open the file
   *
   * @param path File path of interest
   * @param currentRef the ref to diff against the git 'HEAD' ref
   */
  private _createDiffButton(file: Git.IStatusFile): JSX.Element {
    let handleClick: () => void;
    if (this.props.settings.composite['simpleStaging']) {
      handleClick = () => this._openDiffViews([file]);
    } else {
      handleClick = () => {
        if (
          this.state.selectedFiles.some(fileStatus =>
            filesAreEqual(fileStatus, file)
          )
        ) {
          this._openDiffViews(this.state.selectedFiles);
        } else {
          this._openDiffViews([file]);
        }
      };
    }
    return (
      (getDiffProvider(file.to) || !file.is_binary) && (
        <ActionButton
          className={hiddenButtonStyle}
          icon={diffIcon}
          title={this.props.trans.__('Diff this file')}
          onClick={handleClick} // created bug for simple staging
        />
      )
    );
  }

  /**
   * Returns a callback which opens a diff of the file
   *
   * @param file File to open diff for
   * @param currentRef the ref to diff against the git 'HEAD' ref
   */
  private _openDiffViews(files: Git.IStatusFile[]): void {
    files.forEach(file => {
      try {
        this.props.commands.execute(ContextCommandIDs.gitFileDiff, {
          files: [
            {
              filePath: file.to,
              isText: !file.is_binary,
              status: file.status
            }
          ]
        } as CommandArguments.IGitFileDiff as any);
      } catch (reason) {
        console.error(`Failed to open diff view for ${file.to}.\n${reason}`);
      }
    });
  }
}
