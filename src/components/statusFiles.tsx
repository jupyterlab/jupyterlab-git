import {
  Dialog, showDialog
} from '@jupyterlab/apputils'

import {
  JupyterLab
} from '@jupyterlab/application'

import {
  Menu
} from '@phosphor/widgets'

import {
  PathExt 
} from '@jupyterlab/coreutils'

import {
  Git, GitShowPrefixResult
} from '../git'

import * as React from 'react'

import ToggleDisplay from 'react-toggle-display'

import '../../style/index.css'

/**
 * The class name added to the git-plugin sessions items.
 */
const GIT_FILE = 'jp-Git-file'

/**
 * The class name added to a git-plugin session item icon.
 */
const GIT_FILE_ICON = 'jp-Git-fileIcon'

/**
 * The class name added to a git-plugin session item label.
 */
const GIT_FILE_LABEL = 'jp-Git-fileLabel'

/**
 * The class name added to a git-plugin session item git-add button.
 */
const GIT_BUTTON_ADD = 'jp-Git-button-add'

/**
 * The class name added to a git-plugin session item git-reset button.
 */
const GIT_BUTTON_RESET = 'jp-Git-button-reset'

/**
 * The class name added to a git-plugin session item git-reset button.
 */
const GIT_BUTTON_RESET_WHITE = 'jp-Git-button-reset-white'

/**
 * The class name added to a git-plugin session item discard button.
 */
const GIT_BUTTON_DISCARD = 'jp-Git-button-discard'

/**
 * The class name added to a git-plugin session item track button.
 */
const GIT_BUTTON_TRACK = 'jp-Git-button-track'

 /**
 * The class name added to a git-plugin session item white expand or collapse button.
 */
const JP_IMAGE_CARET_DOWN_WHITE = 'jp-image-careetdownwhite'
const JP_IMAGE_CARET_RIGHT_WHITE = 'jp-image-caretrightwhite'

 /**
 * The class name added to a git-plugin session item expand or collapse button.
 */
const JP_IMAGE_CARET_DOWN = 'jp-image-caretdown'
const JP_IMAGE_CARET_RIGHT = 'jp-image-caretright'

/**
 * The class name added to a markdown file browser item.
 */
const MARKDOWN_ICON_CLASS = 'jp-MarkdownIcon'

/**
 * The class name added to a python file browser item.
 */
const PYTHON_ICON_CLASS = 'jp-PythonIcon'

/**
 * The class name added to a JSON file browser item.
 */
const JSON_ICON_CLASS = 'jp-JSONIcon'

/**
 * The class name added to a speadsheet file browser item.
 */
const SPREADSHEET_ICON_CLASS = 'jp-SpreadsheetIcon'

/**
 * The class name added to a R Kernel file browser item.
 */
const RKERNEL_ICON_CLASS = 'jp-RKernelIcon'

/**
 * The class name added to a YAML file browser item.
 */
const YAML_ICON_CLASS = 'jp-YamlIcon'

/**
 * The class added for image file browser items.
 */
const IMAGE_ICON_CLASS = 'jp-ImageIcon'

/**
 * The class name added to a file type content item.
 */
const FILE_TYPE_CLASS = 'jp-FileIcon'

/**
 * The class name added to a directory file browser item.
 */
const FOLDER_MATERIAL_ICON_CLASS = 'jp-OpenFolderIcon'

export namespace CommandIDs {
  export const gitFileOpen = 'gf:Open'
  export const gitFileUnstage = 'gf:Unstage'
  export const gitFileStage = 'gf:Stage'
  export const gitFileTrack = 'gf:Track'
  export const gitFileUntrack = 'gf:Untrack'
  export const gitFileDiscard = 'gf:Discard'
}

export interface IStatusFilesState {
  commitMessage: string
  disableCommit: boolean
  showStaged: boolean
  showUnstaged: boolean
  showUntracked: boolean
  contextMenuStaged: any
  contextMenuUnstaged: any
  contextMenuUntracked: any
  contextMenuTypeX: string
  contextMenuTypeY: string 
  contextMenuFile: string 
}

export interface IStatusFilesProps {
  currentFileBrowserPath: string
  topRepoPath: string
  stagedFiles: any
  unstagedFiles: any
  untrackedFiles: any
  app: JupyterLab
  refresh: any
}

export class StatusFiles extends React.Component<IStatusFilesProps, IStatusFilesState> {

  constructor(props: IStatusFilesProps) {
    super(props)

    const { commands } = this.props.app

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
      contextMenuTypeY: '' ,
      contextMenuFile: '' 
    }

