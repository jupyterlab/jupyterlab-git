import { Dialog, showDialog } from '@jupyterlab/apputils';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { Menu } from '@phosphor/widgets';

import { PathExt } from '@jupyterlab/coreutils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { openDiffView } from './diff/DiffWidget';
import {
  folderFileIconSelectedStyle,
  folderFileIconStyle,
  genericFileIconSelectedStyle,
  genericFileIconStyle,
  imageFileIconSelectedStyle,
  imageFileIconStyle,
  jsonFileIconSelectedStyle,
  jsonFileIconStyle,
  kernelFileIconSelectedStyle,
  kernelFileIconStyle,
  markdownFileIconSelectedStyle,
  markdownFileIconStyle,
  moveFileDownButtonSelectedStyle,
  moveFileDownButtonStyle,
  moveFileUpButtonSelectedStyle,
  moveFileUpButtonStyle,
  pythonFileIconSelectedStyle,
  pythonFileIconStyle,
  spreadsheetFileIconSelectedStyle,
  spreadsheetFileIconStyle,
  yamlFileIconSelectedStyle,
  yamlFileIconStyle
} from '../componentsStyle/FileListStyle';
import { Git, IGitShowPrefixResult } from '../git';
import { GitStage } from './GitStage';

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
  contextMenuStaged: any;
  contextMenuUnstaged: any;
  contextMenuUntracked: any;
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
  currentFileBrowserPath: string;
  topRepoPath: string;
  stagedFiles: any;
  unstagedFiles: any;
  untrackedFiles: any;
  app: JupyterFrontEnd;
  refresh: any;
  sideBarExpanded: boolean;
  display: boolean;
  renderMime: IRenderMimeRegistry;
}

