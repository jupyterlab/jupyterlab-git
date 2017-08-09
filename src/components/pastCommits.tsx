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

import {
  PathHeader
} from './pathHeader'

import {
  BranchHeader
} from './branchHeader'



import {
  StatusFiles, parseFileExtension
} from './statusFiles'

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

const SHIFT_LEFT_BUTTON_CLASS = 'jp-mod-left';
const SHIFT_RIGHT_BUTTON_CLASS = 'jp-mod-right';
const CUR_BUTTON_CLASS = 'jp-mod-current'; 

/**
 * The class name added to a git-plugin widget header refresh button.
 */
const REFRESH_CLASS  = 'jp-Git-repo-refresh';
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
const UNCOMMITTED_CLASS = 'jp-GitSessions-uncommittedSection';

/**
 * The class name added to the git-plugin kernel sessions section.
 */
const UNTRACKED_CLASS = 'jp-GitSessions-untrackedSection';

const UNSTAGED_CLASS = 'jp-GitSessions-unstagedSection';

/**
 * The class name added to the git-plugin sessions section header.
 */
const SECTION_HEADER_CLASS = 'jp-GitSessions-sectionHeader';

/**
 * The class name added to a section container.
 */
const GIT_WHOLE_CONTAINER_CLASS = 'jp-GitSessions-sectionGitWholeContainer';
const TOP_CONTAINER_CLASS = 'jp-Git-timeline';
const CONTAINER_CLASS = 'jp-GitSessions-sectionContainer';
const PAST_COMMIT_CONTAINER_CLASS = 'jp-GitSessions-sectionPastCommitContainer';
const PAST_SINGLE_COMMIT_CONTAINER_CLASS = 'jp-GitSessions-sectionPastSingleCommitContainer';
const PAST_COMMIT_BUTTON_CLASS = 'jp-Git-timeline-commit';
//const PAST_COMMIT_SELECTED_BUTTON_CLASS = 'jp-GitSessions-sectionPastCommitSelectedButton';
/**
 * The class name added to the git-plugin kernel sessions section list.
 */
const LIST_CLASS = 'jp-GitSessions-sectionList';

const PAST_COMMIT_LIST_CLASS =  'jp-Git-timeline-container';
const PAST_COMMIT_INFO_SECTION_HEADER_CLASS = 'jp-Git-commit-header';
const PAST_COMMIT_INFO_LABEL_CLASS = 'jp-Git-commit-info' //'jp-GitSessions-pastcommitinfoLabel';
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
const REPO_CLASS = 'jp-Git-repo-path';



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
const CSV_TOOLBAR_CLASS = 'jp-Git-branch';

const CSV_TOOLBAR_LABEL_CLASS = 'jp-Git-branch-dropdown';

/**
 * The class name added to a csv toolbar's dropdown element.
 */
const CSV_TOOLBAR_DROPDOWN_CLASS = 'jp-Git-branch-icon';

/**
 * The duration of auto-refresh in ms.
 */
const REFRESH_DURATION = 50000;

/**
 * The enforced time between refreshes in ms.
 */
const MIN_REFRESH = 5000;

export namespace PastCommits {
  export
  interface IState {
    data: any;
    single_data:any;
    single_data_filelist:any;
    show:boolean;
  }

  export
  interface IProps {
    current_fb_path:string;
    top_repo_path: string;

    past_commits: any;

    staged_files: any;
    unstaged_files: any;
    untracked_files: any;
    app: JupyterLab;
    refresh: any;
  }
}


export class PastCommits extends React.Component<PastCommits.IProps, PastCommits.IState>{

  constructor(props: PastCommits.IProps) {
    super(props);
    this.state = {data: props.past_commits, single_data:'', single_data_filelist:[], show: false}
  }

  show_left(){
    let pastcommitsContainer = ReactDOM.findDOMNode(this.refs.past_commits_container);
      $(pastcommitsContainer).animate({scrollTop: pastcommitsContainer.scrollTop-200});
      $(pastcommitsContainer).animate({scrollLeft: pastcommitsContainer.scrollLeft-200});
  }

  show_right(){
    let pastcommitsContainer = ReactDOM.findDOMNode(this.refs.past_commits_container);
      $(pastcommitsContainer).animate({scrollTop: pastcommitsContainer.scrollTop+200});
      $(pastcommitsContainer).animate({scrollLeft: pastcommitsContainer.scrollLeft+200});
  }

  async componentDidMount() {
    let result = [];
    let git_temp = new Git();
    let response = await git_temp.log(this.props.current_fb_path);
    if(response.code==0){
      this.setState({data: response.commits});
    }
  }