    /** Add right-click menu options for files in repo 
      * 
      */

    commands.addCommand(CommandIDs.gitFileOpen, {
      label: 'Open',
      caption: 'Open selected file',
      execute: () => {
        try {
          this.openListedFile(this.state.contextMenuTypeX, this.state.contextMenuTypeY, this.state.contextMenuFile, this.props.app)
         } catch (err) {}
      }
    })
    commands.addCommand(CommandIDs.gitFileStage, {
      label: 'Stage',
      caption: 'Stage the changes of selected file',
      execute: () => {
        try {
          this.addUnstagedFile(this.state.contextMenuFile, this.props.topRepoPath, this.props.refresh)
         } catch (err) {}
      }
    })
    commands.addCommand(CommandIDs.gitFileTrack, {
      label: 'Track',
      caption: 'Start tracking selected file',
      execute: () => {
        try {
          this.addUntrackedFile(this.state.contextMenuFile,  this.props.topRepoPath, this.props.refresh)
         } catch (err) {}
      }
    })
    commands.addCommand(CommandIDs.gitFileUnstage, {
      label: 'Unstage',
      caption: 'Unstage the changes of selected file',
      execute: () => {
        try {
          if (this.state.contextMenuTypeX !== 'D') {
            this.resetStagedFile(this.state.contextMenuFile, this.props.topRepoPath, this.props.refresh)
          }
         } catch (err) {}
      }
    })
    commands.addCommand(CommandIDs.gitFileDiscard, {
      label: 'Discard',
      caption: 'Discard recent changes of selected file',
      execute: () => {
        try {
          this.discardUnstagedFile(this.state.contextMenuFile, this.props.topRepoPath, this.props.refresh)
         } catch (err) {}
      }
    })

    this.state.contextMenuStaged.addItem({ command: CommandIDs.gitFileOpen })
    this.state.contextMenuStaged.addItem({ command: CommandIDs.gitFileUnstage})

    this.state.contextMenuUnstaged.addItem({ command: CommandIDs.gitFileOpen })
    this.state.contextMenuUnstaged.addItem({ command: CommandIDs.gitFileStage })
    this.state.contextMenuUnstaged.addItem({ command: CommandIDs.gitFileDiscard })

    this.state.contextMenuUntracked.addItem({ command: CommandIDs.gitFileOpen })
    this.state.contextMenuUntracked.addItem({ command: CommandIDs.gitFileTrack })
  }

  /** Handle clicks on a staged file
   * 
   */
  handleClickStaged(event) {
    event.preventDefault()
    if (event.buttons === 2) {
      <select>
          <option 
            className='jp-Git-switch-branch' 
            value=''
            disabled
          >
            Open 
          </option>
          <option 
            className='jp-Git-create-branch-line' 
            disabled
          > 
            unstaged this file
          </option>
          <option className='jp-Git-create-branch' value=''>
            CREATE NEW
          </option>
        </select>
    }
  }

  /** Handle right-click on a staged file */
  contextMenuStaged(event, typeX: string, typeY: string, file: string) {
    event.persist()
    event.preventDefault()
    this.setState(
      {
        contextMenuTypeX: typeX,
        contextMenuTypeY: typeY,
        contextMenuFile: file
      },
      () => this.state.contextMenuStaged.open(event.clientX, event.clientY)
    )
  }

  /** Handle right-click on an unstaged file */
  contextMenuUnstaged(event, typeX: string,typeY: string, file:string) {
    event.persist()
    event.preventDefault()
    this.setState(
      {
        contextMenuTypeX: typeX,
        contextMenuTypeY: typeY,
        contextMenuFile: file
      }, 
      () => this.state.contextMenuUnstaged.open(event.clientX, event.clientY)
    )
  }

  /** Handle right-click on an untracked file */
  contextMenuUntracked(event, typeX: string, typeY: string, file: string) {
    event.persist()
    event.preventDefault()
    this.setState(
      {
        contextMenuTypeX: typeX,
        contextMenuTypeY: typeY,
        contextMenuFile: file
      }, 
      () => this.state.contextMenuUntracked.open(event.clientX, event.clientY)
    )
  }
  
  /** Handle input inside commit message box */
  handleChange = (event: any) : void => {
    if (event.target.value && event.target.value !== '') {
      this.setState(
        {
          commitMessage: event.target.value,
          disableCommit: false
        }
      )
    } else {
      this.setState(
        {
          commitMessage: event.target.value,
          disableCommit: true
        }
      )
    }
  }

  /** Initalize commit message input box */
  initializeInput = () : void => {
    this.setState(
      {
        commitMessage: '',
        disableCommit: true
      }
    )
  }

  /** Prevent enter key triggered 'submit' action during commit message input */
  onKeyPress(event) : void {
    if (event.which === 13) {
      event.preventDefault()
      this.setState({commitMessage: this.state.commitMessage + '\n'})
    }
  }

  /** Toggle display of staged files */
  displayStaged() : void {
    this.setState({showStaged: !this.state.showStaged})
  }

  /** Toggle display of unstaged files */
  displayUnstaged() : void {
    this.setState({showUnstaged: !this.state.showUnstaged})
  }

  /** Toggle display of untracked files */
  displayUntracked() : void {
    this.setState({showUntracked: !this.state.showUntracked})
  }

  /** Update state of commit message input box */
  updateCommitBoxState(disable: boolean, numberOfFiles: number) : string {
    if (disable) {
      if (numberOfFiles === 0) {
        return 'jp-Git-staged-commit-button-disable'
      } else {
        return 'jp-Git-staged-commit-button-ready'
      } 
    } else {
      return 'jp-Git-staged-commit-button'
    }
  }

