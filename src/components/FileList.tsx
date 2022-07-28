import { Dialog, showDialog, showErrorMessage } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { CommandRegistry } from '@lumino/commands';
import { Menu } from '@lumino/widgets';
import { Signal } from '@lumino/signaling';
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
import { SelectAllButton } from './SelectAllButton';

export interface IFileListState {
  selectedFiles: Git.IStatusFile[];
  lastClickedFile: Git.IStatusFile | null;
  markedFiles: Git.IStatusFile[];
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
const areFilesEqual = (fileA: Git.IStatusFile, fileB: Git.IStatusFile) => {
  return (
    fileA.x === fileB.x &&
    fileA.y === fileB.y &&
    fileA.from === fileB.from &&
    fileA.to === fileB.to &&
    fileA.status === fileB.status
  );
};

/**
 * Wrap mouse event handler to stop event propagation
 * @param fn Mouse event handler
 * @returns Mouse event handler that stops event from propagating
 */
const stopPropagationWrapper =
  (
    fn: React.EventHandler<React.MouseEvent>
  ): React.EventHandler<React.MouseEvent> =>
  (event: React.MouseEvent) => {
    event.stopPropagation();
    fn(event);
  };

export class FileList extends React.Component<IFileListProps, IFileListState> {
  constructor(props: IFileListProps) {
    super(props);

    this.state = {
      selectedFiles: [],
      lastClickedFile: null,
      markedFiles: props.model.markedFiles
    };
  }

  componentDidMount(): void {
    const { model } = this.props;
    model.markChanged.connect(() => {
      this.setState({ markedFiles: model.markedFiles });
    }, this);
    model.repositoryChanged.connect(() => {
      this.setState({ markedFiles: model.markedFiles });
    }, this);
  }

  componentWillUnmount(): void {
    Signal.clearData(this);
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
    if (!this._isSelectedFile(selectedFile)) {
      this._selectOnlyOneFile(selectedFile);
      selectedFiles = [selectedFile];
    } else {
      selectedFiles = this.state.selectedFiles;
    }

    const contextMenu = new Menu({ commands: this.props.commands });
    const commands = CONTEXT_COMMANDS[selectedFiles[0].status];
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
    if (this._isSelectedFile(file)) {
      this.state.selectedFiles.forEach(file => this.props.model.reset(file.to));
    } else {
      this.props.model.reset(file.to);
    }
  };

