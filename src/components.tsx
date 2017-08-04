
import * as React from 'react';
import * as ReactDOM from 'react-dom';
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
  Git, GitBranchResult,GitStatusResult,GitShowPrefixResult,GitShowTopLevelResult,GitLogResult,GitErrorInfo,SingleCommitInfo, SingleCommitFilePathInfo
} from './git'

import '../style/index.css';
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


let app0 = null;
let current_fb_path = '';
//let current_repo_branch = '';
//let current_root_repo_path = '';
/**
 * A class that exposes the git-plugin sessions.
 */






export
class GitSessions extends Widget {
  /**
   * Construct a new running widget.
   */
  constructor(app: JupyterLab, options: GitSessions.IOptions) {
    super({
      node: (options.renderer || GitSessions.defaultRenderer).createNode()
    });
    //let manager = this._manager = options.manager;
   // this._renderer = options.renderer || GitSessions.defaultRenderer;
    this.addClass(Git_CLASS);
    //let renderer = this._renderer;


    
      const element =<GitSessionNode path=''/>;
      ReactDOM.render(element, this.node);
      

  }
  /**
   * override widget's show() to update content everytime Git widget shows up.
   */
  show():void{
    super.show();
  }
  /**
   * The renderer used by the running sessions widget.
   */
  get renderer(): GitSessions.IRenderer {
    return this._renderer;
  }
  /**
   * A signal emitted when the directory listing is refreshed.
   */
  get refreshed(): ISignal<this, void> {
    return this._refreshed;
  }
  /**
   * Get the input text node.
   */
  get inputNode(): HTMLInputElement {
    return this.node.getElementsByTagName('input')[0] as HTMLInputElement;
  }
  /**
   * Dispose of the resources used by the widget.
   */
  dispose(): void {
    this._manager = null;
    this._runningSessions = null;
    this._runningTerminals = null;
    this._renderer = null;
    clearTimeout(this._refreshId);
    super.dispose();
  }



  /**
   * Handle the DOM events for the widget.
   *
   * @param event - The DOM event sent to the widget.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the widget's DOM nodes. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'change':
        this._evtChange(event as MouseEvent);
      case 'click':
        this._evtClick(event as MouseEvent);
        break;
      case 'dblclick':
        this._evtDblClick(event as MouseEvent);
        break;
      default:
        break;
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('change', this);
    this.node.addEventListener('click', this);
    this.node.addEventListener('dblclick', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.addEventListener('change', this);
    this.node.removeEventListener('click', this);
    this.node.removeEventListener('dblclick', this);
  }

  /**
   * Handle the `'click'` event for the widget.
   *
   * #### Notes
   * This listener is attached to the document node.
   */
  private _evtChange(event: MouseEvent): void {

  }
  /**
   * Handle the `'click'` event for the widget.
   *
   * #### Notes
   * This listener is attached to the document node.
   */
  private _evtClick(event: MouseEvent): void {

  }
  /**
   * Handle the `'dblclick'` event for the widget.
   */
  private _evtDblClick(event: MouseEvent): void {



  }


  private _manager: ServiceManager.IManager = null;
  private _renderer: GitSessions.IRenderer = null;
  private _runningSessions: Session.IModel[] = [];
  private _runningTerminals: TerminalSession.IModel[] = [];
  private _refreshId = -1;
  private _refreshed = new Signal<this, void>(this);
  //private _lastRefresh = -1;
  //private _requested = false;
}


/**
 * The namespace for the `RunningSessions` class statics.
 */
export
namespace GitSessions {
  /**
   * An options object for creating a running sessions widget.
   */
  export
  interface IOptions {
    /**
     * A service manager instance.
     */
    manager: ServiceManager.IManager;

    /**
     * The renderer for the running sessions widget.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;
  }

  /**
   * A renderer for use with a running sessions widget.
   */
  export
  interface IRenderer {
    createNode(): HTMLElement;
  }