/** Open a file in the git listing */
async openListedFile(typeX: string, typeY: string, path: string, app: JupyterLab) {
  if (typeX === 'D' || typeY === 'D') {
    showDialog(
      {
        title: 'Open File Failed',
        body: "This file has been deleted!",
        buttons: [Dialog.warnButton({ label: 'OK' })]
      }
    ).then(result => {
      if (result.button.accept) {
        return
      }
    })
   return
  } try {
    let leftSidebarItems = app.shell.widgets('left')
    let fileBrowser = leftSidebarItems.next()
    while (fileBrowser.id !== 'filebrowser') {
      fileBrowser = leftSidebarItems.next()
    }
    let gitApi = new Git()
    let prefixData = await gitApi.showPrefix((fileBrowser as any).model.path)
    let underRepoPath = (prefixData as GitShowPrefixResult).under_repo_path
    let fileBrowserPath = (fileBrowser as any).model.path + '/'
    let openFilePath = fileBrowserPath
    .substring(0, fileBrowserPath.length - underRepoPath.length)
    if (path[path.length - 1] !== '/') {
      (fileBrowser as any)._listing._manager.openOrReveal(openFilePath + path)
    } else {
      console.log("Cannot open a folder here")
    } 
  } catch(err) {}
}

/** Reset all staged files */
resetAllStagedFiles(path: string, refresh: Function) {
  let gitApi = new Git()
  gitApi.reset(true, null, path).then(response => {
    refresh()
  })
}

/** Commit all staged files */
commitAllStagedFiles(message: string, path: string, refresh: Function) {
  if (message && message !== '') {
    let gitApi = new Git()
     gitApi.commit(message, path).then(response => {
      refresh()
    })
  }
}

/** Reset a specific staged file */
resetStagedFile(file: string, path: string, refresh: Function) {
  let gitApi = new Git()
  gitApi.reset(false, file, path).then(response => {
    refresh()
  })
}

/** Add all unstaged files */
addAllUnstagedFiles(path: string, refresh: Function) {
  let gitApi = new Git()
  gitApi.add(true, null, path).then(response => {
    refresh()
  })
}

/** Discard changes in all unstaged files */
discardAllUnstagedFiles(path: string, refresh: Function) {
  let gitApi = new Git()
  showDialog(
    {
      title: 'DISCARD CHANGES',
      body: "Do you really want to discard all uncommitted changes?",
      buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard' })]
    }
  ).then(result => {
    if (result.button.accept) {
      gitApi.checkout(false, false, null, true, null, path).then(response => {
        refresh()
      })
    }
  })
}

/** Add a specific unstaged file */
addUnstagedFile(file: string, path: string, refresh: Function) {
  let gitApi = new Git()
  gitApi.add(false, file, path).then(response => {
    refresh()
  })
}

/** Discard changes in a specific unstaged file */
discardUnstagedFile(file: string, path: string, refresh: Function) {
  let gitApi = new Git()
  showDialog(
    {
      title: 'DISCARD CHANGES',
      body: "Do you really want to discard the uncommitted changes in this file?",
      buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard' })]
    }
  ).then(result => {
    if (result.button.accept) {
      gitApi.checkout(false, false, null, false, file, path).then(response => {
        refresh()
      })
    }
  })
}

/** Add all untracked files */
addAllUntrackedFiles(path: string, refresh: Function) {
  let gitApi = new Git()
  gitApi.addAllUntracked(path).then(response => {
    refresh()
  })
}

