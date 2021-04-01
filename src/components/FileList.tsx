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
import { ContextCommandIDs, Git } from '../tokens';
import { ActionButton } from './ActionButton';
import { FileItem } from './FileItem';
import { GitStage } from './GitStage';

export interface IFileListState {
  selectedFile: Git.IStatusFile | null;
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
    ContextCommandIDs.gitFileDiff
  ],
  unstaged: [
    ContextCommandIDs.gitFileOpen,
    ContextCommandIDs.gitFileStage,
    ContextCommandIDs.gitFileDiscard,
    ContextCommandIDs.gitFileDiff
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
    ContextCommandIDs.gitFileDiff
  ]
};

const SIMPLE_CONTEXT_COMMANDS: ContextCommands = {
  'partially-staged': [
    ContextCommandIDs.gitFileOpen,
    ContextCommandIDs.gitFileDiscard,
    ContextCommandIDs.gitFileDiff
  ],
  staged: [
    ContextCommandIDs.gitFileOpen,
    ContextCommandIDs.gitFileDiscard,
    ContextCommandIDs.gitFileDiff
  ],
  unstaged: [
    ContextCommandIDs.gitFileOpen,
    ContextCommandIDs.gitFileDiscard,
    ContextCommandIDs.gitFileDiff
  ],
  untracked: [
    ContextCommandIDs.gitFileOpen,
    ContextCommandIDs.gitIgnore,
    ContextCommandIDs.gitIgnoreExtension,
    ContextCommandIDs.gitFileDelete
  ]
};