  /** If the clicked file is selected, open all selected files.
   * If the clicked file is not selected, open the clicked file only.
   */
  openSelectedFiles = (clickedFile: Git.IStatusFile): void => {
    if (this._isSelectedFile(clickedFile)) {
      this.props.commands.execute(ContextCommandIDs.gitFileOpen, {
        files: this.state.selectedFiles
      } as CommandArguments.IGitContextAction as any);
    } else {
      this.props.commands.execute(ContextCommandIDs.gitFileOpen, {
        files: [clickedFile]
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
  discardChanges = (file: Git.IStatusFile): void => {
    if (this._isSelectedFile(file)) {
      this.props.commands.execute(ContextCommandIDs.gitFileDiscard, {
        files: this.state.selectedFiles
      } as CommandArguments.IGitContextAction as any);
    } else {
      this.props.commands.execute(ContextCommandIDs.gitFileDiscard, {
        files: [file]
      } as CommandArguments.IGitContextAction as any);
    }
  };

  /** Add all untracked files */
  addAllUntrackedFiles = async (event: React.MouseEvent): Promise<void> => {
    event.stopPropagation();
    await this.props.model.addAllUntracked();
  };

  addAllMarkedFiles = async (): Promise<void> => {
    await this.addFile(...this.markedFiles.map(file => file.to));
  };

  /**
   * Select files into state.selectedFiles
   * @param file The current cliced-on file
   * @param options Selection options
   */
  setSelection = (
    file: Git.IStatusFile,
    options?: { singleton?: boolean; group?: boolean }
  ): void => {
    if (options && options.singleton) {
      this._selectOnlyOneFile(file);
    }
    if (options && options.group) {
      this._selectUntilFile(file);
    }
    if (!options) {
      this._toggleFile(file);
    }
  };

  /**
   * Mark files from the latest selected to this one
   *
   * @param file The current clicked-on file
   */
  markUntilFile = (file: Git.IStatusFile): void => {
    if (!this.state.lastClickedFile) {
      this.props.model.setMark(file.to, true);
      return;
    }
    const filesWithMarkBox = this.props.files.filter(
      fileStatus => !['unmerged', 'remote-changed'].includes(fileStatus.status)
    );

    const lastClickedFileIndex = filesWithMarkBox.findIndex(fileStatus =>
      areFilesEqual(fileStatus, this.state.lastClickedFile)
    );
    const currentFileIndex = filesWithMarkBox.findIndex(fileStatus =>
      areFilesEqual(fileStatus, file)
    );

    if (currentFileIndex > lastClickedFileIndex) {
      const filesToAdd = filesWithMarkBox.slice(
        lastClickedFileIndex,
        currentFileIndex + 1
      );
      filesToAdd.forEach(f => this.props.model.setMark(f.to, true));
    } else {
      const filesToAdd = filesWithMarkBox.slice(
        currentFileIndex,
        lastClickedFileIndex + 1
      );
      filesToAdd.forEach(f => this.props.model.setMark(f.to, true));
    }
  };

  /**
   * Set mark status from select-all button
   *
   * @param files Files to toggle
   */
  toggleAllFiles = (files: Git.IStatusFile[]): void => {
    const areFilesAllMarked = this._areFilesAllMarked();
    files.forEach(f => this.props.model.setMark(f.to, !areFilesAllMarked));
  };

  private _selectOnlyOneFile = (file: Git.IStatusFile): void => {
    this.setState({
      selectedFiles: [file],
      lastClickedFile: file
    });
  };

  /**
   * Toggle selection status of a file
   * @param file The clicked file
   */
  private _toggleFile = (file: Git.IStatusFile): void => {
    if (file.status !== this.state.lastClickedFile.status) {
      this._selectOnlyOneFile(file);
      return;
    }

    const fileStatus = this.state.selectedFiles.find(fileStatus =>
      areFilesEqual(fileStatus, file)
    );
    if (!fileStatus) {
      this.setState({
        selectedFiles: [...this.state.selectedFiles, file],
        lastClickedFile: file
      });
    } else {
      this.setState({
        selectedFiles: this.state.selectedFiles.filter(
          fileStatus => !areFilesEqual(fileStatus, file)
        ),
        lastClickedFile: file
      });
    }
  };

  /**
   * Select a list of files
   * @param files List of files to select
   */
  private _selectFiles = (files: Git.IStatusFile[]): void => {
    this.setState(prevState => {
      return {
        selectedFiles: [
          ...prevState.selectedFiles,
          ...files.filter(
            file => !prevState.selectedFiles.some(f => areFilesEqual(f, file))
          )
        ]
      };
    });
  };

  /**
   * Deselect a list of file
   * @param files List of file to deselect
   */
  private _deselectFiles = (files: Git.IStatusFile[]): void => {
    this.setState(prevState => {
      return {
        selectedFiles: prevState.selectedFiles.filter(
          selectedFile => !files.some(file => areFilesEqual(selectedFile, file))
        )
      };
    });
  };

  /**
   * Handle shift-click behaviour for file selection
   * @param file The shift-clicked file
   */
  private _selectUntilFile = (file: Git.IStatusFile): void => {
    if (
      !this.state.lastClickedFile ||
      file.status !== this.state.lastClickedFile.status
    ) {
      this._selectOnlyOneFile(file);
      return;
    }

    const selectedFileStatus = this.state.lastClickedFile.status;
    const allFilesWithSelectedStatus = this.props.files.filter(
      fileStatus => fileStatus.status === selectedFileStatus
    );

    const partiallyStagedFiles = this.props.files.filter(
      fileStatus => fileStatus.status === 'partially-staged'
    );

    switch (selectedFileStatus) {
      case 'staged':
        allFilesWithSelectedStatus.push(
          ...partiallyStagedFiles.map(
            fileStatus =>
              ({
                ...fileStatus,
                status: 'staged'
              } as Git.IStatusFile)
          )
        );
        break;
      case 'unstaged':
        allFilesWithSelectedStatus.push(
          ...partiallyStagedFiles.map(
            fileStatus =>
              ({
                ...fileStatus,
                status: 'unstaged'
              } as Git.IStatusFile)
          )
        );
        break;
    }

    allFilesWithSelectedStatus.sort((a, b) => a.to.localeCompare(b.to));

    const lastClickedFileIndex = allFilesWithSelectedStatus.findIndex(
      fileStatus => areFilesEqual(fileStatus, this.state.lastClickedFile)
    );
    const currentFileIndex = allFilesWithSelectedStatus.findIndex(fileStatus =>
      areFilesEqual(fileStatus, file)
    );

    if (currentFileIndex > lastClickedFileIndex) {
      const highestSelectedIndex = allFilesWithSelectedStatus.findIndex(
        (file, index) =>
          index > lastClickedFileIndex && !this._isSelectedFile(file)
      );
      if (highestSelectedIndex === -1) {
        this._deselectFiles(
          allFilesWithSelectedStatus.slice(currentFileIndex + 1)
        );
      } else if (currentFileIndex < highestSelectedIndex) {
        this._deselectFiles(
          allFilesWithSelectedStatus.slice(
            currentFileIndex + 1,
            highestSelectedIndex
          )
        );
      } else {
        this._selectFiles(
          allFilesWithSelectedStatus.slice(
            highestSelectedIndex,
            currentFileIndex + 1
          )
        );
      }
    } else if (currentFileIndex < lastClickedFileIndex) {
      const lowestSelectedIndex = allFilesWithSelectedStatus.findIndex(
        (file, index) =>
          index < lastClickedFileIndex && this._isSelectedFile(file)
      );
      if (lowestSelectedIndex === -1) {
        this._selectFiles(
          allFilesWithSelectedStatus.slice(
            currentFileIndex,
            lastClickedFileIndex
          )
        );
      } else if (currentFileIndex < lowestSelectedIndex) {
        this._selectFiles(
          allFilesWithSelectedStatus.slice(
            currentFileIndex,
            lowestSelectedIndex
          )
        );
      } else {
        this._deselectFiles(
          allFilesWithSelectedStatus.slice(
            lowestSelectedIndex,
            currentFileIndex
          )
        );
      }
    } else {
      this._selectOnlyOneFile(file);
    }
  };

  pullFromRemote = async (event: React.MouseEvent): Promise<void> => {
    await this.props.commands.execute(CommandIDs.gitPull, {});
  };

  get markedFiles(): Git.IStatusFile[] {
    return this.props.model.markedFiles;
  }

  /**
   * Render the modified files
   */
  render(): JSX.Element {
    const remoteChangedFiles: Git.IStatusFile[] = [];
    const unmergedFiles: Git.IStatusFile[] = [];

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
    return this.state.selectedFiles.some(file =>
      areFilesEqual(file, candidate)
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
        setSelection={this.setSelection}
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
              onClick={stopPropagationWrapper(() =>
                this.openSelectedFiles(file)
              )}
            />
            {diffButton}
            <ActionButton
              className={hiddenButtonStyle}
              icon={removeIcon}
              title={this.props.trans.__('Unstage this change')}
              onClick={stopPropagationWrapper(() => {
                this.resetSelectedFiles(file);
              })}
            />
          </React.Fragment>
        }
        file={file}
        contextMenu={this.openContextMenu}
        model={this.props.model}
        selected={this._isSelectedFile(file)}
        setSelection={this.setSelection}
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
              onClick={stopPropagationWrapper(() =>
                this.openSelectedFiles(file)
              )}
            />
            {diffButton}
            <ActionButton
              className={hiddenButtonStyle}
              icon={discardIcon}
              title={this.props.trans.__('Discard changes')}
              onClick={stopPropagationWrapper(() => {
                this.discardChanges(file);
              })}
            />
            <ActionButton
              className={hiddenButtonStyle}
              icon={addIcon}
              title={this.props.trans.__('Stage this change')}
              onClick={stopPropagationWrapper(() => {
                if (this._isSelectedFile(file)) {
                  this.addFile(
                    ...this.state.selectedFiles.map(
                      selectedFile => selectedFile.to
                    )
                  );
                } else {
                  this.addFile(file.to);
                }
              })}
            />
          </React.Fragment>
        }
        file={file}
        contextMenu={this.openContextMenu}
        model={this.props.model}
        selected={this._isSelectedFile(file)}
        setSelection={this.setSelection}
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
              onClick={stopPropagationWrapper(() =>
                this.openSelectedFiles(file)
              )}
            />
            <ActionButton
              className={hiddenButtonStyle}
              icon={addIcon}
              title={this.props.trans.__('Track this file')}
              onClick={stopPropagationWrapper(() => {
                if (this._isSelectedFile(file)) {
                  this.addFile(
                    ...this.state.selectedFiles.map(
                      selectedFile => selectedFile.to
                    )
                  );
                } else {
                  this.addFile(file.to);
                }
              })}
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
        setSelection={this.setSelection}
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
              onClick={stopPropagationWrapper(() =>
                this.openSelectedFiles(file)
              )}
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
        setSelection={this.setSelection}
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

    const openFile = (): void => {
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
        onClick={stopPropagationWrapper(openFile)}
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
            onClick={stopPropagationWrapper(openFile)}
          />
          {diffButton}
          <ActionButton
            className={hiddenButtonStyle}
            icon={discardIcon}
            title={this.props.trans.__('Discard changes')}
            onClick={stopPropagationWrapper(() => {
              this.discardChanges(file);
            })}
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
            onClick={stopPropagationWrapper(openFile)}
          />
          {diffButton}
          <ActionButton
            className={hiddenButtonStyle}
            icon={discardIcon}
            title={this.props.trans.__('Discard changes')}
            onClick={stopPropagationWrapper(() => {
              this.discardChanges(file);
            })}
          />
        </React.Fragment>
      );
      onDoubleClick = doubleClickDiff
        ? diffButton
          ? () => this._openDiffViews([file])
          : () => undefined
        : openFile;
    }

    const checked = this.markedFiles.some(fileStatus =>
      areFilesEqual(fileStatus, file)
    );
    return (
      <FileItem
        trans={this.props.trans}
        actions={actions}
        file={file}
        markBox={true}
        model={this.props.model}
        onDoubleClick={onDoubleClick}
        contextMenu={this.openSimpleContextMenu}
        setSelection={this.setSelection}
        style={style}
        markUntilFile={this.markUntilFile}
        checked={checked}
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
        selectAllButton={
          <SelectAllButton
            onChange={() => {
              this.toggleAllFiles(files);
            }}
            checked={this._areFilesAllMarked()}
          />
        }
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
        if (this._isSelectedFile(file)) {
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
          onClick={stopPropagationWrapper(handleClick)}
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
  private async _openDiffViews(files: Git.IStatusFile[]): Promise<void> {
    try {
      await this.props.commands.execute(ContextCommandIDs.gitFileDiff, {
        files: files.map(file => ({
          filePath: file.to,
          isText: !file.is_binary,
          status: file.status
        }))
      } as CommandArguments.IGitFileDiff as any);
    } catch (reason) {
      console.error(`Failed to open diff views.\n${reason}`);
    }
  }

  /**
   * Determine if files in simple staging are all marked
   * @returns True if files are all marked
   */
  private _areFilesAllMarked(): boolean {
    const filesForSimpleStaging = this.props.files.filter(
      file => !['unmerged', 'remote-changed'].includes(file.status)
    );
    return (
      filesForSimpleStaging.length !== 0 &&
      filesForSimpleStaging.every(file =>
        this.state.markedFiles.some(mf => areFilesEqual(file, mf))
      )
    );
  }
}