/** Add a specific untracked file */
addUntrackedFile(file: string, path: string, refresh: Function) {
  let gitApi = new Git()
  gitApi.add(false, file, path).then(response => {
    refresh()
  })
}

/** Get the filename from a path */
extractFilename(path: string): string {
  if (path[path.length - 1] === '/') {
    return path
  } else {
    let temp = path.split('/')
    return temp[temp.length - 1]
  }
}

  render() {
    return (
      <div onContextMenu={ (event) => event.preventDefault()}>
        <div className= 'jp-Git-section-fileContainer' >
          <div className='jp-Git-staged'>       
            <span 
              className='jp-Git-staged-header-label'
            >
            Staged({(this.props.stagedFiles).length})
              <button 
                className={this.state.showStaged ? 
                `jp-Git-button ${JP_IMAGE_CARET_DOWN_WHITE}` 
                : `jp-Git-button ${JP_IMAGE_CARET_RIGHT_WHITE}`} 
                onClick={()=>this.displayStaged()}
              />
            </span>
            <ToggleDisplay show={this.props.stagedFiles.length > 0}>
              <button 
                className={`jp-Git-header-button ${GIT_BUTTON_RESET_WHITE}`} 
                title='Reset all staged changes' 
                onClick={() => {
                  this.resetAllStagedFiles(this.props.topRepoPath, this.props.refresh), 
                  this.initializeInput()
                  }} 
              />
            </ToggleDisplay>
          </div>
          <ToggleDisplay show={this.state.showStaged}>
          <div className= 'jp-Git-section-fileContainer'>
            <form className="jp-Git-staged-commit" onKeyPress={(event) => this.onKeyPress(event)}>
            <textarea 
              className='jp-Git-staged-commit-msg' 
              disabled ={(this.props.stagedFiles).length === 0} 
              placeholder={(this.props.stagedFiles).length === 0 ? 
              'Stage your changes before commit'
              : 'Input message to commit staged changes'} 
              value={this.state.commitMessage} 
              onChange={this.handleChange}
            />
            <input 
              className={
                this.updateCommitBoxState(this.state.disableCommit, 
                this.props.stagedFiles.length)
              } 
              type="button" 
              title='Commit' 
              value={'\u2714'}  
              disabled={this.state.disableCommit} 
              onClick={() => 
                {this.commitAllStagedFiles(this.state.commitMessage,this.props.topRepoPath, this.props.refresh),
                  this.initializeInput()
               }
              }
            />
            </form>
            {this.props.stagedFiles.map((file, file_index) =>
              <li className={GIT_FILE} key={file_index}>
              <span className={`${GIT_FILE_ICON} ${parseFileExtension(file.to)}`} />
              <span 
                className={GIT_FILE_LABEL} 
                onContextMenu={(e) => {this.contextMenuStaged(e, file.x, file.y, file.to)}} 
                onDoubleClick={() => this.openListedFile(file.x, file.y, file.to, this.props.app)}
              >
                {this.extractFilename(file.to)} [{file.x}]
              </span>
              <ToggleDisplay show={file.x !== 'D'}>
              <button 
                className={`jp-Git-button ${GIT_BUTTON_RESET}`} 
                title='Unstage this change' 
                onClick={() => {
                  this.resetStagedFile(file.to, this.props.topRepoPath, this.props.refresh), 
                  this.props.stagedFiles.length === 1 ? this.initializeInput() : {}
                  }
                }
              />
              </ToggleDisplay>
              </li>
            )}
          </div>
          </ToggleDisplay>
        </div>
        <div className= 'jp-Git-section-fileContainer'>
        <div className='jp-Git-unstaged' >
          <span className='jp-Git-unstaged-header-label'> 
            Changes({(this.props.unstagedFiles).length})
          </span>  
          <ToggleDisplay show={this.props.unstagedFiles.length>0}>
          <button 
            className={this.state.showUnstaged ? 
              `jp-Git-button ${JP_IMAGE_CARET_DOWN}` 
              : `jp-Git-button ${JP_IMAGE_CARET_RIGHT}`
            } 
            onClick={() => this.displayUnstaged()} 
          />
          <button 
            className={`jp-Git-header-button ${GIT_BUTTON_ADD}`} 
            title='Stage all changes' 
            onClick={() => this.addAllUnstagedFiles(this.props.topRepoPath, this.props.refresh)} 
          />
          <button 
            className={`jp-Git-header-button ${GIT_BUTTON_DISCARD}`} 
            title='Discard all changes' 
            onClick={() => this.discardAllUnstagedFiles(this.props.topRepoPath, this.props.refresh)}
          />
          </ToggleDisplay>
        </div>
        <ToggleDisplay show={this.state.showUnstaged}>
        <div className= 'jp-Git-section-fileContainer'>
          {this.props.unstagedFiles.map((file, file_index)=>
            <li className={GIT_FILE} key={file_index}>
            <span className={`${GIT_FILE_ICON} ${parseFileExtension(file.to)}`} />
            <span 
              className={GIT_FILE_LABEL} 
              onContextMenu={(e) => {this.contextMenuUnstaged(e, file.x, file.y, file.to)}} 
              onDoubleClick={() => this.openListedFile(file.x, file.y, file.to, this.props.app)}
            >
              {this.extractFilename(file.to)} [{file.y}]
            </span>
            <button 
              className= {`jp-Git-button ${GIT_BUTTON_DISCARD}`} 
              title='Discard this change' 
              onClick={() => {
                this.discardUnstagedFile(file.to, this.props.topRepoPath, this.props.refresh)
                }
               } 
            />
            <button 
              className= {`jp-Git-button ${GIT_BUTTON_ADD}`} 
              title='Stage this change' 
              onClick={() => {
                this.addUnstagedFile(file.to, this.props.topRepoPath, this.props.refresh)
                }
              }
            />
            </li>
          )}
        </div>
        </ToggleDisplay>
        </div>
        <div className= 'jp-Git-section-fileContainer'>
          <div className='jp-Git-untracked' >
            <span 
              className='jp-Git-untracked-header-label'
            > 
              Untracked({(this.props.untrackedFiles).length})
            </span>
            <ToggleDisplay show={this.props.untrackedFiles.length > 0}>
              <button 
                className={this.state.showUntracked ? 
                  `jp-Git-button ${JP_IMAGE_CARET_DOWN}` 
                  : `jp-Git-button ${JP_IMAGE_CARET_RIGHT}`
                } 
                onClick={() => this.displayUntracked()} 
              />
              <button 
                className={`jp-Git-header-button ${GIT_BUTTON_TRACK}`} 
                title='Track all untracked files' 
                onClick={() => {
                  this.addAllUntrackedFiles(this.props.topRepoPath, this.props.refresh)
                  }
                } 
              />
            </ToggleDisplay>
          </div>
          <ToggleDisplay show={this.state.showUntracked}>
          <div className= 'jp-Git-section-fileContainer'>
            {this.props.untrackedFiles.map((file, file_index) =>
              <li className={GIT_FILE} key={file_index}>
              <span className={`${GIT_FILE_ICON} ${parseFileExtension(file.to)}`} />
              <span 
                className={GIT_FILE_LABEL} 
                onContextMenu={(e) => {this.contextMenuUntracked(e, file.x, file.y, file.to)}} 
                onDoubleClick={() => this.openListedFile(file.x,file.y,file.to,this.props.app)}
              >
                {this.extractFilename(file.to)}
              </span>
              <button 
                className= {`jp-Git-button ${GIT_BUTTON_TRACK}`} 
                title='Track this file' 
                onClick={() => {
                  this.addUntrackedFile(file.to, this.props.topRepoPath, this.props.refresh)
                  }
                } 
              />
              </li>
            )}
          </div>
          </ToggleDisplay>
          </div>
      </div>
    )
  }
}

