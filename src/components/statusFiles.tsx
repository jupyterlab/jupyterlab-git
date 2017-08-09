import * as React from 'react';
import * as ReactDOM from 'react-dom';
import ToggleDisplay from 'react-toggle-display'
//import ReactWidget from 'react-widgets';
import {
  ServiceManager, Session, TerminalSession
} from '@jupyterlab/services';

import {
  Message
} from '@phosphor/messaging';

import {
  ElementExt
} from '@phosphor/domutils';

import {
  Widget//, Menu
} from '@phosphor/widgets';

import {
  DOMUtils, Dialog, showDialog,/*Styling,*/// IMainMenu
} from '@jupyterlab/apputils';

import {
  JupyterLab
} from '@jupyterlab/application';

import {
	  FileBrowser
} from '@jupyterlab/filebrowser';

import {
  PathExt //URLExt
} from '@jupyterlab/coreutils';

import * as vdom from '@phosphor/virtualdom';

import {
  VDomModel, VDomRenderer
} from '@jupyterlab/apputils';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  Git, GitBranchResult,GitStatusResult,GitShowPrefixResult,GitShowTopLevelResult,GitLogResult,GitErrorInfo,SingleCommitInfo, SingleCommitFilePathInfo, CommitModifiedFile
} from '../git'

import '../../style/index.css';
import $ = require('jquery');
/**
 * The class name added to a git-plugin widget.
 */
const Git_CLASS = 'jp-GitSessions';

/**
 * The class name added to a git-plugin widget header.
 */
const HEADER_CLASS = 'jp-GitSessions-header';

const SHIFT_LEFT_BUTTON_CLASS = 'jp-GitSessions-headershiftleftbutton';
const SHIFT_RIGHT_BUTTON_CLASS = 'jp-GitSessions-headershiftrightbutton';
const CUR_BUTTON_CLASS = 'jp-GitSessions-headercurbutton'; 

/**
 * The class name added to a git-plugin widget header refresh button.
 */
const REFRESH_CLASS = 'jp-GitSessions-headerRefresh';
/**
 * The class name added to a git-plugin widget header refresh button.
 */
const SWITCH_BRANCH_CLASS = 'jp-GitSessions-headerSwitchBranch';
/**
 * The class name added to a git-plugin widget header refresh button.
 */
const NEW_TERMINAL_CLASS = 'jp-GitSessions-headerNewTerminal';
/**
 * The class name added to the git-plugin terminal sessions section.
 */
const SECTION_CLASS = 'jp-GitSessions-section';

const PATH_HEADER_CLASS = 'jp-GitSessions-pathHeaderSection';

const PAST_COMMIT_CLASS = 'jp-GitSessions-pastcommitsection';

const PAST_COMMIT_INFO_CLASS = 'jp-GitSessions-pastcommitinfoSection';
/**
 * The class name added to the git-plugin terminal sessions section.
 */
const STAGED_HEADER_CLASS = 'jp-GitSessions-stagedsectionHeader';

/**
 * The class name added to the git-plugin kernel sessions section.
 */
const UNTRACKED_HEADER_CLASS = 'jp-GitSessions-untrackedsectionHeader';

const UNSTAGED_HEADER_CLASS = 'jp-GitSessions-unstagedsectionHeader';

/**
 * The class name added to the git-plugin sessions section header.
 */
const SECTION_HEADER_CLASS = 'jp-GitSessions-sectionHeader';

const COMMIT_INPUT_BOX = 'jp-GitSessions-commitinputBox';

/**
 * The class name added to a section container.
 */
const GIT_WHOLE_CONTAINER_CLASS = 'jp-GitSessions-sectionGitWholeContainer';
const TOP_CONTAINER_CLASS = 'jp-GitSessions-sectionTopContainer';
const CONTAINER_CLASS = 'jp-GitSessions-sectionContainer';
const PAST_COMMIT_CONTAINER_CLASS = 'jp-GitSessions-sectionPastCommitContainer';
const PAST_SINGLE_COMMIT_CONTAINER_CLASS = 'jp-GitSessions-sectionPastSingleCommitContainer';
const PAST_COMMIT_BUTTON_CLASS = 'jp-GitSessions-sectionPastCommitButton';
//const PAST_COMMIT_SELECTED_BUTTON_CLASS = 'jp-GitSessions-sectionPastCommitSelectedButton';
/**
 * The class name added to the git-plugin kernel sessions section list.
 */
