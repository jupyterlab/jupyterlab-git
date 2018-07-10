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
 * The class name added to a git-plugin session item white expand button.
 */
const JP_IMAGE_CARET_DOWN_WHITE = 'jp-image-careetdownwhite'

const JP_IMAGE_CARET_RIGHT_WHITE = 'jp-image-caretrightwhite'
/**
 * The class name added to a git-plugin session item white collapse button.

const JP_IMAGE_CARET_RIGHT_WHITE = 'jp-image-caretrightwhite'
*/

 /**
 * The class name added to a git-plugin session item expand button.
 */
const JP_IMAGE_CARET_DOWN = 'jp-image-caretdown'

const JP_IMAGE_CARET_RIGHT = 'jp-image-caretright'
/**
 * The class name added to a git-plugin session item collapse button.
const JP_IMAGE_CARET_RIGHT = 'jp-image-caretright'
 */

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
  export const git_file_Open = 'gf:Open'
  export const git_file_Unstage = 'gf:Unstage'
  export const git_file_Stage = 'gf:Stage'
  export const git_file_Track = 'gf:Track'
  export const git_file_Untrack = 'gf:Untrack'
  export const git_file_Discard = 'gf:Discard'
}

export namespace StatusFiles {
  export interface IState {
    commit_msg: string
    commit_disable: boolean
    staged_show: boolean
    unstaged_show: boolean
    untracked_show: boolean
    contextmenu_staged: any
    contextmenu_unstaged: any
    contextmenu_untracked: any
  }

  export interface IProps {
    current_fb_path: string
    top_repo_path: string
    staged_files: any
    unstaged_files: any
    untracked_files: any
    app: JupyterLab
    refresh: any
  }
}

export class StatusFiles extends React.Component<StatusFiles.IProps, StatusFiles.IState> {
  contextmenu_typeX: string
  contextmenu_typeY: string 
  contextmenu_file: string 

  constructor(props: StatusFiles.IProps) {
    super(props)
    const { commands} = this.props.app
    this.state = {
      commit_msg: '', 
      commit_disable: true, 
      staged_show: true, 
      unstaged_show: true, 
      untracked_show: true, 
      contextmenu_staged: new Menu({ commands }), 
      contextmenu_unstaged: new Menu({commands}), 
      contextmenu_untracked: new Menu({commands})
    }

    this.handleChange = this.handleChange.bind(this)
    this.init_input = this.init_input.bind(this)

    commands.addCommand(CommandIDs.git_file_Open, {
      label: 'Open',
      caption: 'Open selected file',
      execute: () => {
        try {
          open_listed_file(this.contextmenu_typeX, this.contextmenu_typeY, this.contextmenu_file, this.props.app)
         } catch (err) {}
      }
    })
    commands.addCommand(CommandIDs.git_file_Stage, {
      label: 'Stage',
      caption: 'Stage the changes of selected file',
      execute: () => {
        try {
          add_UnstagedNode(this.contextmenu_file, this.props.top_repo_path, this.props.refresh)
         } catch (err) {}
      }
    })
    commands.addCommand(CommandIDs.git_file_Track, {
      label: 'Track',
      caption: 'Start tracking selected file',
      execute: () => {
        try {
          add_UntrackedNode(this.contextmenu_file,  this.props.top_repo_path, this.props.refresh)
         } catch (err) {}
      }
    })
    commands.addCommand(CommandIDs.git_file_Unstage, {
      label: 'Unstage',
      caption: 'Unstage the changes of selected file',
      execute: () => {
        try {
          if (this.contextmenu_typeX !== 'D') {
            reset_StagedNode(this.contextmenu_file, this.props.top_repo_path, this.props.refresh)
          }
         } catch (err) {}
      }
    })
    commands.addCommand(CommandIDs.git_file_Discard, {
      label: 'Discard',
      caption: 'Discard recent changes of selected file',
      execute: () => {
        try {
          discard_UnstagedNode(this.contextmenu_file, this.props.top_repo_path, this.props.refresh)
         } catch (err) {}
      }
    })

    this.state.contextmenu_staged.addItem({ command: CommandIDs.git_file_Open })
    this.state.contextmenu_staged.addItem({ command: CommandIDs.git_file_Unstage})

    this.state.contextmenu_unstaged.addItem({ command: CommandIDs.git_file_Open })
    this.state.contextmenu_unstaged.addItem({ command: CommandIDs.git_file_Stage })
    this.state.contextmenu_unstaged.addItem({ command: CommandIDs.git_file_Discard })

    this.state.contextmenu_untracked.addItem({ command: CommandIDs.git_file_Open })
    this.state.contextmenu_untracked.addItem({ command: CommandIDs.git_file_Track })
  }