/** Get the extension of a given file */
export function parseFileExtension(path: string): string {
  if (path[path.length - 1] === '/') {
    return FOLDER_MATERIAL_ICON_CLASS
  }
  var fileExtension = PathExt.extname(path).toLocaleLowerCase()
  switch (fileExtension) {
    case '.md':
      return MARKDOWN_ICON_CLASS
    case '.py':
      return PYTHON_ICON_CLASS
    case '.json':
      return JSON_ICON_CLASS
    case '.csv':
      return SPREADSHEET_ICON_CLASS
    case '.xls':
      return SPREADSHEET_ICON_CLASS
    case '.r':
      return RKERNEL_ICON_CLASS
    case '.yml':
      return YAML_ICON_CLASS
    case '.yaml':
      return YAML_ICON_CLASS
    case '.svg':
      return IMAGE_ICON_CLASS
    case '.tiff':
      return IMAGE_ICON_CLASS
    case '.jpeg':
      return IMAGE_ICON_CLASS
    case '.jpg':
      return IMAGE_ICON_CLASS
    case '.gif':
      return IMAGE_ICON_CLASS
    case '.png':
      return IMAGE_ICON_CLASS
    case '.raw':
      return IMAGE_ICON_CLASS
    default:
      return FILE_TYPE_CLASS
  }
}