const LIST_CLASS = 'jp-GitSessions-sectionList';

const PAST_COMMIT_LIST_CLASS = 'jp-GitSessions-sectionPastCommitList';
const PAST_COMMIT_INFO_SECTION_HEADER_CLASS = 'jp-GitSessions-pastcommitinfosectionHeader';
const PAST_COMMIT_INFO_LABEL_CLASS = 'jp-GitSessions-pastcommitinfoLabel';
/**
 * The class name added to the git-plugin sessions items.
 */
const ITEM_CLASS = 'jp-GitSessions-item';

/**
 * The class name added to a git-plugin session item icon.
 */
const ITEM_ICON_CLASS = 'jp-GitSessions-itemIcon';

/**
 * The class name added to a git-plugin session item label.
 */
const ITEM_LABEL_CLASS = 'jp-GitSessions-itemLabel';


/**
 * The class name added to a git-plugin session item git-add button.
 */
const ADD_BUTTON_CLASS = 'jp-GitSessions-itemAdd';
/**
 * The class name added to a git-plugin session item git-reset button.
 */
const RESET_BUTTON_CLASS = 'jp-GitSessions-itemReset';
/**
 * The class name added to a git-plugin session item git-checkout button.
 */
//const CHECKOUT_BUTTON_CLASS = 'jp-GitSessions-itemCheckout';
/**
 * The class name added to a git-plugin session item git-commit button.
 */
const COMMIT_BUTTON_CLASS = 'jp-GitSessions-itemCommit';

/**
 * The class name added to a notebook icon.
 */
const NOTEBOOK_ICON_CLASS = 'jp-mod-notebook';

/**
 * The class name added to a console icon.
 */
const CONSOLE_ICON_CLASS = 'jp-mod-console';

/**
 * The class name added to a file icon.
 */
const FILE_ICON_CLASS = 'jp-mod-file';

/**
 * The class name added to a terminal icon.
 */
const TERMINAL_ICON_CLASS = 'jp-mod-terminal';
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

const HOME_ICON_CLASS = 'jp-homeIcon';
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
/**
 * The class name added to a csv toolbar widget.
 */
const CSV_TOOLBAR_CLASS = 'jp-CSVToolbar';

const CSV_TOOLBAR_LABEL_CLASS = 'jp-CSVToolbar-label';

/**
 * The class name added to a csv toolbar's dropdown element.
 */
const CSV_TOOLBAR_DROPDOWN_CLASS = 'jp-CSVToolbar-dropdown';

/**
 * The duration of auto-refresh in ms.
 */
const REFRESH_DURATION = 50000;

/**
 * The enforced time between refreshes in ms.
 */
const MIN_REFRESH = 5000;

export namespace StatusFiles {
  export
  interface IState {
    commit_msg:string;
    commit_disable:boolean
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
    this.state={commit_msg:'', commit_disable:true};
    this.handleChange = this.handleChange.bind(this);
    this.init_input = this.init_input.bind(this);
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
    this.setState({commit_msg:''});
  }