export class FileList extends React.Component<IFileListProps, IFileListState> {
  constructor(props: IFileListProps) {
    super(props);

    const { commands } = this.props.app;

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
          await this.openListedFile(
            this.state.contextMenuTypeX,
            this.state.contextMenuTypeY,
            this.state.contextMenuFile,
            this.props.app
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
            this.props.app,
            {
              currentRef: { specialRef: 'WORKING' },
              previousRef: { gitRef: 'HEAD' }
            },
            this.props.renderMime,
            this.props.topRepoPath
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
            this.props.app,
            {
              currentRef: { specialRef: 'INDEX' },
              previousRef: { gitRef: 'HEAD' }
            },
            this.props.renderMime,
            this.props.topRepoPath
          );
        }
      });
    }

    if (!commands.hasCommand(CommandIDs.gitFileStage)) {
      commands.addCommand(CommandIDs.gitFileStage, {
        label: 'Stage',
        caption: 'Stage the changes of selected file',
        execute: () => {
          this.addUnstagedFile(
            this.state.contextMenuFile,
            this.props.topRepoPath,
            this.props.refresh
          );
        }
      });
    }

    if (!commands.hasCommand(CommandIDs.gitFileTrack)) {
      commands.addCommand(CommandIDs.gitFileTrack, {
        label: 'Track',
        caption: 'Start tracking selected file',
        execute: () => {
          this.addUntrackedFile(
            this.state.contextMenuFile,
            this.props.topRepoPath,
            this.props.refresh
          );
        }
      });
    }

    if (!commands.hasCommand(CommandIDs.gitFileUnstage)) {
      commands.addCommand(CommandIDs.gitFileUnstage, {
        label: 'Unstage',
        caption: 'Unstage the changes of selected file',
        execute: () => {
          if (this.state.contextMenuTypeX !== 'D') {
            this.resetStagedFile(
              this.state.contextMenuFile,
              this.props.topRepoPath,
              this.props.refresh
            );
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

  /** Open a file in the git listing */
  async openListedFile(
    typeX: string,
    typeY: string,
    path: string,
    app: JupyterFrontEnd
  ) {
    if (typeX === 'D' || typeY === 'D') {
      showDialog({
        title: 'Open File Failed',
        body: 'This file has been deleted!',
        buttons: [Dialog.warnButton({ label: 'OK' })]
      }).then(result => {
        if (result.button.accept) {
          return;
        }
      });
      return;
    }
    try {
      const leftSidebarItems = app.shell.widgets('left');
      let fileBrowser = leftSidebarItems.next();
      while (fileBrowser.id !== 'filebrowser') {
        fileBrowser = leftSidebarItems.next();
      }
      let gitApi = new Git();
      let prefixData = await gitApi.showPrefix((fileBrowser as any).model.path);
      let underRepoPath = (prefixData as IGitShowPrefixResult).under_repo_path;
      let fileBrowserPath = (fileBrowser as any).model.path + '/';
      let openFilePath = fileBrowserPath.substring(
        0,
        fileBrowserPath.length - underRepoPath.length
      );
      if (path[path.length - 1] !== '/') {
        (fileBrowser as any)._listing._manager.openOrReveal(
          openFilePath + path
        );
      } else {
        console.log('Cannot open a folder here');
      }
    } catch (err) {}
  }

  /** Reset all staged files */
  resetAllStagedFiles(path: string, refresh: Function) {
    let gitApi = new Git();
    gitApi.reset(true, null, path).then(response => {
      refresh();
    });
  }

  /** Reset a specific staged file */
  resetStagedFile(file: string, path: string, refresh: Function) {
    let gitApi = new Git();
    gitApi.reset(false, file, path).then(response => {
      refresh();
    });
  }

  /** Add all unstaged files */
  addAllUnstagedFiles(path: string, refresh: Function) {
    let gitApi = new Git();
    gitApi.add(true, null, path).then(response => {
      refresh();
    });
  }

  /** Discard changes in all unstaged files */
  discardAllUnstagedFiles(path: string, refresh: Function) {
    let gitApi = new Git();
    gitApi
      .checkout(false, false, null, true, null, path)
      .then(response => {
        refresh();
      })
      .catch(() => {
        showDialog({
          title: 'Discard all changes failed.',
          buttons: [Dialog.warnButton({ label: 'DISMISS' })]
        }).then(() => {
          /** no-op */
        });
      });
  }

  /** Add a specific unstaged file */
  addUnstagedFile(file: string, path: string, refresh: Function) {
    let gitApi = new Git();
    gitApi.add(false, file, path).then(response => {
      refresh();
    });
  }

  /** Discard changes in a specific unstaged file */
  discardUnstagedFile(file: string, path: string, refresh: Function) {
    let gitApi = new Git();
    gitApi
      .checkout(false, false, null, false, file, path)
      .then(response => {
        refresh();
      })
      .catch(() => {
        showDialog({
          title: `Discard changes for ${file} failed.`,
          buttons: [Dialog.warnButton({ label: 'DISMISS' })]
        }).then(() => {
          /** no-op */
        });
      });
  }

  /** Add all untracked files */
  addAllUntrackedFiles(path: string, refresh: Function) {
    let gitApi = new Git();
    gitApi.addAllUntracked(path).then(response => {
      refresh();
    });
  }

  /** Add a specific untracked file */
  addUntrackedFile(file: string, path: string, refresh: Function) {
    let gitApi = new Git();
    gitApi.add(false, file, path).then(response => {
      refresh();
    });
  }

  /** Get the filename from a path */
  extractFilename(path: string): string {
    if (path[path.length - 1] === '/') {
      return path;
    } else {
      let temp = path.split('/');
      return temp[temp.length - 1];
    }
  }

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

  render() {
    return (
      <div onContextMenu={event => event.preventDefault()}>
        {this.props.display && (
          <div>
            <GitStage
              heading={'Staged'}
              topRepoPath={this.props.topRepoPath}
              files={this.props.stagedFiles}
              app={this.props.app}
              refresh={this.props.refresh}
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
              openFile={this.openListedFile}
              extractFilename={this.extractFilename}
              contextMenu={this.contextMenuStaged}
              parseFileExtension={parseFileExtension}
              parseSelectedFileExtension={parseSelectedFileExtension}
              selectedFile={this.state.selectedFile}
              updateSelectedFile={this.updateSelectedFile}
              selectedStage={this.state.selectedStage}
              updateSelectedStage={this.updateSelectedStage}
              selectedDiscardFile={this.state.selectedDiscardFile}
              updateSelectedDiscardFile={this.updateSelectedDiscardFile}
              disableFiles={this.state.disableFiles}
              toggleDisableFiles={this.toggleDisableFiles}
              disableOthers={null}
              isDisabled={this.state.disableStaged}
              sideBarExpanded={this.props.sideBarExpanded}
              renderMime={this.props.renderMime}
            />
            <GitStage
              heading={'Changed'}
              topRepoPath={this.props.topRepoPath}
              files={this.props.unstagedFiles}
              app={this.props.app}
              refresh={this.props.refresh}
              showFiles={this.state.showUnstaged}
              displayFiles={this.displayUnstaged}
              moveAllFiles={this.addAllUnstagedFiles}
              discardAllFiles={this.discardAllUnstagedFiles}
              discardFile={this.discardUnstagedFile}
              moveFile={this.addUnstagedFile}
              moveFileIconClass={moveFileUpButtonStyle}
              moveFileIconSelectedClass={moveFileUpButtonSelectedStyle}
              moveAllFilesTitle={'Stage all changes'}
              moveFileTitle={'Stage this change'}
              openFile={this.openListedFile}
              extractFilename={this.extractFilename}
              contextMenu={this.contextMenuUnstaged}
              parseFileExtension={parseFileExtension}
              parseSelectedFileExtension={parseSelectedFileExtension}
              selectedFile={this.state.selectedFile}
              updateSelectedFile={this.updateSelectedFile}
              selectedStage={this.state.selectedStage}
              updateSelectedStage={this.updateSelectedStage}
              selectedDiscardFile={this.state.selectedDiscardFile}
              updateSelectedDiscardFile={this.updateSelectedDiscardFile}
              disableFiles={this.state.disableFiles}
              toggleDisableFiles={this.toggleDisableFiles}
              disableOthers={this.disableStagesForDiscardAll}
              isDisabled={this.state.disableUnstaged}
              sideBarExpanded={this.props.sideBarExpanded}
              renderMime={this.props.renderMime}
            />
            <GitStage
              heading={'Untracked'}
              topRepoPath={this.props.topRepoPath}
              files={this.props.untrackedFiles}
              app={this.props.app}
              refresh={this.props.refresh}
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
              openFile={this.openListedFile}
              extractFilename={this.extractFilename}
              contextMenu={this.contextMenuUntracked}
              parseFileExtension={parseFileExtension}
              parseSelectedFileExtension={parseSelectedFileExtension}
              selectedFile={this.state.selectedFile}
              updateSelectedFile={this.updateSelectedFile}
              selectedStage={this.state.selectedStage}
              updateSelectedStage={this.updateSelectedStage}
              selectedDiscardFile={this.state.selectedDiscardFile}
              updateSelectedDiscardFile={this.updateSelectedDiscardFile}
              disableFiles={this.state.disableFiles}
              toggleDisableFiles={this.toggleDisableFiles}
              disableOthers={null}
              isDisabled={this.state.disableUntracked}
              sideBarExpanded={this.props.sideBarExpanded}
              renderMime={this.props.renderMime}
            />
          </div>
        )}
      </div>
    );
  }
}

/** Get the extension of a given file */
export function parseFileExtension(path: string): string {
  if (path[path.length - 1] === '/') {
    return folderFileIconStyle;
  }
  let fileExtension = PathExt.extname(path).toLocaleLowerCase();
  switch (fileExtension) {
    case '.md':
      return markdownFileIconStyle;
    case '.py':
      return pythonFileIconStyle;
    case '.json':
      return jsonFileIconStyle;
    case '.csv':
      return spreadsheetFileIconStyle;
    case '.xls':
      return spreadsheetFileIconStyle;
    case '.r':
      return kernelFileIconStyle;
    case '.yml':
      return yamlFileIconStyle;
    case '.yaml':
      return yamlFileIconStyle;
    case '.svg':
      return imageFileIconStyle;
    case '.tiff':
      return imageFileIconStyle;
    case '.jpeg':
      return imageFileIconStyle;
    case '.jpg':
      return imageFileIconStyle;
    case '.gif':
      return imageFileIconStyle;
    case '.png':
      return imageFileIconStyle;
    case '.raw':
      return imageFileIconStyle;
    default:
      return genericFileIconStyle;
  }
}

/** Get the extension of a given selected file */
export function parseSelectedFileExtension(path: string): string {
  if (path[path.length - 1] === '/') {
    return folderFileIconSelectedStyle;
  }
  let fileExtension = PathExt.extname(path).toLocaleLowerCase();
  switch (fileExtension) {
    case '.md':
      return markdownFileIconSelectedStyle;
    case '.py':
      return pythonFileIconSelectedStyle;
    case '.json':
      return jsonFileIconSelectedStyle;
    case '.csv':
      return spreadsheetFileIconSelectedStyle;
    case '.xls':
      return spreadsheetFileIconSelectedStyle;
    case '.r':
      return kernelFileIconSelectedStyle;
    case '.yml':
      return yamlFileIconSelectedStyle;
    case '.yaml':
      return yamlFileIconSelectedStyle;
    case '.svg':
      return imageFileIconSelectedStyle;
    case '.tiff':
      return imageFileIconSelectedStyle;
    case '.jpeg':
      return imageFileIconSelectedStyle;
    case '.jpg':
      return imageFileIconSelectedStyle;
    case '.gif':
      return imageFileIconSelectedStyle;
    case '.png':
      return imageFileIconSelectedStyle;
    case '.raw':
      return imageFileIconSelectedStyle;
    default:
      return genericFileIconSelectedStyle;
  }
}