  handleClickStaged(event) {//need to disable native action first
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

  contextMenu_staged(event, typeX: string, typeY: string, file: string) {
      event.preventDefault()
      this.contextmenu_typeX = typeX
      this.contextmenu_typeY = typeY
      this.contextmenu_file = file
      this.state.contextmenu_staged.open(event.clientX, event.clientY)
  }

  contextMenu_unstaged(event, typeX: string,typeY: string, file:string) {
    event.preventDefault()
    this.contextmenu_typeX = typeX
    this.contextmenu_typeY = typeY
    this.contextmenu_file = file
    this.state.contextmenu_unstaged.open(event.clientX, event.clientY)
  }

  contextMenu_untracked(event, typeX: string, typeY: string, file: string) {
      event.preventDefault()
      this.contextmenu_typeX = typeX
      this.contextmenu_typeY = typeY
      this.contextmenu_file = file
      this.state.contextmenu_untracked.open(event.clientX, event.clientY)
  }
  

  handleChange(event) {
    if (event.target.value && event.target.value !== '') {
      this.setState({commit_msg:event.target.value,commit_disable:false})
    } else {
      this.setState({commit_msg:event.target.value,commit_disable:true})
    }
  }

  init_input() {
    this.setState({commit_msg:'',commit_disable:true})
  }

  /** to prevent ENTER key trigged 'submit' action during inputing commit msg*/
  onKeyPress(event) {
    if (event.which === 13 /* Enter */) {
      event.preventDefault()
    }
  }

  dropdown_staged() {
    this.setState({staged_show:!(this.state.staged_show)})
  }

  dropdown_unstaged() {
    this.setState({unstaged_show:!(this.state.unstaged_show)})
  }

  dropdown_untracked() {
    this.setState({untracked_show:!(this.state.untracked_show)})
  }

  commit_box_class_selection(disable: boolean, files_num: number) : string {
    if (disable) {
      if (files_num === 0) {
        return 'jp-Git-staged-commit-button-disable'
      } else {
        return 'jp-Git-staged-commit-button-ready'
      }
    } else {
        return 'jp-Git-staged-commit-button'
    }
  }

  render() {
    return (
      <div onContextMenu={(e)=>{e.preventDefault()}}>
        <div className= 'jp-Git-section-fileContainer' >
          <div className='jp-Git-staged'>       
            <span 
              className='jp-Git-staged-header-label'
            >
            Staged({(this.props.staged_files).length})
              <button 
                className={this.state.staged_show ? 
                `jp-Git-button ${JP_IMAGE_CARET_DOWN_WHITE}` 
                : `jp-Git-button ${JP_IMAGE_CARET_RIGHT_WHITE}`} 
                onClick={()=>this.dropdown_staged()}
              />
            </span>
            <ToggleDisplay show={this.props.staged_files.length > 0}>
              <button 
                className={`jp-Git-header-button ${GIT_BUTTON_RESET_WHITE}`} 
                title='Reset all staged changes' 
                onClick={() => {
                  reset_all_StagedNode(this.props.top_repo_path, this.props.refresh), 
                  this.init_input()
                  }} 
              />
            </ToggleDisplay>
          </div>
          <ToggleDisplay show={this.state.staged_show}>
          <div className= 'jp-Git-section-fileContainer'>
            <form className="jp-Git-staged-commit" onKeyPress={this.onKeyPress}>
            <textarea 
              className='jp-Git-staged-commit-msg' 
              disabled ={(this.props.staged_files).length === 0} 
              placeholder={(this.props.staged_files).length === 0 ? 
              'Stage your changes before commit'
              : 'Input message to commit staged changes'} 
              value={this.state.commit_msg} 
              onChange={this.handleChange}
            />
            <input 
              className={
                this.commit_box_class_selection(this.state.commit_disable, 
                this.props.staged_files.length)
              } 
              type="button" 
              title='Commit' 
              value={'\u2714'}  
              disabled={this.state.commit_disable} 
              onClick={() => 
                {commit_all_StagedNode(this.state.commit_msg,this.props.top_repo_path, this.props.refresh),
                  this.init_input()
               }
              }
            />
            </form>
            {this.props.staged_files.map((file, file_index) =>
              <li className={GIT_FILE} key={file_index}>
              <span className={`${GIT_FILE_ICON} ${parseFileExtension(file.to)}`} />
              <span 
                className={GIT_FILE_LABEL} 
                onContextMenu={(e) => {this.contextMenu_staged(e, file.x, file.y, file.to)}} 
                onDoubleClick={() => open_listed_file(file.x, file.y, file.to, this.props.app)}
              >
                {extractFilename(file.to)} [{file.x}]
              </span>
              <ToggleDisplay show={file.x !== 'D'}>
              <button 
                className={`jp-Git-button ${GIT_BUTTON_RESET}`} 
                title='Reset this staged change' 
                onClick={() => {
                  reset_StagedNode(file.to, this.props.top_repo_path, this.props.refresh), 
                  this.props.staged_files.length === 1 ? this.init_input() : {}
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
            Unstaged({(this.props.unstaged_files).length})
          </span>  
          <ToggleDisplay show={this.props.unstaged_files.length>0}>
          <button 
            className={this.state.unstaged_show ? 
              `jp-Git-button ${JP_IMAGE_CARET_DOWN}` 
              : `jp-Git-button ${JP_IMAGE_CARET_RIGHT}`
            } 
            onClick={() => this.dropdown_unstaged()} 
          />
          <button 
            className={`jp-Git-header-button ${GIT_BUTTON_ADD}`} 
            title='Stage all the changes' 
            onClick={() => add_all_UnstagedNode(this.props.top_repo_path, this.props.refresh)} 
          />
          <button 
            className={`jp-Git-header-button ${GIT_BUTTON_DISCARD}`} 
            title='Discard all the changes' 
            onClick={() => discard_all_UnstagedNode(this.props.top_repo_path, this.props.refresh)}
          />
          </ToggleDisplay>
        </div>
        <ToggleDisplay show={this.state.unstaged_show}>
        <div className= 'jp-Git-section-fileContainer'>
          {this.props.unstaged_files.map((file, file_index)=>
            <li className={GIT_FILE} key={file_index}>
            <span className={`${GIT_FILE_ICON} ${parseFileExtension(file.to)}`} />
            <span 
              className={GIT_FILE_LABEL} 
              onContextMenu={(e) => {this.contextMenu_unstaged(e, file.x, file.y, file.to)}} 
              onDoubleClick={() => open_listed_file(file.x, file.y, file.to, this.props.app)}
            >
              {extractFilename(file.to)} [{file.y}]
            </span>
            <button 
              className= {`jp-Git-button ${GIT_BUTTON_DISCARD}`} 
              title='Discard this change' 
              onClick={() => {
                discard_UnstagedNode(file.to, this.props.top_repo_path, this.props.refresh)
                }
               } 
            />
            <button 
              className= {`jp-Git-button ${GIT_BUTTON_ADD}`} 
              title='Stage this change' 
              onClick={() => {
                add_UnstagedNode(file.to, this.props.top_repo_path, this.props.refresh)
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
              Untracked({(this.props.untracked_files).length})
            </span>
            <ToggleDisplay show={this.props.untracked_files.length > 0}>
              <button 
                className={this.state.untracked_show ? 
                  `jp-Git-button ${JP_IMAGE_CARET_DOWN}` 
                  : `jp-Git-button ${JP_IMAGE_CARET_RIGHT}`
                } 
                onClick={() => this.dropdown_untracked()} 
              />
              <button 
                className={`jp-Git-header-button ${GIT_BUTTON_TRACK}`} 
                title='Track all the files' 
                onClick={() => {
                  add_all_UntrackedNode(this.props.top_repo_path, this.props.refresh)
                  }
                } 
              />
            </ToggleDisplay>
          </div>
          <ToggleDisplay show={this.state.untracked_show}>
          <div className= 'jp-Git-section-fileContainer'>
            {this.props.untracked_files.map((file, file_index) =>
              <li className={GIT_FILE} key={file_index}>
              <span className={`${GIT_FILE_ICON} ${parseFileExtension(file.to)}`} />
              <span 
                className={GIT_FILE_LABEL} 
                onContextMenu={(e) => {this.contextMenu_untracked(e, file.x, file.y, file.to)}} 
                onDoubleClick={() => open_listed_file(file.x,file.y,file.to,this.props.app)}
              >
                {extractFilename(file.to)}
              </span>
              <button 
                className= {`jp-Git-button ${GIT_BUTTON_TRACK}`} 
                title='Track this file' 
                onClick={() => {
                  add_UntrackedNode(file.to, this.props.top_repo_path, this.props.refresh)
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

/** Open a file in the git listing */
async function open_listed_file(typeX: string,typeY: string, path: string, app: JupyterLab) {
  if (typeX === 'D'||typeY === 'D') {
    showDialog(
      {
        title: 'Open File Failed',
        body: "This file has been deleted!",
        buttons: [Dialog.warnButton({ label: 'OK'})]
      }
    ).then(result => {
      if (result.button.accept) {
        return
      }
    })
   return
  } try {
    let ll = app.shell.widgets('left')
    let fb = ll.next()
    while (fb.id !== 'filebrowser') {
      fb = ll.next()
    }
    let git_temp = new Git()
    let response = await git_temp.showprefix((fb as any).model.path)
    let current_under_repo_path = (response as GitShowPrefixResult).under_repo_path
    let filebrowser_cur_path = (fb as any).model.path+'/'
    let open_file_path = filebrowser_cur_path
    .substring(0,filebrowser_cur_path.length - current_under_repo_path.length)
    if (path[path.length - 1] !== '/') {
      (fb as any)._listing._manager.openOrReveal(open_file_path + path)
    } else {
      console.log("Cannot open a folder here")
    } 
  } catch(err) {}
}

/** Reset all staged files */
function reset_all_StagedNode(path: string, refresh) {
  let git_temp = new Git()
  git_temp.reset(true, null, path).then(response => {
    refresh()
  })
}

/** Commit all staged files */
function commit_all_StagedNode(msg: string, path: string, refresh) {
  if (msg && msg !== '') {
    let git_temp = new Git()
     git_temp.commit(msg, path).then(response => {
        refresh()
    })
  }
}

/** Reset a specific staged file */
function reset_StagedNode(file: string, path: string, refresh) {
  let git_temp = new Git()
  git_temp.reset(false, file, path).then(response => {
    refresh()
  })
}


/** Add all unstaged files */
function add_all_UnstagedNode(path: string, refresh) {
  let git_temp = new Git()
  git_temp.add(true, null, path).then(response => {
    refresh()
  })
}

/** Discard changes in all unstaged files */
function discard_all_UnstagedNode(path: string, refresh) {
  let git_temp = new Git()
  showDialog(
    {
      title: 'DISCARD CHANGES',
      body: "Do you really want to discard all uncommitted changes?",
      buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard'})]
    }
  ).then(result => {
    if (result.button.accept) {
      git_temp.checkout(false, false, null, true, null, path).then(response => {
        refresh()
      })
    }
  })
}

/** Add a specific unstaged file */
function add_UnstagedNode(file: string, path: string, refresh) {
  let git_temp = new Git()
  git_temp.add(false, file, path).then(response => {
    refresh()
  })
}

/** Discard changes in a specific unstaged file */
function discard_UnstagedNode(file: string, path: string, refresh) {
  let git_temp = new Git()
  showDialog(
    {
      title: 'DISCARD CHANGES',
      body: "Do you really want to discard the uncommitted changes in this file?",
      buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard'})]
    }
  ).then(result => {
    if (result.button.accept) {
      git_temp.checkout(false, false, null, false, file, path).then(response => {
        refresh()
      })
    }
  })
}

/** Add all untracked files */
function add_all_UntrackedNode(path: string, refresh) {
  let git_temp = new Git()
  git_temp.add_all_untracked(path).then(response => {
    refresh()
  })
}

/** Add a specific untracked file */
function add_UntrackedNode(file: string, path: string, refresh) {
  let git_temp = new Git()
  git_temp.add(false, file, path).then(response => {
    refresh()
  })
}

/** Get the filename from a path */
function extractFilename(path: string): string {
  if (path[path.length - 1] === '/') {
    return path
  } else {
    let temp = path.split('/')
    return temp[temp.length - 1]
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