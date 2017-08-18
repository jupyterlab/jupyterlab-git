import * as React from 'react';
import ToggleDisplay from 'react-toggle-display'
import {
  Dialog, showDialog
} from '@jupyterlab/apputils';

import {
  JupyterLab
} from '@jupyterlab/application';

import {
  PathExt 
} from '@jupyterlab/coreutils';

import {
  Git, GitShowPrefixResult
} from '../git'

import '../../style/index.css';

/**
 * The class name added to the git-plugin sessions items.
 */
const GIT_FILE = 'jp-Git-file';

/**
 * The class name added to a git-plugin session item icon.
 */
const GIT_FILE_ICON = 'jp-Git-fileIcon';

/**
 * The class name added to a git-plugin session item label.
 */
const GIT_FILE_LABEL = 'jp-Git-fileLabel';


/**
 * The class name added to a git-plugin session item git-add button.
 */
const GIT_BUTTON_ADD = 'jp-Git-button-add';

/**
 * The class name added to a git-plugin session item git-reset button.
 */
const GIT_BUTTON_RESET = 'jp-Git-button-reset';

/**
 * The class name added to a git-plugin session item git-reset button.
 */
const GIT_BUTTON_RESET_WHITE = 'jp-Git-button-reset-white';


/**
 * The class name added to a git-plugin session item discard button.
 */
const GIT_BUTTON_DISCARD = 'jp-Git-button-discard';

/**
 * The class name added to a git-plugin session item track button.
 */
const GIT_BUTTON_TRACK = 'jp-Git-button-track';

 /**
 * The class name added to a git-plugin session item white expand button.
 */
const GIT_BUTTON_TRIANGLE_DOWN_WHITE = 'jp-Git-button-triangle-down-white';


/**
 * The class name added to a git-plugin session item white collapse button.

const GIT_BUTTON_TRIANGLE_RIGHT_WHITE = 'jp-Git-button-triangle-right-white';
*/

 /**
 * The class name added to a git-plugin session item expand button.
 */
const GIT_BUTTON_TRIANGLE_DOWN = 'jp-Git-button-triangle-down';

/**
 * The class name added to a git-plugin session item collapse button.
const GIT_BUTTON_TRIANGLE_RIGHT = 'jp-Git-button-triangle-right';
 */

/**
 * The class name added to a markdown file browser item.
 */
const MARKDOWN_ICON_CLASS = 'jp-MarkdownIcon';

/**
 * The class name added to a python file browser item.
 */
const PYTHON_ICON_CLASS = 'jp-PythonIcon';

/**
 * The class name added to a JSON file browser item.
 */
const JSON_ICON_CLASS = 'jp-JSONIcon';

/**
 * The class name added to a speadsheet file browser item.
 */
const SPREADSHEET_ICON_CLASS = 'jp-SpreadsheetIcon';

/**
 * The class name added to a R Kernel file browser item.
 */
const RKERNEL_ICON_CLASS = 'jp-RKernelIcon';

/**
 * The class name added to a YAML file browser item.
 */
const YAML_ICON_CLASS = 'jp-YamlIcon';

/**
 * The class added for image file browser items.
 */
const IMAGE_ICON_CLASS = 'jp-ImageIcon';

/**
 * The class name added to a file type content item.
 */
const FILE_TYPE_CLASS = 'jp-FileIcon';

/**
 * The class name added to a directory file browser item.
 */
const FOLDER_MATERIAL_ICON_CLASS = 'jp-OpenFolderIcon';

export namespace StatusFiles {
  export
  interface IState {
    commit_msg:string;
    commit_disable:boolean
    staged_show:boolean
    unstaged_show:boolean
    untracked_show:boolean
  }

  export
  interface IProps {
    current_fb_path:string;
    top_repo_path: string;

    staged_files: any;
    unstaged_files: any;
    untracked_files: any;
    
    app:JupyterLab;
    refresh: any;
  }
}