export class FileList extends React.Component<IFileListProps, IFileListState> {
  constructor(props: IFileListProps) {
    super(props);

    this.state = {
      selectedFile: null
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

    this.setState({
      selectedFile
    });

    const contextMenu = new Menu({ commands: this.props.commands });
    const commands = CONTEXT_COMMANDS[selectedFile.status];
    addMenuItems(commands, contextMenu, [selectedFile]);

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

  /** Reset a specific staged file */
  resetStagedFile = async (file: string): Promise<void> => {
    await this.props.model.reset(file);
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
        'Are you sure you want to permanently discard changes to all files? This action cannot be undone.'
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
    const result = await showDialog({
      title: this.props.trans.__('Discard all changes'),
      body: this.props.trans.__(
        'Are you sure you want to permanently discard changes to all files? This action cannot be undone.'
      ),
      buttons: [
        Dialog.cancelButton({ label: this.props.trans.__('Cancel') }),
        Dialog.warnButton({ label: this.props.trans.__('Discard') })
      ]
    });
    if (result.button.accept) {
      try {
        await this.props.model.resetToCommit();
      } catch (reason) {
        showErrorMessage(
          this.props.trans.__('Discard all changes failed.'),
          reason
        );
      }
    }
  };

  /** Add a specific unstaged file */
  addFile = async (...file: string[]): Promise<void> => {
    await this.props.model.add(...file);
  };

  /** Discard changes in a specific unstaged or staged file */
  discardChanges = async (file: Git.IStatusFile): Promise<void> => {
    await this.props.commands.execute(ContextCommandIDs.gitFileDiscard, ({
      files: [file]
    } as CommandArguments.IGitContextAction) as any);
  };

  /** Add all untracked files */
  addAllUntrackedFiles = async (event: React.MouseEvent): Promise<void> => {
    event.stopPropagation();
    await this.props.model.addAllUntracked();
  };

  addAllMarkedFiles = async (): Promise<void> => {
    await this.addFile(...this.markedFiles.map(file => file.to));
  };

  updateSelectedFile = (file: Git.IStatusFile | null): void => {
    this.setState({ selectedFile: file });
  };

  get markedFiles(): Git.IStatusFile[] {
    return this.props.files.filter(file => this.props.model.getMark(file.to));
  }

  /**
   * Render the modified files
   */
  render(): JSX.Element {
    if (this.props.settings.composite['simpleStaging']) {
      return (
        <div className={fileListWrapperClass}>
          <AutoSizer disableWidth={true}>
            {({ height }) => this._renderSimpleStage(this.props.files, height)}
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
    if (this.state.selectedFile === null) {
      return false;
    }

    return (
      this.state.selectedFile.x === candidate.x &&
      this.state.selectedFile.y === candidate.y &&
      this.state.selectedFile.from === candidate.from &&
      this.state.selectedFile.to === candidate.to &&
      this.state.selectedFile.status === candidate.status
    );
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
    const openFile = () => {
      this.props.commands.execute(ContextCommandIDs.gitFileOpen, ({
        files: [file]
      } as CommandArguments.IGitContextAction) as any);
    };
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
              onClick={openFile}
            />
            {diffButton}
            <ActionButton
              className={hiddenButtonStyle}
              icon={removeIcon}
              title={this.props.trans.__('Unstage this change')}
              onClick={() => {
                this.resetStagedFile(file.to);
              }}
            />
          </React.Fragment>
        }
        file={file}
        contextMenu={this.openContextMenu}
        model={this.props.model}
        selected={this._isSelectedFile(file)}
        selectFile={this.updateSelectedFile}
        onDoubleClick={
          doubleClickDiff
            ? diffButton
              ? () => this._openDiffView(file)
              : () => undefined
            : openFile
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
    const openFile = () => {
      this.props.commands.execute(ContextCommandIDs.gitFileOpen, ({
        files: [file]
      } as CommandArguments.IGitContextAction) as any);
    };
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
              onClick={openFile}
            />
            {diffButton}
            <ActionButton
              className={hiddenButtonStyle}
              icon={discardIcon}
              title={this.props.trans.__('Discard changes')}
              onClick={() => {
                this.discardChanges(file);
              }}
            />
            <ActionButton
              className={hiddenButtonStyle}
              icon={addIcon}
              title={this.props.trans.__('Stage this change')}
              onClick={() => {
                this.addFile(file.to);
              }}
            />
          </React.Fragment>
        }
        file={file}
        contextMenu={this.openContextMenu}
        model={this.props.model}
        selected={this._isSelectedFile(file)}
        selectFile={this.updateSelectedFile}
        onDoubleClick={
          doubleClickDiff
            ? diffButton
              ? () => this._openDiffView(file)
              : () => undefined
            : openFile
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
              onClick={() => {
                this.props.commands.execute(ContextCommandIDs.gitFileOpen, ({
                  files: [file]
                } as CommandArguments.IGitContextAction) as any);
              }}
            />
            <ActionButton
              className={hiddenButtonStyle}
              icon={addIcon}
              title={this.props.trans.__('Track this file')}
              onClick={() => {
                this.addFile(file.to);
              }}
            />
          </React.Fragment>
        }
        file={file}
        contextMenu={this.openContextMenu}
        model={this.props.model}
        onDoubleClick={() => {
          if (!doubleClickDiff) {
            this.props.commands.execute(ContextCommandIDs.gitFileOpen, ({
              files: [file]
            } as CommandArguments.IGitContextAction) as any);
          }
        }}
        selected={this._isSelectedFile(file)}
        selectFile={this.updateSelectedFile}
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
      this.props.commands.execute(ContextCommandIDs.gitFileOpen, ({
        files: [file]
      } as CommandArguments.IGitContextAction) as any);
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
              this.discardChanges(file);
            }}
          />
        </React.Fragment>
      );
      onDoubleClick = doubleClickDiff
        ? diffButton
          ? () => this._openDiffView(file)
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
              this.discardChanges(file);
            }}
          />
        </React.Fragment>
      );
      onDoubleClick = doubleClickDiff
        ? diffButton
          ? () => this._openDiffView(file)
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
        selectFile={this.updateSelectedFile}
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
    return (
      (getDiffProvider(file.to) || !file.is_binary) && (
        <ActionButton
          className={hiddenButtonStyle}
          icon={diffIcon}
          title={this.props.trans.__('Diff this file')}
          onClick={() => this._openDiffView(file)}
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
  private async _openDiffView(file: Git.IStatusFile): Promise<void> {
    try {
      await this.props.commands.execute(ContextCommandIDs.gitFileDiff, ({
        files: [
          {
            filePath: file.to,
            isText: !file.is_binary,
            status: file.status
          }
        ]
      } as CommandArguments.IGitFileDiff) as any);
    } catch (reason) {
      console.error(`Failed to open diff view for ${file.to}.\n${reason}`);
    }
  }
}