  /**
   * The default implementation of `IRenderer`.
   */
  export
  class Renderer implements IRenderer {
    createNode(): HTMLElement {
      let node = document.createElement('div');
      node.id = 'GitSession-root';

      return node;
    }

  }


  /**
   * The default `Renderer` instance.
   */
  export
  const defaultRenderer = new Renderer();
}


/**
 * The command IDs used by the git plugin.
 */
export namespace CommandIDs {
  export
  const git_terminal = 'git:create-new-terminal';

  export
  const git_pull = 'git:pull';

  export
  const git_push = 'git:push';

  export
  const git_init = 'git:init';

};
/**
 * Add the commands for the git-plugin.
 */
export
function addCommands(app: JupyterLab) {
  let { commands} = app;
  app0 = app;
  let git_temp = new Git();

  /**
   * Whether under a git repo.
   */
  /*
  function underGit(): boolean {
    return tracker.currentWidget !== null;
  }
*/
  // Add terminal commands.
  commands.addCommand(CommandIDs.git_terminal, {
    label: 'Open Terminal',
    caption: 'Start a new terminal session to directly use git command',
    execute: args => {
      console.log("git new terminal");
    }
  });

  commands.addCommand(CommandIDs.git_pull, {
    label: 'Pull',
    caption: 'Incorporates changes from a remote repository into the current branch',
    execute: args => {
      console.log("git pull");
      let upstream = prompt("Enter Upstream Branch Name");
      let master = prompt("Enter Master Branch Name");
      git_temp.pull(upstream,master,current_fb_path);
    }
  });

  commands.addCommand(CommandIDs.git_push, {
    label: 'Push',
    caption: 'Update remote refs along with associated objects',
    execute: () => {
      console.log("git push");
      let upstream = prompt("Enter Upstream Branch Name");
      let master = prompt("Enter Master Branch Name");
      git_temp.push(upstream,master,current_fb_path);

    },
  });

  commands.addCommand(CommandIDs.git_init, {
    label: 'Init',
    caption: " Create an empty Git repository or reinitialize an existing one",
    execute: () => {
      console.log("git init");
      showDialog({
        title: 'Initialize a Repository',
        body: "Do you really want to make this directory a Git Repo?",
        buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Yes'})]
        }).then(result => {
          if (result.button.accept) {
            git_temp.init(current_fb_path);
          }
        });
    },
  });

}

namespace GitSessionNode {
  export
  interface IState {
    path: string;
  }

  export
  interface IProps {
    path: string;
  }
}


class GitSessionNode extends React.Component<GitSessionNode.IProps, GitSessionNode.IState>{
  constructor(props: GitSessionNode.IProps) {
    super(props);
    this.state = {path: ''}
    this.refresh = this.refresh.bind(this);
  }  
  
  refresh(){
   let current_fb_path = '';
   try{
    let ll = app0.shell.widgets('left');
    let fb = ll.next();
    while(fb.id!='filebrowser'){
      fb = ll.next();
    }
    current_fb_path = (fb as any).model.path;
   }catch(err){
     console.log("app doesn't work??")
   };
    this.setState({path: current_fb_path});
 }

  render(){
    
    return(
      <div >
        <PathHeader path={this.state.path} refresh={this.refresh}/>
        <GitWholeContainer path={this.state.path} refresh={this.refresh}/>
      </div>
    );
  }
}

namespace PathHeader {
  export
  interface IState {
    path: string;
    refresh: any;
  }

  export
  interface IProps {
    path: string;
    refresh: any;
  }
}
class PathHeader extends React.Component<PathHeader.IProps, PathHeader.IState>{
  constructor(props: PathHeader.IProps) {
    super(props);
    this.state = {path: props.path, refresh : props.refresh}
  }