export class StatusFiles extends React.Component<StatusFiles.IProps, StatusFiles.IState>{
  constructor(props: StatusFiles.IProps) {
    super(props);
    this.state={commit_msg:'', commit_disable:true, staged_show:true, unstaged_show:true, untracked_show:true};
    this.handleChange = this.handleChange.bind(this);
    this.init_input = this.init_input.bind(this)
  }
  handleChange(event){
    if(event.target.value&&event.target.value!=''){
      this.setState({commit_msg:event.target.value,commit_disable:false});
    }
    else{
      this.setState({commit_msg:event.target.value,commit_disable:true});
    }
  }

  init_input(){
    this.setState({commit_msg:'',commit_disable:true});
  }

  /** to prevent ENTER key trigged 'submit' action during inputing commit msg*/
  onKeyPress(event){
    if (event.which === 13 /* Enter */) {
      event.preventDefault();
    }
  }

  dropdown_staged(){
    this.setState({staged_show:!(this.state.staged_show)});
  }

  dropdown_unstaged(){
    this.setState({unstaged_show:!(this.state.unstaged_show)});
  }

  dropdown_untracked(){
    this.setState({untracked_show:!(this.state.untracked_show)});
  }

  commit_box_class_selection(disable:boolean, files_num:number):string{
    if(disable) {
      if(files_num==0){
        return 'jp-Git-staged-commit-button-disable'
      }
      else{
        return 'jp-Git-staged-commit-button-ready';
      }
    }
    else{
        return 'jp-Git-staged-commit-button';
    }
  }