  show_current_work(){
    this.setState({show:false})
  }
  
  async show_past_commit_work(dj:SingleCommitInfo, path:string){
    let d_j = dj;
    let result = [];
    let git_temp = new Git();
    let response = await git_temp.log_1(dj.commit, path);
    if(response.code==0){
      d_j.modified_file_note = response.modified_file_note;
      this.setState({single_data:dj, single_data_filelist:response.modified_files, show:true})
    }
  }


  render(){
    return (
      <div>
      <div className={TOP_CONTAINER_CLASS}>
        <button className={SHIFT_LEFT_BUTTON_CLASS} onClick={()=>this.show_left()}> L </button>
        <div className={PAST_COMMIT_CONTAINER_CLASS} ref='past_commits_container'> 
          <ul className={PAST_COMMIT_LIST_CLASS}>
            <button className={CUR_BUTTON_CLASS} onDoubleClick={()=>this.show_current_work()}>
               CUR
            </button>         
            {this.props.past_commits.map((dj, dj_index)=>
              <span className={PAST_SINGLE_COMMIT_CONTAINER_CLASS} onDoubleClick={()=>this.show_past_commit_work(dj,this.props.current_fb_path)}>---
                  <button className={PAST_COMMIT_BUTTON_CLASS}>
                      <PastCommitNodeInfo index={dj_index} commit={dj.commit} author={dj.author} date={dj.date} commit_msg={dj.commit_msg}/>
                    </button>
              </span>
            )}
            </ul>
          </div>,     
         <button className={SHIFT_RIGHT_BUTTON_CLASS} onClick={()=>this.show_right()}> R </button>
      </div>
          <ToggleDisplay show={this.state.show}>
          <SinglePastCommitInfo data={this.state.single_data} list={this.state.single_data_filelist}/>
          </ToggleDisplay>


          <ToggleDisplay show={!(this.state.show)}>
          <StatusFiles current_fb_path={this.props.current_fb_path} top_repo_path={this.props.top_repo_path} 
              staged_files={this.props.staged_files} unstaged_files={this.props.unstaged_files} untracked_files={this.props.untracked_files} app={this.props.app} refresh={this.props.refresh}/>
          </ToggleDisplay>
      </div>
    );
  }
}

export namespace PastCommitNodeInfo {
  export
  interface IState {

  }

  export
  interface IProps {
    index:number;
    commit:string;
    author:string;
    date:string;
    commit_msg:string;
  }
}

export class PastCommitNodeInfo extends React.Component<PastCommitNodeInfo.IProps, PastCommitNodeInfo.IState>{
  constructor(props: PastCommitNodeInfo.IProps) {
    super(props);
  }
  render(){
    return(
      <div>
        {this.props.index}
        </div>
    );
  }
}



export namespace SinglePastCommitInfo {
  export
  interface IState {
  }

  export
  interface IProps {
    data:SingleCommitInfo;
    list:[CommitModifiedFile];
  }
}
export class SinglePastCommitInfo extends React.Component<SinglePastCommitInfo.IProps, SinglePastCommitInfo.IState>{
  constructor(props:SinglePastCommitInfo.IProps) {
    super(props);
	}
  render(){
    return (
      <div >
      <div className={PAST_COMMIT_INFO_SECTION_HEADER_CLASS}>
        <div className={PAST_COMMIT_INFO_LABEL_CLASS}> commit: {this.props.data.commit}</div>
        <div className={PAST_COMMIT_INFO_LABEL_CLASS}> author: {this.props.data.author}</div>
        <div className={PAST_COMMIT_INFO_LABEL_CLASS}> date: {this.props.data.date}</div>
        <div className={PAST_COMMIT_INFO_LABEL_CLASS}> commit_msg: {this.props.data.commit_msg}</div>
        <div className={PAST_COMMIT_INFO_LABEL_CLASS}> summary: {this.props.data.modified_file_note}</div>
      </div>
      <div className={CONTAINER_CLASS}>
          <ul className={LIST_CLASS}>
          {this.props.list.map((mf)=>
            <li className={ITEM_CLASS}>
              <span className={`${ITEM_ICON_CLASS} ${parseFileExtension(mf.modified_file_path)}`} />
              <span className={ITEM_LABEL_CLASS}>{mf.modified_file_path} :{mf.insertion}(+), {mf.deletion}(-) </span>
            </li>
          )}
          </ul>
      </div>
      </div>
    );
  }
}