  render(){
    return (
        <div className={`${SECTION_CLASS} ${PATH_HEADER_CLASS}`}>
          <li className={ITEM_CLASS}>
            <span className={`${ITEM_ICON_CLASS} ${HOME_ICON_CLASS}`}/>
            <span className={ITEM_LABEL_CLASS}> 
              {this.props.path}
              </span> 
            <button className={REFRESH_CLASS}  onClick={()=>this.props.refresh()} />
            </li>
          </div>
    )
  }
}



namespace GitWholeContainer {
  export
  interface IState {
    path: string;
    refresh: any;
  }

  export
  interface IProps {
    path: string;
    refresh: any;
  }
}
class GitWholeContainer extends React.Component<GitWholeContainer.IProps, GitWholeContainer.IState>{
  constructor(props: GitWholeContainer.IProps) {
    super(props);
    this.state = {path: props.path, refresh : props.refresh}
	}
  render(){
    return(
      <div>
        <BranchHeader path={this.props.path} refresh={this.props.refresh}/>
        <PastCommits path={this.props.path} refresh={this.props.refresh}/>
        <StatusFiles path={this.props.path} refresh={this.props.refresh}/>
        </div>
    );
  }
}

namespace BranchHeader {
  export
  interface IState {
    path: string;
    data: any;
  }

  export
  interface IProps {
    path: string;
    refresh: any;  
  }
}
class BranchHeader extends React.Component<BranchHeader.IProps, BranchHeader.IState>{
  constructor(props: BranchHeader.IProps) {
    super(props);
    this.state = {path: props.path, data: []}
  }

  async componentDidMount() {
    let result = [];
    let git_temp = new Git();
    console.log("inside branchHeader componentDidMount: "+this.props.path);
    let response = await git_temp.branch(this.props.path);
    if(response.code==0){
      this.setState({data: (response as GitBranchResult).repos});
    }
  }

  async componentWillReceiveProps() {
    let result = [];
    let git_temp = new Git();
    console.log("inside branchHeader componentWillReceiveProps: "+this.props.path);
    let response = await git_temp.branch(this.props.path);
    if(response.code==0){
      this.setState({data: (response as GitBranchResult).repos});
    }
  }

  render(){
    return (
      <div  className='jp-CSVToolbar'>
        <span className ='jp-CSVToolbar-label'> Current Branch{this.props.path}:
        </span>,
        <select className='jp-CSVToolbar-dropdown' >
             {this.state.data.map((dj)=>
              <option>
                  {dj.name}
              </option>
              )}
          </select>,  
      </div>
    );
  }
}



namespace PastCommits {
  export
  interface IState {
    data: any;
  }

  export
  interface IProps {
    path: string;
    refresh: any;      
  }
}


class PastCommits extends React.Component<PastCommits.IProps, PastCommits.IState>{

  constructor(props: PastCommits.IProps) {
    super(props);
    this.state = {data: ["null"]}
  }

  printstate(){
    console.log(this.state.data);
  }

  async componentDidMount() {
    let result = [];
    let git_temp = new Git();
    let response = await git_temp.log(this.props.path);
    if(response.code==0){
      this.setState({data: response.commits});
    }
  }

  async componentWillReceiveProps() {
    let result = [];
    let git_temp = new Git();
    let response = await git_temp.log(this.props.path);
    if(response.code==0){
      this.setState({data: response.commits});
    }
  }


  render(){
    return (
      React.createElement('div',{className: TOP_CONTAINER_CLASS},
        React.createElement('button',{className : SHIFT_LEFT_BUTTON_CLASS}, '<'),
        <div className={PAST_COMMIT_CONTAINER_CLASS}> 
          <ul className={PAST_COMMIT_LIST_CLASS}>
             {this.state.data.map((dj)=>
              <span className={PAST_SINGLE_COMMIT_CONTAINER_CLASS}>---
                  <button className={PAST_COMMIT_BUTTON_CLASS}>
                    {dj.commit}
                    </button>
              </span>
              )}
              </ul>
          </div>,     
        React.createElement('button',{className : SHIFT_RIGHT_BUTTON_CLASS, onClick:()=>this.printstate()},'>')
      )
    );
  }
}

class SinglePastCommitInfo extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      React.createElement('div',{},
        React.createElement('li',{className:PAST_COMMIT_INFO_LABEL_CLASS},'commit'),
        React.createElement('li',{className:PAST_COMMIT_INFO_LABEL_CLASS}, 'author'),
        React.createElement('li',{className:PAST_COMMIT_INFO_LABEL_CLASS}, 'date'),
        React.createElement('li',{className:PAST_COMMIT_INFO_LABEL_CLASS}, 'commit_msg'),
        React.createElement('li',{className:PAST_COMMIT_INFO_LABEL_CLASS}, 'modified_file_note')
      )
    );
  }
}