  render(){
    return (
      <div>
        <div className= 'jp-Git-section-fileContainer'>
          <div className='jp-Git-staged'>       
              <span className='jp-Git-staged-header-label'> Staged({(this.props.staged_files).length})<button className={`jp-Git-button ${GIT_BUTTON_TRIANGLE_DOWN_WHITE}`} onClick={()=>this.dropdown_staged()}></button></span>
              <ToggleDisplay show={this.props.staged_files.length>0}>
              
              <button className={`jp-Git-header-button ${GIT_BUTTON_RESET_WHITE}`} title='Reset all staged changes' onClick={()=>reset_all_StagedNode(this.props.top_repo_path, this.props.refresh)}></button>
              </ToggleDisplay>
          </div>
          <ToggleDisplay show={this.state.staged_show}>
          <div className= 'jp-Git-section-fileContainer'>

             <form className="jp-Git-staged-commit" onKeyPress={this.onKeyPress}>
              <textarea className='jp-Git-staged-commit-msg' disabled ={(this.props.staged_files).length==0} placeholder={(this.props.staged_files).length==0?'Stage your changes before commit':'Input message to commit staged changes'} value={this.state.commit_msg} onChange={this.handleChange}/>
              <input className={this.commit_box_class_selection(this.state.commit_disable, this.props.staged_files.length)} type="button" title='Commit' value={'\u2714'}  disabled={this.state.commit_disable} onClick={()=>{commit_all_StagedNode(this.state.commit_msg,this.props.top_repo_path, this.props.refresh),this.init_input()}}/>
              </form>
              
                {this.props.staged_files.map((file, file_index)=>
                    <li className={GIT_FILE} key={file_index}>
                    <span className={`${GIT_FILE_ICON} ${parseFileExtension(file.to)}`} />
                    <span className={GIT_FILE_LABEL} onDoubleClick={()=>open_listed_file(file.x,file.y,file.to,this.props.app)} >{file.to}[{file.x}]</span>
                    <ToggleDisplay show={file.x!='D'}>
                    <button className={`jp-Git-button ${GIT_BUTTON_RESET_WHITE}`} title='Reset this staged change' onClick={()=>reset_StagedNode(file.to, this.props.top_repo_path, this.props.refresh)}></button>
                    </ToggleDisplay>
                    </li>
                )}
          </div>
          </ToggleDisplay>
          </div>
         <div className= 'jp-Git-section-fileContainer'>
          <div className='jp-Git-unstaged' >
              <span className='jp-Git-unstaged-header-label'> Unstaged({(this.props.unstaged_files).length})</span>  
              <ToggleDisplay show={this.props.unstaged_files.length>0}>
              <button className={`jp-Git-button ${GIT_BUTTON_TRIANGLE_DOWN}`} onClick={()=>this.dropdown_unstaged()}></button>
              <button className={`jp-Git-header-button ${GIT_BUTTON_ADD}`} title='Stage all the changes' onClick={()=>add_all_UnstagedNode(this.props.top_repo_path, this.props.refresh)}></button>
              <button className={`jp-Git-header-button ${GIT_BUTTON_DISCARD}`} title='Discard all the changes' onClick={()=>discard_all_UnstagedNode(this.props.top_repo_path, this.props.refresh)}></button>
              </ToggleDisplay>
          </div>
          <ToggleDisplay show={this.state.unstaged_show}>
          <div className= 'jp-Git-section-fileContainer'>
                {this.props.unstaged_files.map((file, file_index)=>
                    <li className={GIT_FILE} key={file_index}>
                    <span className={`${GIT_FILE_ICON} ${parseFileExtension(file.to)}`} />
                    <span className={GIT_FILE_LABEL} onDoubleClick={()=>open_listed_file(file.x,file.y,file.to,this.props.app)}>{file.to}[{file.y}]</span>
                    <button className= {`jp-Git-button ${GIT_BUTTON_DISCARD}`} title='Discard this change' onClick={()=>discard_UnstagedNode(file.to, this.props.top_repo_path, this.props.refresh)}></button>
                    <button className= {`jp-Git-button ${GIT_BUTTON_ADD}`} title='Stage this change' onClick={()=>add_UnstagedNode(file.to, this.props.top_repo_path, this.props.refresh)}></button>
                    </li>
                )}
          </div>
          </ToggleDisplay>
          </div>

        <div className= 'jp-Git-section-fileContainer'>
          <div className='jp-Git-untracked' >
              <span className='jp-Git-untracked-header-label'> Untracked({(this.props.untracked_files).length})</span>
              <ToggleDisplay show={this.props.untracked_files.length>0}>
              <button className={`jp-Git-button ${GIT_BUTTON_TRIANGLE_DOWN}`} onClick={()=>this.dropdown_untracked()}></button>
              <button className={`jp-Git-header-button ${GIT_BUTTON_TRACK}`} title='Track all the files' onClick={()=>add_all_UntrackedNode(this.props.top_repo_path, this.props.refresh)}></button>
              </ToggleDisplay>
          </div>
          <ToggleDisplay show={this.state.untracked_show}>
          <div className= 'jp-Git-section-fileContainer'>
                {this.props.untracked_files.map((file, file_index)=>
                    <li className={GIT_FILE} key={file_index}>
                    <span className={`${GIT_FILE_ICON} ${parseFileExtension(file.to)}`} />
                    <span className={GIT_FILE_LABEL} onDoubleClick={()=>open_listed_file(file.x,file.y,file.to,this.props.app)}>{file.to}</span>
                    <button className= {`jp-Git-button ${GIT_BUTTON_TRACK}`} title='Track this file' onClick={()=>add_UntrackedNode(file.to, this.props.top_repo_path, this.props.refresh)}></button>
                    </li>
                )}
           </div>
           </ToggleDisplay>
           </div>
      </div>
    );
  }
}

//function for opening files
async function open_listed_file(typeX: string,typeY: string, path:string, app:JupyterLab){
  if(typeX=='D'||typeY=='D'){
    showDialog({
      title: 'Open File Failed',
      body: "This file has been deleted!",
      buttons: [Dialog.warnButton({ label: 'OK'})]
    }).then(result => {
      if (result.button.accept) {
      return;
      }
    });
   return;
  }
  try{
    let ll = app.shell.widgets('left');
    let fb = ll.next();
    while(fb.id!='filebrowser'){
      fb = ll.next();
    }
    let git_temp = new Git();
    let response = await git_temp.showprefix((fb as any).model.path);
    let current_under_repo_path = (response as GitShowPrefixResult).under_repo_path;
    let filebrowser_cur_path = (fb as any).model.path+'/';
    let open_file_path = filebrowser_cur_path.substring(0,filebrowser_cur_path.length-current_under_repo_path.length);
    if(path[path.length-1]!=='/'){
      (fb as any)._listing._manager.openOrReveal(open_file_path+path);
    }
    else{
      console.log("Cannot open a folder here")
    }; 
  }catch(err0){}
}