  render(){
    return (
      <div ref="three_sections_for_current_work">
          <div className={STAGED_HEADER_CLASS} >
            <form>
            <label>
              <input className={COMMIT_INPUT_BOX} type="text" placeholder='Input message to commit staged changes'onChange={this.handleChange}/>
              </label>
              <input type="button" value={'\u2714'}  disabled={this.state.commit_disable} onClick={()=>{commit_all_StagedNode(this.state.commit_msg,this.props.top_repo_path, this.props.refresh),this.init_input()}}/>
              </form>
            
              <span className={ITEM_LABEL_CLASS}> Staged({(this.props.staged_files).length})</span>
              <button className={`${RESET_BUTTON_CLASS} jp-mod-styled`}onClick={()=>reset_all_StagedNode(this.props.top_repo_path, this.props.refresh)}>Reset</button>
              {/*<button className={`${COMMIT_BUTTON_CLASS} jp-mod-styled`} onClick={()=>commit_all_StagedNode(this.props.top_repo_path, this.props.refresh)}>Commit</button>*/}
          </div>
          <div className= 'jp-GitSessions-sectionContainer'>
              <ul>
                {this.props.staged_files.map((file)=>
                    <li className={ITEM_CLASS}>
                    <span className={`${ITEM_ICON_CLASS} ${parseFileExtension(file)}`} />
                    <span className={ITEM_LABEL_CLASS} onDoubleClick={()=>open_listed_file(file,this.props.app)} >{file}</span>
                    <button className= {`${RESET_BUTTON_CLASS} jp-mod-styled`} onClick={()=>reset_StagedNode(file, this.props.top_repo_path, this.props.refresh)}> reset </button>
                    </li>
                )}
              </ul>
          </div>


          <div className={UNSTAGED_HEADER_CLASS} >
              <span className={ITEM_LABEL_CLASS}> Unstaged({(this.props.unstaged_files).length})</span>
              <button className={`${ADD_BUTTON_CLASS} jp-mod-styled`} onClick={()=>add_all_UnstagedNode(this.props.top_repo_path, this.props.refresh)}>Add</button>
              <button className={`${RESET_BUTTON_CLASS} jp-mod-styled`} onClick={()=>discard_all_UnstagedNode(this.props.top_repo_path, this.props.refresh)}>Discard</button>
          </div>
          <div className= 'jp-GitSessions-sectionContainer'>
              <ul>
                {this.props.unstaged_files.map((file)=>
                    <li className={ITEM_CLASS}>
                    <span className={`${ITEM_ICON_CLASS} ${parseFileExtension(file)}`} />
                    <span className={ITEM_LABEL_CLASS} onDoubleClick={()=>open_listed_file(file,this.props.app)}>{file}</span>
                    <button className= {`${ADD_BUTTON_CLASS} jp-mod-styled`} onClick={()=>add_UnstagedNode(file, this.props.top_repo_path, this.props.refresh)}> add </button>
                    <button className= {`${RESET_BUTTON_CLASS} jp-mod-styled`} onClick={()=>discard_UnstagedNode(file, this.props.top_repo_path, this.props.refresh)}> discard </button>
                    </li>
                )}
              </ul>
          </div>

          <div className={UNTRACKED_HEADER_CLASS} >
              <span className={ITEM_LABEL_CLASS}> Untracked({(this.props.untracked_files).length})</span>
              <button className={`${ADD_BUTTON_CLASS} jp-mod-styled`}>Add</button>
          </div>
          <div className= 'jp-GitSessions-sectionContainer'>
              <ul>
                {this.props.untracked_files.map((file)=>
                    <li className={ITEM_CLASS}>
                    <span className={`${ITEM_ICON_CLASS} ${parseFileExtension(file)}`} />
                    <span className={ITEM_LABEL_CLASS} onDoubleClick={()=>open_listed_file(file,this.props.app)}>{file}</span>
                    <button className= {`${ADD_BUTTON_CLASS} jp-mod-styled`}onClick={()=>add_UntrackedNode(file, this.props.top_repo_path, this.props.refresh)}> add </button>
                    </li>
                )}
              </ul>
           </div>
      </div>
    );
  }
}

//function for opening files
async function open_listed_file(path:string, app:JupyterLab){
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


  /*
  let git_temp = new Git();
  let input = new Widget({ node: document.createElement('input') });
  showDialog({
    title: 'Input commit message:',
    body: input,
    focusNodeSelector: 'input',
    buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Commit'})]
  }).then(result => {
    let msg = (input.node as HTMLInputElement).value ;
    console.log(msg);
    if (result.button.accept&&msg) {
      git_temp.commit(msg, path).then(response=>{
        refresh();
      });
    }
  });
  */
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
  let input = new Widget({ node: document.createElement('input') });
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
  let input = new Widget({ node: document.createElement('input') });
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