namespace StatusFiles {
  export
  interface IState {
    data: any;
    staged_files: any;
    unstaged_files: any;
    untracked_files: any;
  }

  export
  interface IProps {
    path: string;
    refresh: any;  
  }
}



class StatusFiles extends React.Component<StatusFiles.IProps, StatusFiles.IState>{
  constructor(props: StatusFiles.IProps) {
    super(props);
    this.state = {data: [], staged_files: [], unstaged_files: [], untracked_files: []}
  }

  printstate(){
    console.log(this.state.data);
  }

  async componentDidMount() {
    let staged = [], unstaged = [], untracked = [];
    let SF = 0, USF = 0, UTF = 0;
    let git_temp = new Git();
    let response = await git_temp.status(this.props.path);
    if(response.code==0){
      let data_json = (response as GitStatusResult).files;
      for (var i=0; i<data_json.length; i++){
        if(data_json[i].x=="M"){
          staged.push(data_json[i].to);
          SF++;
        }
        if(data_json[i].y=="M"){
          unstaged.push(data_json[i].to);
          USF++;
        }
        if(data_json[i].x=="?"&&data_json[i].y=="?"){
          untracked.push(data_json[i].to);
          UTF++;
        }
      }      
      this.setState({staged_files: staged, unstaged_files: unstaged, untracked_files: untracked});
    }
  }

  async componentWillReceiveProps() {
    let staged = [], unstaged = [], untracked = [];
    let SF = 0, USF = 0, UTF = 0;
    let git_temp = new Git();
    let response = await git_temp.status(this.props.path);
    if(response.code==0){
      let data_json = (response as GitStatusResult).files;
      for (var i=0; i<data_json.length; i++){
        if(data_json[i].x=="M"){
          staged.push(data_json[i].to);
          SF++;
        }
        if(data_json[i].y=="M"){
          unstaged.push(data_json[i].to);
          USF++;
        }
        if(data_json[i].x=="?"&&data_json[i].y=="?"){
          untracked.push(data_json[i].to);
          UTF++;
        }
      }      
      this.setState({staged_files: staged, unstaged_files: unstaged, untracked_files: untracked});
    }
  }

  render(){
    return (
      <div>
        <StagedHeader />
        <div className= 'jp-GitSessions-sectionContainer'>
          <ul>
            {this.props.path}
            {this.state.staged_files.map((file)=>
              StagedNode(file)
            )}
          </ul>
        </div>
        <UnstagedHeader />
        <div className= 'jp-GitSessions-sectionContainer'>
          <ul>
            {this.state.unstaged_files.map((file)=>
              UnstagedNode(file)
            )}
          </ul>
        </div>
        <UntrackedHeader />
        <div className= 'jp-GitSessions-sectionContainer'>
          <ul>
            {this.state.untracked_files.map((file)=>
              UntrackedNode(file)
            )}
          </ul>
        </div>
      </div>
    );
  }
}

function reset_all_StagedNode(){
  let git_temp = new Git();
  git_temp.reset(true,null,this.props.path);
}

function commit_all_StagedNode(){
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
      git_temp.commit(msg, this.props.path).then(response=>{
        this.refresh();
        this.refresh_past_commit_list();
      });
    }
  });
}