//functions for staged nodes
function reset_all_StagedNode(path:string, refresh){
  let git_temp = new Git();
  git_temp.reset(true,null,path).then(response=>{
    refresh();
  });
}

function commit_all_StagedNode(msg:string, path:string, refresh){
  if(msg&&msg!=''){
    let git_temp = new Git();
     git_temp.commit(msg, path).then(response=>{
        refresh();
      });
  }
}

function reset_StagedNode(file:string, path:string, refresh){
  let git_temp = new Git();
  git_temp.reset(false, file, path).then(response=>{
    refresh();
  });
}


//functions for unstaged nodes
function add_all_UnstagedNode(path:string,refresh){
  let git_temp = new Git();
  git_temp.add(true,null, path).then(response=>{
    refresh();
  });
}

function discard_all_UnstagedNode(path:string,refresh){
  let git_temp = new Git();
  showDialog({
    title: 'DISCARD CHANGES',
    body: "Do you really want to discard all uncommitted changes?",
    buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard'})]
  }).then(result => {
    if (result.button.accept) {
      git_temp.checkout(false,false, null,true,null,path).then(response=>{
        refresh();
      });
    }
  });
}

function add_UnstagedNode(file:string, path:string, refresh){
  let git_temp = new Git();
  git_temp.add(false, file, path).then(response=>{
    refresh();
  });
}

function discard_UnstagedNode(file:string, path:string, refresh){
  let git_temp = new Git();
  showDialog({
    title: 'DISCARD CHANGES',
    body: "Do you really want to discard the uncommitted changes in this file?",
    buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard'})]
  }).then(result => {
    if (result.button.accept) {
      git_temp.checkout(false,false, null,false,file,path).then(response=>{
        refresh();
      });
    }
  });
}

//functions for untracked nodes
function add_all_UntrackedNode(path:string,refresh){
  console.log('add all untracked')
  let git_temp = new Git();
  git_temp.add_all_untracked(path).then(response=>{
    refresh();
  });
}

function add_UntrackedNode(file:string, path:string,refresh){
  let git_temp = new Git();
  git_temp.add(false, file, path).then(response=>{
    refresh();
  });
}


export function parseFileExtension(path: string): string {
  if(path[path.length-1]==='/'){
    return FOLDER_MATERIAL_ICON_CLASS;
  }
  var fileExtension = PathExt.extname(path).toLocaleLowerCase();
  switch (fileExtension) {
    case '.md':
      return MARKDOWN_ICON_CLASS;
    case '.py':
      return PYTHON_ICON_CLASS;
    case '.json':
      return JSON_ICON_CLASS;
    case '.csv':
      return SPREADSHEET_ICON_CLASS;
    case '.xls':
      return SPREADSHEET_ICON_CLASS;
    case '.r':
      return RKERNEL_ICON_CLASS;
    case '.yml':
      return YAML_ICON_CLASS;
    case '.yaml':
      return YAML_ICON_CLASS;
    case '.svg':
      return IMAGE_ICON_CLASS;
    case '.tiff':
      return IMAGE_ICON_CLASS;
    case '.jpeg':
      return IMAGE_ICON_CLASS;
    case '.jpg':
      return IMAGE_ICON_CLASS;
    case '.gif':
      return IMAGE_ICON_CLASS;
    case '.png':
      return IMAGE_ICON_CLASS;
    case '.raw':
      return IMAGE_ICON_CLASS;
    default:
      return FILE_TYPE_CLASS;
  }
}



