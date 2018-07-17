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

import {
  fileStyle,
  fileGitButtonStyle,
  fileLabelStyle,

  fileIconStyle,
  folderFileIconStyle,
  genericFileIconStyle,
  yamlFileIconStyle,
  markdownFileIconStyle,
  imageFileIconStyle,
  spreadsheetFileIconStyle,
  jsonFileIconStyle,
  pythonFileIconStyle,
  kernelFileIconStyle,

  textInputStyle,

  stagedAreaStyle,
  stagedCommitStyle,
  stagedCommitMessageStyle,
  stagedCommitButtonStyle,
  stagedCommitButtonReadyStyle,
  stagedCommitButtonDisabledStyle,
  stagedHeaderLabelStyle,

  sectionAreaStyle,
  sectionHeaderLabelStyle,

  changeStageButtonStyle,
  stageFileButtonStyle,
  unstageFileButtonStyle,
  unstageFileButtonWhiteStyle,
  discardFileButtonStyle,
  trackFileButtonStyle,
  caretdownImageStyle,
  caretdownImageWhiteStyle,
  caretrightImageStyle,
  fileButtonStyle

} from '../components_style/FileListStyle'

import {
  classes 
} from 'typestyle/lib'

import * as React from 'react'

import ToggleDisplay from 'react-toggle-display'

import '../../style/index.css'

export namespace CommandIDs {
  export const gitFileOpen = 'gf:Open'
  export const gitFileUnstage = 'gf:Unstage'
  export const gitFileStage = 'gf:Stage'
  export const gitFileTrack = 'gf:Track'
  export const gitFileUntrack = 'gf:Untrack'
  export const gitFileDiscard = 'gf:Discard'
}

export interface IFileListState {
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

export interface IFileListProps {
  currentFileBrowserPath: string
  topRepoPath: string
  stagedFiles: any
  unstagedFiles: any
  untrackedFiles: any
  app: JupyterLab
  refresh: any
}

export class FileList extends React.Component<IFileListProps, IFileListState> {