class StagedHeader extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      <div className={SECTION_HEADER_CLASS} >
        <span className={ITEM_LABEL_CLASS}> Staged'</span>
        <button className={`${RESET_BUTTON_CLASS} jp-mod-styled`} onClick={()=>reset_all_StagedNode()}>Reset</button>
        <button className={`${COMMIT_BUTTON_CLASS} jp-mod-styled`} onClick={()=>commit_all_StagedNode()}>Commit</button>
        </div>
    );
  }
}
function reset_StagedNode(file:string){
  let git_temp = new Git();
  git_temp.reset(false, file, "");
}

function StagedNode(file:string){
  return (
    <li className={ITEM_CLASS}>
      <span className={`${ITEM_ICON_CLASS} ${parseFileExtension(file)}`} />
      <span className={ITEM_LABEL_CLASS}>{file}</span>
      <button className= {`${RESET_BUTTON_CLASS} jp-mod-styled`} onClick={()=>reset_StagedNode(file)}> reset </button>
    </li>
  );
}


function add_all_UnstagedNode(){
  let git_temp = new Git();
  git_temp.add(true,null, '');
}

function discard_all_UnstagedNode(){
  let git_temp = new Git();
  let input = new Widget({ node: document.createElement('input') });
  showDialog({
    title: 'DISCARD CHANGES',
    body: "Do you really want to discard all uncommitted changes?",
    buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard'})]
  }).then(result => {
    if (result.button.accept) {
      git_temp.checkout(false,false, null,true,null,'').then(response=>{
        this.refresh();
      });
    }
  });
}



class UnstagedHeader extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      <div className={SECTION_HEADER_CLASS} >
        <span className={ITEM_LABEL_CLASS}> Unstaged'</span>
        <button className={`${ADD_BUTTON_CLASS} jp-mod-styled`} onClick={()=>add_all_UnstagedNode()}>Add</button>
        <button className={`${RESET_BUTTON_CLASS} jp-mod-styled`} onClick={()=>discard_all_UnstagedNode()}>Discard</button>
        </div>
    );
  }
}

function add_UnstagedNode(file:string){
  let git_temp = new Git();
  git_temp.add(false, file, '');
}

function discard_UnstagedNode(file:string){
  let git_temp = new Git();
  let input = new Widget({ node: document.createElement('input') });
  showDialog({
    title: 'DISCARD CHANGES',
    body: "Do you really want to discard the uncommitted changes in this file?",
    buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard'})]
  }).then(result => {
    if (result.button.accept) {
      git_temp.checkout(false,false, null,false,file,'').then(response=>{
        this.refresh();
      });
    }
  });
}

function UnstagedNode(file:string){
  return (
    <li className={ITEM_CLASS}>
      <span className={`${ITEM_ICON_CLASS} ${parseFileExtension(file)}`} />
      <span className={ITEM_LABEL_CLASS}>{file}</span>
      <button className= {`${ADD_BUTTON_CLASS} jp-mod-styled`} onClick={()=>add_UnstagedNode(file)}> add </button>
      <button className= {`${RESET_BUTTON_CLASS} jp-mod-styled`} onClick={()=>discard_UnstagedNode(file)}> discard </button>
    </li>
  );
}



class UntrackedHeader extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      <div className={SECTION_HEADER_CLASS} >
        <span className={ITEM_LABEL_CLASS}> Untracked</span>
        <button className={`${ADD_BUTTON_CLASS} jp-mod-styled`}>Add</button>
        </div>
    );
  }
}

function add_UntrackedNode(file:string){
  let git_temp = new Git();
  git_temp.add(false, file, '');
}

function UntrackedNode(file:string){
  return (
    <li className={ITEM_CLASS}>
      <span className={`${ITEM_ICON_CLASS} ${parseFileExtension(file)}`} />
      <span className={ITEM_LABEL_CLASS}>{file}</span>
      <button className= {`${ADD_BUTTON_CLASS} jp-mod-styled`}onClick={()=>add_UntrackedNode(file)}> add </button>
    </li>
  );
}




function parseFileExtension(path: string): string {
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



