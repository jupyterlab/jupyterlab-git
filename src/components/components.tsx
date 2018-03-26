import * as React from 'react';
import * as ReactDOM from 'react-dom';
import ToggleDisplay from 'react-toggle-display'
//import ReactWidget from 'react-widgets';
import {
  ServiceManager
} from '@jupyterlab/services';

import {
  Message
} from '@phosphor/messaging';

import {
  Widget
} from '@phosphor/widgets';

import {
  JupyterLab
} from '@jupyterlab/application';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  Git, GitBranchResult,GitStatusResult,GitShowTopLevelResult, GitAPI, GitLogResult
} from '../git'

import {
  PathHeader
} from './pathHeader'

import {
  BranchHeader
} from './branchHeader'

import {
  PastCommits
} from './pastCommits'

import '../../style/index.css';

/**
 * The class name added to a git-plugin widget.
 */
const Git_CLASS = 'jp-Git';

/**
 * A class that exposes the git-plugin sessions.
 */

export
class GitSessions extends Widget  {
  component:any;
  /**
   * Construct a new running widget.
   */
  constructor(app:JupyterLab,options: GitSessions.IOptions, diff_function: any) {
    super({
      node: (options.renderer || GitSessions.defaultRenderer).createNode()
    });
    this.addClass(Git_CLASS);
    const element =<GitSessionNode app={app} diff={diff_function}/>
    this.component = ReactDOM.render(element, this.node);
    this.component.refresh();
  }
  /**
   * override widget's show() to update content everytime Git widget shows up.
   */
  show():void{
    super.show();
    this.component.refresh();
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


  private _renderer: GitSessions.IRenderer = null;
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


namespace GitSessionNode {
  export
  interface IState {
    current_fb_path:string;
    top_repo_path: string;
    show: boolean;

    branches: any;
    current_branch:string;
    disable_switch_branch:boolean;

    pull_enable:boolean;
    push_enable:boolean;

    past_commits: any;
    in_new_repo: boolean;
    show_index: number;

    staged_files: any;
    unstaged_files: any;
    untracked_files: any;
  }

  export
  interface IProps {
    app:JupyterLab;
    diff: any;
  }
}

  async function refresh(){
    console.log("hello!!!!!!!!!!!")
   try{
    let ll = this.props.app.shell.widgets('left');
    let fb = ll.next();
    while(fb.id!='filebrowser'){
      fb = ll.next();
    }
    let git_temp = new Git();
    console.log("hello!!!!!!!!!!!---------")
    let api_result =await git_temp.api((fb as any).model.path);
    
    if(api_result.code==0){
      let api_showtoplevel = (api_result as GitAPI).data.showtoplevel;

      //retrieve git_branch
      let api_branch = (api_result as GitAPI).data.branch;
      let current_branch = 'master';
      if(api_branch.code==0){
        let data_json = (api_branch as GitBranchResult).branches;
        for (var i=0; i<data_json.length; i++){
          if(data_json[i].current[0]){
            current_branch=data_json[i].name;
            break;
          }
        }
      }
      
      //retrieve git_log
      let api_log = (api_result as GitAPI).data.log;
      let past_commits = [];
      if(api_log.code==0){
        past_commits = (api_log as GitLogResult).commits;
      }
      
      //retrieve git_status
      let staged = [], unstaged = [], untracked = [];
      let Changes = 0;
      let disable_switch_branch = true;
      let pull_enable = false;
      let push_enable = true;
      let api_status = (api_result as GitAPI).data.status;
      if(api_status.code==0){
        let data_json = (api_status as GitStatusResult).files;
        for (var i=0; i<data_json.length; i++){
          if(data_json[i].x!="?"&&data_json[i].x!="!"){
            Changes++;
          }
          
          if(data_json[i].x=="?"&&data_json[i].y=="?"){
            untracked.push(data_json[i]);
          }
          else{
            if(data_json[i].x!=" "&&data_json[i].y!="D"){
              staged.push(data_json[i]);
            }
            if(data_json[i].y!=" "){
              unstaged.push(data_json[i]);
            }
          }
        }  
        if(Changes == 0){
        // since there are no uncommitted changes, enable switch branch button 
          disable_switch_branch = false;
          pull_enable = true;
        }
      }
      if(past_commits.length==0){
        disable_switch_branch = true;
        push_enable = false;
      }
      
      //determine if in the same repo as previously, if not, display the CUR;
      let in_new_repo= this.state.top_repo_path!==(api_showtoplevel as GitShowTopLevelResult).top_repo_path;
      let show_index = this.state.show_index;  
      if(in_new_repo){
        show_index = -1;
      }
            
      this.setState({current_fb_path:(fb as any).model.path, top_repo_path: (api_showtoplevel as GitShowTopLevelResult).top_repo_path, show:true, 
        branches: (api_branch as GitBranchResult).branches, current_branch: current_branch, disable_switch_branch: disable_switch_branch, pull_enable:pull_enable, push_enable:push_enable,
        past_commits: past_commits, in_new_repo: in_new_repo, show_index:show_index,
        staged_files: staged, unstaged_files: unstaged, untracked_files: untracked});
    }
    else{
      this.setState({current_fb_path: (fb as any).model.path, top_repo_path: '', show:false,  pull_enable:false, push_enable:false});
    }
   }catch(err){
     console.log("app doesn't work??")
   };
 }

class GitSessionNode extends React.Component<GitSessionNode.IProps, GitSessionNode.IState>{
  interval:any;
  refresh:any;
  constructor(props: GitSessionNode.IProps) {
    super(props);
    this.state = {current_fb_path: '', top_repo_path: '', show:false, branches:[], current_branch:'', disable_switch_branch:true, pull_enable:false, push_enable:false, past_commits:[], in_new_repo:true, show_index:-1, staged_files:[], unstaged_files:[], untracked_files:[]}
    this.refresh = refresh.bind(this);
    this.show_current_work = this.show_current_work.bind(this);
  }
  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 50000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  } 
  
  show_current_work(show_value:number){
    this.setState({show_index: show_value});
  }
  
  render(){
    return(
      <div className='jp-Git-container'>
        <PathHeader current_fb_path={this.state.current_fb_path} top_repo_path={this.state.top_repo_path} refresh={this.refresh}/>
        <ToggleDisplay show={this.state.show}>
        <BranchHeader current_fb_path={this.state.current_fb_path} top_repo_path={this.state.top_repo_path} refresh={this.refresh} 
              current_branch={this.state.current_branch} data={this.state.branches} disabled={this.state.disable_switch_branch}/>
        <PastCommits current_fb_path={this.state.current_fb_path} top_repo_path={this.state.top_repo_path} 
              past_commits={this.state.past_commits} in_new_repo={this.state.in_new_repo} show_index={this.state.show_index}
              staged_files={this.state.staged_files} unstaged_files={this.state.unstaged_files} untracked_files={this.state.untracked_files} app={this.props.app} refresh={this.refresh} show_current_work={this.show_current_work} diff={this.props.diff}/>
         </ToggleDisplay>

        <ToggleDisplay show={!(this.state.show)}>
          <div style={{ padding: 16 }}>
            <span style={{ color: "red", fontWeight: "bold" }}>Error:</span> <span>The current folder is not a git repository. Please make sure you are currently working in a git repository in order to use this plugin.</span>
          </div>
         </ToggleDisplay>

      </div>
    );
  }
}