  constructor(props: IFileListProps) {
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
  updateCommitBoxState(disable: boolean, numberOfFiles: number) {
    if (disable) {
      if (numberOfFiles === 0) {
        return classes(stagedCommitButtonStyle, stagedCommitButtonDisabledStyle)
      } else {
        return classes(stagedCommitButtonStyle, stagedCommitButtonReadyStyle)
      } 
    } else {
      return stagedCommitButtonStyle
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
          <div className={stagedAreaStyle}>       
            <span 
              className={stagedHeaderLabelStyle}
            >
            Staged({(this.props.stagedFiles).length})
              <button 
                className={this.state.showStaged ? 
                `jp-Git-button ${changeStageButtonStyle} ${caretdownImageWhiteStyle}` 
                : `jp-Git-button ${changeStageButtonStyle} ${caretrightImageStyle}`} 
                onClick={()=>this.displayStaged()}
              />
            </span>
            <ToggleDisplay show={this.props.stagedFiles.length > 0}>
              <button 
                className={`jp-Git-header-button ${unstageFileButtonWhiteStyle}`} 
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
            <form className={stagedCommitStyle} onKeyPress={(event) => this.onKeyPress(event)}>
            <textarea 
              className={`${textInputStyle} ${stagedCommitMessageStyle}`}
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
              <li className={fileStyle + ' ' + 'jp-Git-file'} key={file_index}>
              <span className={`${fileIconStyle} ${parseFileExtension(file.to)}`} />
              <span 
                className={fileLabelStyle} 
                onContextMenu={(e) => {this.contextMenuStaged(e, file.x, file.y, file.to)}} 
                onDoubleClick={() => this.openListedFile(file.x, file.y, file.to, this.props.app)}
              >
                {this.extractFilename(file.to)} [{file.x}]
              </span>
              <ToggleDisplay show={file.x !== 'D'}>
              <button 
                className={`${fileGitButtonStyle} ${fileButtonStyle} ${changeStageButtonStyle} jp-Git-button ${unstageFileButtonStyle}`} 
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
        <div className={sectionAreaStyle} >
          <span className={sectionHeaderLabelStyle}> 
            Changes({(this.props.unstagedFiles).length})
          </span>  
          <ToggleDisplay show={this.props.unstagedFiles.length>0}>
          <button 
            className={this.state.showUnstaged ? 
              `${changeStageButtonStyle} ${caretdownImageStyle}` 
              : `${changeStageButtonStyle} ${caretrightImageStyle}`
            } 
            onClick={() => this.displayUnstaged()} 
          />
          <button 
            className={`jp-Git-header-button ${stageFileButtonStyle}`} 
            title='Stage all changes' 
            onClick={() => this.addAllUnstagedFiles(this.props.topRepoPath, this.props.refresh)} 
          />
          <button 
            className={`jp-Git-header-button ${discardFileButtonStyle}`} 
            title='Discard all changes' 
            onClick={() => this.discardAllUnstagedFiles(this.props.topRepoPath, this.props.refresh)}
          />
          </ToggleDisplay>
        </div>
        <ToggleDisplay show={this.state.showUnstaged}>
        <div className= 'jp-Git-section-fileContainer'>
          {this.props.unstagedFiles.map((file, file_index)=>
            <li className={fileStyle + ' ' + 'jp-Git-file'} key={file_index}>
            <span className={`${fileIconStyle} ${parseFileExtension(file.to)}`} />
            <span 
              className={fileLabelStyle} 
              onContextMenu={(e) => {this.contextMenuUnstaged(e, file.x, file.y, file.to)}} 
              onDoubleClick={() => this.openListedFile(file.x, file.y, file.to, this.props.app)}
            >
              {this.extractFilename(file.to)} [{file.y}]
            </span>
            <button 
              className= {`${fileGitButtonStyle} ${fileButtonStyle} ${changeStageButtonStyle} jp-Git-button ${discardFileButtonStyle}`} 
              title='Discard this change' 
              onClick={() => {
                this.discardUnstagedFile(file.to, this.props.topRepoPath, this.props.refresh)
                }
               } 
            />
            <button 
              className= {`jp-Git-button ${fileButtonStyle} ${changeStageButtonStyle} ${fileGitButtonStyle} ${stageFileButtonStyle}`} 
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
          <div className={sectionAreaStyle} >
            <span 
              className={sectionHeaderLabelStyle}
            > 
              Untracked({(this.props.untrackedFiles).length})
            </span>
            <ToggleDisplay show={this.props.untrackedFiles.length > 0}>
              <button 
                className={this.state.showUntracked ? 
                  `jp-Git-button ${changeStageButtonStyle} ${caretdownImageStyle}` 
                  : `jp-Git-button ${changeStageButtonStyle} ${caretrightImageStyle}`
                } 
                onClick={() => this.displayUntracked()} 
              />
              <button 
                className={`jp-Git-header-button ${trackFileButtonStyle}`} 
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
              <li className={fileStyle + ' ' + 'jp-Git-file'} key={file_index}>
              <span className={`${fileIconStyle} ${parseFileExtension(file.to)}`} />
              <span 
                className={fileLabelStyle} 
                onContextMenu={(e) => {this.contextMenuUntracked(e, file.x, file.y, file.to)}} 
                onDoubleClick={() => this.openListedFile(file.x,file.y,file.to,this.props.app)}
              >
                {this.extractFilename(file.to)}
              </span>
              <button 
                className= {`${fileGitButtonStyle} ${fileButtonStyle} ${changeStageButtonStyle} jp-Git-button ${trackFileButtonStyle}`} 
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
    return folderFileIconStyle
  }
  var fileExtension = PathExt.extname(path).toLocaleLowerCase()
  switch (fileExtension) {
    case '.md':
      return markdownFileIconStyle
    case '.py':
      return pythonFileIconStyle
    case '.json':
      return jsonFileIconStyle
    case '.csv':
      return spreadsheetFileIconStyle
    case '.xls':
      return spreadsheetFileIconStyle
    case '.r':
      return kernelFileIconStyle
    case '.yml':
      return yamlFileIconStyle
    case '.yaml':
      return yamlFileIconStyle
    case '.svg':
      return imageFileIconStyle
    case '.tiff':
      return imageFileIconStyle
    case '.jpeg':
      return imageFileIconStyle
    case '.jpg':
      return imageFileIconStyle
    case '.gif':
      return imageFileIconStyle
    case '.png':
      return imageFileIconStyle
    case '.raw':
      return imageFileIconStyle
    default:
      return genericFileIconStyle
  }
}