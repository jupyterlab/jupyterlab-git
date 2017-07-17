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
  Widget
} from '@phosphor/widgets';

import {
  DOMUtils, Dialog, showDialog
} from '@jupyterlab/apputils';

import {
  ILayoutRestorer, JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
  IServiceManager
} from '@jupyterlab/services';
/*
import {
  URLExt//,PathExt
} from '@jupyterlab/coreutils';
*/
import {
  ServerConnection
} from '@jupyterlab/services';
import {
  ConsolePanel
} from '@jupyterlab/console';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  Git
} from './git'

import '../style/index.css';

/**
 * The class name added to a git-plugin widget.
 */
const Git_CLASS = 'jp-GitSessions';

/**
 * The class name added to a git-plugin widget header.
 */
const HEADER_CLASS = 'jp-GitSessions-header';

/**
 * The class name added to a git-plugin widget header refresh button.
 */
const REFRESH_CLASS = 'jp-GitSessions-headerRefresh';

/**
 * The class name added to the git-plugin terminal sessions section.
 */
const SECTION_CLASS = 'jp-GitSessions-section';

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
const CONTAINER_CLASS = 'jp-GitSessions-sectionContainer';

/**
 * The class name added to the git-plugin kernel sessions section list.
 */
const LIST_CLASS = 'jp-GitSessions-sectionList';

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
const CHECKOUT_BUTTON_CLASS = 'jp-GitSessions-itemCheckout';
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
 * The duration of auto-refresh in ms.
 */
const REFRESH_DURATION = 50000;

/**
 * The enforced time between refreshes in ms.
 */
const MIN_REFRESH = 5000;


let app0 = null;
let current_fb_path = '';
/**
 * A class that exposes the git-plugin sessions.
 */
export
class GitSessions extends Widget {
  /**
   * Construct a new running widget.
   */
  constructor(options: GitSessions.IOptions) {
    super({
      node: (options.renderer || GitSessions.defaultRenderer).createNode()
    });
    //let manager = this._manager = options.manager;
    this._renderer = options.renderer || GitSessions.defaultRenderer;
    this.addClass(Git_CLASS);
    let renderer = this._renderer;


//prepare 3 sections

      let uncommittedNode = DOMUtils.findElement(this.node, UNCOMMITTED_CLASS);
      let uncommittedHeader = this._renderer.createUncommittedHeaderNode();
      uncommittedHeader.className = SECTION_HEADER_CLASS;
      uncommittedNode.appendChild(uncommittedHeader);
      let uncommittedContainer = document.createElement('div');
      uncommittedContainer.className = CONTAINER_CLASS;
      let uncommittedList = document.createElement('ul');
      uncommittedList.className = LIST_CLASS;
      uncommittedContainer.appendChild(uncommittedList);
      uncommittedNode.appendChild(uncommittedContainer);

      let unstagedNode = DOMUtils.findElement(this.node, UNSTAGED_CLASS);
      let unstagedHeader = this._renderer.createUnstagedHeaderNode();
      unstagedHeader.className = SECTION_HEADER_CLASS;
      unstagedNode.appendChild(unstagedHeader);
      let unstagedContainer = document.createElement('div');
      unstagedContainer.className = CONTAINER_CLASS;
      let unstagedList = document.createElement('ul');
      unstagedList.className = LIST_CLASS;
      unstagedContainer.appendChild(unstagedList);
      unstagedNode.appendChild(unstagedContainer);

      let untrackedNode = DOMUtils.findElement(this.node, UNTRACKED_CLASS);
      let untrackedHeader = this._renderer.createUntrackedHeaderNode();
      untrackedHeader.className = SECTION_HEADER_CLASS;
      untrackedNode.appendChild(untrackedHeader);
      let untrackedContainer = document.createElement('div');
      untrackedContainer.className = CONTAINER_CLASS;
      let untrackedList = document.createElement('ul');
      untrackedList.className = LIST_CLASS;
      untrackedContainer.appendChild(untrackedList);
      untrackedNode.appendChild(untrackedContainer);

      let git_temp = new Git();
      let promise_temp = (git_temp.status(''));
      promise_temp.then(response=> {
        console.log("first response:")
        console.log(response.xhr.status)
        if (response.xhr.status !== 200) {
          console.log(response.xhr.status)
        throw ServerConnection.makeError(response);
        }
        if(response.data.code==0){
          let data_json = response.data.files;
          for (var i=0; i<data_json.length; i++){
            if(data_json[i].x=="M"){
              let node = renderer.createUncommittedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              uncommittedList.appendChild(node);
            }
            if(data_json[i].y=="M"){
              let node = renderer.createUnstagedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              unstagedList.appendChild(node);
            }
            if(data_json[i].x=="?"&&data_json[i].y=="?"){
              let node = renderer.createUntrackedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              untrackedList.appendChild(node);
            }
          }
        }
        else{
          console.log("Error happened, EXITCODE is:")
          console.log(response.data.message)
        }
      }).catch(response =>{
        console.log("second response:")
        console.log(response.xhr.status)

      }) ;
      this._scheduleUpdate();
      this._startTimer();
  }
  /**
   * override widget's show() to update content everytime Git widget shows up.
   */
  show():void{
    super.show();
    this.refresh_current_fb_path();
    this.refresh();
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
  

  refresh_current_fb_path():void {
    let ll = app0.shell.widgets('left');
    let fb = ll.next();
    while(fb.id!='filebrowser'){
      fb = ll.next();
    }
    current_fb_path = fb.model.path;
  }
  /**
   * Refresh the widget.
   */
  refresh(): Promise<void> {

    let uncommittedSection = DOMUtils.findElement(this.node, UNCOMMITTED_CLASS);
    let uncommittedContainer = DOMUtils.findElement(uncommittedSection, CONTAINER_CLASS);
    let untrackedSection = DOMUtils.findElement(this.node, UNTRACKED_CLASS);
    let untrackedContainer = DOMUtils.findElement(untrackedSection, CONTAINER_CLASS);
    let unstagedSection = DOMUtils.findElement(this.node, UNSTAGED_CLASS);
    let unstagedContainer = DOMUtils.findElement(unstagedSection, CONTAINER_CLASS);
    let renderer = this._renderer;

    uncommittedContainer.removeChild(uncommittedContainer.firstChild);
    unstagedContainer.removeChild(unstagedContainer.firstChild);
    untrackedContainer.removeChild(untrackedContainer.firstChild);

    let uncommittedList = document.createElement('ul');
    uncommittedList.className = LIST_CLASS;
    uncommittedContainer.appendChild(uncommittedList);
    let unstagedList = document.createElement('ul');
    unstagedList.className = LIST_CLASS;
    unstagedContainer.appendChild(unstagedList);
    let untrackedList = document.createElement('ul');
    untrackedList.className = LIST_CLASS;
    untrackedContainer.appendChild(untrackedList);


      let git_temp = new Git();
      let promise_temp = (git_temp.status(current_fb_path));
      promise_temp.then(response=> {
        if (response.xhr.status !== 200) {
        throw ServerConnection.makeError(response);
        }
        if(response.data.code==0){
          let data_json = response.data.files;
          for (var i=0; i<data_json.length; i++){
            if(data_json[i].x=="M"){
              let node = renderer.createUncommittedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              uncommittedList.appendChild(node);
            }
            if(data_json[i].y=="M"){
              let node = renderer.createUnstagedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              unstagedList.appendChild(node);
            }
            if(data_json[i].x=="?"&&data_json[i].y=="?"){
              let node = renderer.createUntrackedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              untrackedList.appendChild(node);
            }
          }
        }
        else{
          console.log("Error happened, EXITCODE is:")
          console.log(response.data.message)          
        }
      }).catch(response =>{
        console.log("second response:")
        console.log(response.xhr.status)
      });
    //clearTimeout(this._refreshId);
    let promises: Promise<void>[] = [];
   /* if (terminals.isAvailable()) {
      promises.push(terminals.refreshRunning());
    }
    promises.push(sessions.refreshRunning());*/
    this._lastRefresh = new Date().getTime();
    this._requested = false;
    return Promise.all(promises).then(() => void 0);
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
    this.node.addEventListener('click', this);
    this.node.addEventListener('dblclick', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('click', this);
    this.node.removeEventListener('dblclick', this);
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    // Fetch common variables.
    let uncommittedSection = DOMUtils.findElement(this.node, UNCOMMITTED_CLASS);
    let uncommittedContainer = DOMUtils.findElement(uncommittedSection, CONTAINER_CLASS);
    let untrackedSection = DOMUtils.findElement(this.node, UNTRACKED_CLASS);
    let untrackedContainer = DOMUtils.findElement(untrackedSection, CONTAINER_CLASS);
    let unstagedSection = DOMUtils.findElement(this.node, UNSTAGED_CLASS);
    let unstagedContainer = DOMUtils.findElement(unstagedSection, CONTAINER_CLASS);
    let renderer = this._renderer;

    uncommittedContainer.removeChild(uncommittedContainer.firstChild);
    unstagedContainer.removeChild(unstagedContainer.firstChild);
    untrackedContainer.removeChild(untrackedContainer.firstChild);

    let uncommittedList = document.createElement('ul');
    uncommittedList.className = LIST_CLASS;
    uncommittedContainer.appendChild(uncommittedList);
    let unstagedList = document.createElement('ul');
    unstagedList.className = LIST_CLASS;
    unstagedContainer.appendChild(unstagedList);
    let untrackedList = document.createElement('ul');
    untrackedList.className = LIST_CLASS;
    untrackedContainer.appendChild(untrackedList);


      let git_temp = new Git();
      this.refresh_current_fb_path();
      let promise_temp = (git_temp.status(current_fb_path));
      promise_temp.then(response=> {
        if (response.xhr.status !== 200) {
        throw ServerConnection.makeError(response);
        }
        if(response.data.code==0){
          let data_json = response.data.files;
          for (var i=0; i<data_json.length; i++){
            if(data_json[i].x=="M"){
              let node = renderer.createUncommittedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              uncommittedList.appendChild(node);
            }
            if(data_json[i].y=="M"){
              let node = renderer.createUnstagedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              unstagedList.appendChild(node);
            }
            if(data_json[i].x=="?"&&data_json[i].y=="?"){
              let node = renderer.createUntrackedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              untrackedList.appendChild(node);
            }
          }
        }
        else{
          console.log("Error happened, EXITCODE is:")
          console.log(response.data.message);          
        }
      }).catch(response =>{
        console.log("second response:")
        console.log(response.xhr.status)

      }) ;


  }

  /**
   * Handle the `'click'` event for the widget.
   *
   * #### Notes
   * This listener is attached to the document node.
   */
  private _evtClick(event: MouseEvent): void {
    // Fetch common variables.
    let uncommittedSection = DOMUtils.findElement(this.node, UNCOMMITTED_CLASS);
    let uncommittedHeader = DOMUtils.findElement(uncommittedSection, SECTION_HEADER_CLASS);
    let uncommittedList = DOMUtils.findElement(uncommittedSection, LIST_CLASS);
    let unstagedSection = DOMUtils.findElement(this.node, UNSTAGED_CLASS);
    let unstagedHeader = DOMUtils.findElement(unstagedSection,SECTION_HEADER_CLASS);
    let unstagedList = DOMUtils.findElement(unstagedSection, LIST_CLASS);
    let untrackedSection = DOMUtils.findElement(this.node, UNTRACKED_CLASS);
   // let untrackedHeader = DOMUtils.findElement(untrackedSection,SECTION_HEADER_CLASS);
    let untrackedList = DOMUtils.findElement(untrackedSection, LIST_CLASS);

    let refresh = DOMUtils.findElement(this.node, REFRESH_CLASS);
    let renderer = this._renderer;
    let clientX = event.clientX;
    let clientY = event.clientY;
      
    this.refresh_current_fb_path();
    // Check for a refresh.
    if (ElementExt.hitTest(refresh, clientX, clientY)) {
      this.refresh();
      return;
    }
    let git_temp = new Git();
      
    let current_root_repo_path = '';
    git_temp.showtoplevel(current_fb_path).then(response=>{
        current_root_repo_path = response.data.top_repo_path;

    let node0 = uncommittedHeader as HTMLLIElement;

    let git_reset_all = renderer.getUncommittedReset(node0);
    if (ElementExt.hitTest(git_reset_all, clientX, clientY)) {
        git_temp.reset(true,null,current_root_repo_path);
        this.refresh();
        return;
    }

    let git_commit = renderer.getUncommittedCommit(node0);
    if (ElementExt.hitTest(git_commit, clientX, clientY)) {
        let input = document.createElement('input');
        showDialog({
            title: 'Input commit message:',
            body: input,
            buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Commit'})]
        }).then(result => {
            if (result.accept&&input.value) {
                git_temp.commit(input.value, current_root_repo_path);
                this.refresh();
            }
        });
          return;
/*
        var msg = prompt("Enter commit message");
        if(msg!=null&&msg!=undefined){
          git_temp.commit(msg, current_root_repo_path);
          this.refresh();
        }
        return;
        */
    }
    // Check for a uncommitted item click.
    let index = DOMUtils.hitTestNodes(uncommittedList.children, clientX, clientY);
    if (index !== -1) {
      let node = uncommittedList.children[index] as HTMLLIElement;
      let git_reset = renderer.getUncommittedReset(node);
      if (ElementExt.hitTest(git_reset, clientX, clientY)) {
        //POST_Git_Request('/git/reset',{"Reset_all": 0, "Filename":node.title});
        git_temp.reset(false,node.title, current_root_repo_path);
        this.refresh();
        return;
      }
    }
    
    
    node0 = unstagedHeader as HTMLLIElement;
    let git_add_all = renderer.getUnstagedAdd(node0);
    if (ElementExt.hitTest(git_add_all, clientX, clientY)) {
        //POST_Git_Request('/git/add',{"Add_all": 1 , "Filename":null});
        git_temp.add(true,null, current_root_repo_path);
        this.refresh();
        return;
    }

    let git_checkout_all = renderer.getUnstagedCheckout(node0);
    if (ElementExt.hitTest(git_checkout_all, clientX, clientY)) {
       //POST_Git_Request('/git/checkout',{"Checkout_all": 1 , "Filename":null});
        showDialog({
            title: 'DISCARD CHANGES',
            body: "Do you really want to discard all uncommitted changes?",
            buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard'})]
        }).then(result => {
            if (result.accept) {
                git_temp.checkout(true,null,current_root_repo_path);
                this.refresh();
            }
        });
        return;
    }

    // Check for a unstaged item click.
    index = DOMUtils.hitTestNodes(unstagedList.children, clientX, clientY);
    if (index !== -1) {
      let node = unstagedList.children[index] as HTMLLIElement;
      let git_add = renderer.getUnstagedAdd(node);
      let git_checkout = renderer.getUnstagedCheckout(node);
      if (ElementExt.hitTest(git_add, clientX, clientY)) {
        //POST_Git_Request('/git/add',{"Add_all": 0 , "Filename":node.title})
        git_temp.add(false,node.title,current_root_repo_path);
        this.refresh();
        return;
      }
      else if(ElementExt.hitTest(git_checkout, clientX, clientY)) {
        showDialog({
            title: 'DISCARD CHANGES',
            body: "Do you really want to discard the uncommitted changes in this file?",
            buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard'})]
        }).then(result => {
            if (result.accept) {
                git_temp.checkout(false,node.title,current_root_repo_path);
                this.refresh();
            }
        });
        return;
      }
    }

    // Check for a untracked item click.
    index = DOMUtils.hitTestNodes(untrackedList.children, clientX, clientY);
    if (index !== -1) {
      let node = untrackedList.children[index] as HTMLLIElement;
      let git_add = renderer.getUntrackedAdd(node);
      if (ElementExt.hitTest(git_add, clientX, clientY)) {
        //POST_Git_Request('/git/add',{"Add_all": 0 , "Filename":node.title})
        git_temp.add(false,node.title,current_root_repo_path);
        this.refresh();
        return;
      }
    }
    }).catch(response =>{
        console.log("second response:")
        console.log(response.xhr.status)

      }) ;
  }
  /**
   * Handle the `'dblclick'` event for the widget.
   */
  private _evtDblClick(event: MouseEvent): void {
    
    console.log("DOUBLE CLICK JUST HAPPENED")
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if any modifier keys are pressed.
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    let uncommittedSection = DOMUtils.findElement(this.node, UNCOMMITTED_CLASS);
    let uncommittedList = DOMUtils.findElement(uncommittedSection, LIST_CLASS);
    let unstagedSection = DOMUtils.findElement(this.node, UNSTAGED_CLASS);
    let unstagedList = DOMUtils.findElement(unstagedSection, LIST_CLASS);
    let untrackedSection = DOMUtils.findElement(this.node, UNTRACKED_CLASS);
    let untrackedList = DOMUtils.findElement(untrackedSection, LIST_CLASS);

    let renderer = this._renderer;
    let clientX = event.clientX;
    let clientY = event.clientY;

    let ll = app0.shell.widgets('left');
    let fb = ll.next();
    while(fb.id!='filebrowser'){
      fb = ll.next();
    }

    let git_temp = new Git();
      
    let current_root_repo_path = '';
    git_temp.showtoplevel(fb.model.path).then(response=>{
        current_root_repo_path = response.data.top_repo_path ;
        
    // Check for a uncommitted item click.
    let index = DOMUtils.hitTestNodes(uncommittedList.children, clientX, clientY);
    if (index !== -1) {
      let node = uncommittedList.children[index] as HTMLLIElement;
      let git_label = renderer.getUncommittedLabel(node);
      if (ElementExt.hitTest(git_label, clientX, clientY)) {
        fb._listing._manager.openOrReveal(fb.model.path+'/'+node.title);
        return;
      }
    }

    // Check for a unstaged item click.
    index = DOMUtils.hitTestNodes(unstagedList.children, clientX, clientY);
    if (index !== -1) {
      let node = unstagedList.children[index] as HTMLLIElement;
      let git_label = renderer.getUnstagedLabel(node);
      if (ElementExt.hitTest(git_label, clientX, clientY)) {
        fb._listing._manager.openOrReveal(fb.model.path+'/'+node.title);
        this.refresh();
        return;
      }
    }

    // Check for a untracked item click.
    index = DOMUtils.hitTestNodes(untrackedList.children, clientX, clientY);
    if (index !== -1) {
      let node = untrackedList.children[index] as HTMLLIElement;
      let git_label = renderer.getUntrackedLabel(node);
      if (ElementExt.hitTest(git_label, clientX, clientY)) {
        fb._listing._manager.openOrReveal(fb.model.path+'/'+node.title);
        this.refresh();
        return;
      }
    }
    }).catch(response =>{
        console.log("second response:")
        console.log(response.xhr.status)

      }) ;



  }
  /**
   * Start the internal refresh timer.
   */
  private _startTimer(): void {
    this._refreshId = window.setInterval(() => {
      if (this._requested) {
        this.refresh();
        return;
      }
      let date = new Date().getTime();
      if ((date - this._lastRefresh) > REFRESH_DURATION) {
        this.refresh();
      }
    }, MIN_REFRESH);
  }

  /**
   * Handle internal model refresh logic.
   */
  private _scheduleUpdate(): void {
    let date = new Date().getTime();
    if ((date - this._lastRefresh) > MIN_REFRESH) {
        this.refresh();
    } else {
      this._requested = true;
    }
  }

  private _manager: ServiceManager.IManager = null;
  private _renderer: GitSessions.IRenderer = null;
  private _runningSessions: Session.IModel[] = [];
  private _runningTerminals: TerminalSession.IModel[] = [];
  private _refreshId = -1;
  private _refreshed = new Signal<this, void>(this);
  private _lastRefresh = -1;
  private _requested = false;
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
    /**
     * Create the root node for the running sessions widget.
     */
    createNode(): HTMLElement;

    /**
     * Create a fully populated header node for the terminals section.
     *
     * @returns A new node for a running terminal session header.
     */
    createUncommittedHeaderNode(): HTMLElement;

    /**
     * Create a fully populated header node for the sessions section.
     *
     * @returns A new node for a running kernel session header.
     */
    createUntrackedHeaderNode(): HTMLElement;

    createUnstagedHeaderNode(): HTMLElement;
    /**
     * Create a node for a running terminal session item.
     *
     * @returns A new node for a running terminal session item.
     *
     * #### Notes
     * The data in the node should be uninitialized.
     *
     * The `updateTerminalNode` method will be called for initialization.
     */
    createUncommittedNode(path:string): HTMLLIElement;

    /**
     * Create a node for a running kernel session item.
     *
     * @returns A new node for a running kernel session item.
     *
     * #### Notes
     * The data in the node should be uninitialized.
     *
     * The `updateSessionNode` method will be called for initialization.
     */
    createUntrackedNode(path:string): HTMLLIElement;
    createUnstagedNode(path:string): HTMLLIElement;
    /**
     * Get the shutdown node for a terminal node.
     *
     * @param node - A node created by a call to `createTerminalNode`.
     *
     * @returns The node representing the shutdown option.
     *
     * #### Notes
     * A click on this node is considered a shutdown request.
     * A click anywhere else on the node is considered an open request.
     */
    getUncommittedReset(node: HTMLLIElement): HTMLElement;
    getUncommittedCommit(node: HTMLLIElement): HTMLElement;
    getUncommittedLabel(node: HTMLLIElement): HTMLElement;
    /**
     * Get the shutdown node for a session node.
     *
     * @param node - A node created by a call to `createSessionNode`.
     *
     * @returns The node representing the shutdown option.
     *
     * #### Notes
     * A click on this node is considered a shutdown request.
     * A click anywhere else on the node is considered an open request.
     */
    getUnstagedAdd(node: HTMLLIElement): HTMLElement;
    getUnstagedCheckout(node: HTMLLIElement): HTMLElement;
    getUnstagedLabel(node: HTMLLIElement): HTMLElement;

    getUntrackedAdd(node: HTMLLIElement): HTMLElement;
    getUntrackedLabel(node: HTMLLIElement): HTMLElement;
    /**
     * Populate a node with running terminal session data.
     *
     * @param node - A node created by a call to `createTerminalNode`.
     *
     * @param models - The list of terminal session models.
     *
     * #### Notes
     * This method should completely reset the state of the node to
     * reflect the data for the session models.
     */
    updateUncommittedNode(node: HTMLLIElement, model: TerminalSession.IModel): void;

    /**
     * Populate a node with running kernel session data.
     *
     * @param node - A node created by a call to `createSessionNode`.
     *
     * @param models - The list of kernel session models.
     *
     * @param kernelName - The kernel display name.
     *
     * #### Notes
     * This method should completely reset the state of the node to
     * reflect the data for the session models.
     */
    updateUntrackedNode(node: HTMLLIElement, model: Session.IModel, kernelName: string): void;
  }


  /**
   * The default implementation of `IRenderer`.
   */
  export
  class Renderer implements IRenderer {
    /**
     * Create the root node for the running sessions widget.
     */
    createNode(): HTMLElement {
      let node = document.createElement('div');
      let header = document.createElement('div');
      header.className = HEADER_CLASS;
      let uncommitted = document.createElement('div');
      uncommitted.className = `${SECTION_CLASS} ${UNCOMMITTED_CLASS}`;
      let unstaged = document.createElement('div');
      unstaged.className = `${SECTION_CLASS} ${UNSTAGED_CLASS}`;
      let untracked = document.createElement('div');
      untracked.className = `${SECTION_CLASS} ${UNTRACKED_CLASS}`;

      let refresh = document.createElement('button');
      refresh.className = REFRESH_CLASS;
      header.appendChild(refresh);

      node.appendChild(header);
      node.appendChild(uncommitted);
      node.appendChild(unstaged);
      node.appendChild(untracked);
      return node;
    }

    /**
     * Create a fully populated header node for the terminals section.
     *
     * @returns A new node for a running terminal session header.
     */
    createUncommittedHeaderNode(): HTMLElement {
      let node = document.createElement('div');
      node.textContent = 'Uncommitted Files';

      let git_reset = document.createElement('button');
      git_reset.className = `${RESET_BUTTON_CLASS} jp-mod-styled`;
      git_reset.textContent = 'Reset All';
      node.appendChild(git_reset);

      let git_commit = document.createElement('button');
      git_commit.className = `${COMMIT_BUTTON_CLASS} jp-mod-styled`;
      git_commit.textContent = 'Commit Changes';
      node.appendChild(git_commit);

      return node;
    }

    /**
     * Create a fully populated header node for the sessions section.
     *
     * @returns A new node for a running kernel session header.
     */


    createUnstagedHeaderNode(): HTMLElement {
      let node = document.createElement('div');
      node.textContent = 'Unstaged files';

      let git_add = document.createElement('button');
      git_add.className = `${ADD_BUTTON_CLASS} jp-mod-styled`;
      git_add.textContent = 'Add All';
      node.appendChild(git_add);

      let git_checkout = document.createElement('button');
      git_checkout.className = `${CHECKOUT_BUTTON_CLASS} jp-mod-styled`;
      git_checkout.textContent = 'Discard All';
      node.appendChild(git_checkout);

      return node;
    }

    createUntrackedHeaderNode(): HTMLElement {
      let node = document.createElement('div');
      node.textContent = 'Untracked files';
      
      let git_add = document.createElement('button');
      git_add.className = `${ADD_BUTTON_CLASS} jp-mod-styled`;
      git_add.textContent = 'Add All';
      node.appendChild(git_add);
      
      return node;
    }

    /**
     * Create a node for a running terminal session item.
     *
     * @returns A new node for a running terminal session item.
     *
     * #### Notes
     * The data in the node should be uninitialized.
     *
     * The `updateTerminalNode` method will be called for initialization.
     */
    createUncommittedNode(path: string): HTMLLIElement {
      let node = document.createElement('li');
      let icon = document.createElement('span');
      icon.className = `${ITEM_ICON_CLASS} ${TERMINAL_ICON_CLASS}`;
      let label = document.createElement('span');
      label.className = ITEM_LABEL_CLASS;
      label.textContent = path;
      node.title = path;
      let git_reset = document.createElement('button');
      git_reset.className = `${RESET_BUTTON_CLASS} jp-mod-styled`;
      git_reset.textContent = 'Reset';

      node.appendChild(icon);
      node.appendChild(label);
      node.appendChild(git_reset);
      return node;
    }

    /**
     * Create a node for a running kernel session item.
     *
     * @returns A new node for a running kernel session item.
     *
     * #### Notes
     * The data in the node should be uninitialized.
     *
     * The `updateSessionNode` method will be called for initialization.
     */
    createUntrackedNode(path:string): HTMLLIElement {
      let node = document.createElement('li');
      let icon = document.createElement('span');
      icon.className = ITEM_ICON_CLASS;
      let label = document.createElement('span');
      label.className = ITEM_LABEL_CLASS;
      label.textContent = path;
      node.title = path;
      let git_add = document.createElement('button');
      git_add.className = `${ADD_BUTTON_CLASS} jp-mod-styled`;
      git_add.textContent = 'Add';
      node.appendChild(icon);
      node.appendChild(label);
      node.appendChild(git_add);

      return node;
    }

      createUnstagedNode(path: string): HTMLLIElement {
      let node = document.createElement('li');
      let icon = document.createElement('span');
      icon.className = ITEM_ICON_CLASS;
      let label = document.createElement('span');
      label.className = ITEM_LABEL_CLASS;
      label.textContent = path;
      node.title = path;
      let git_add = document.createElement('button');
      git_add.className = `${ADD_BUTTON_CLASS} jp-mod-styled`;
      git_add.textContent = 'Add';
      let git_checkout = document.createElement('button');
      git_checkout.className = `${CHECKOUT_BUTTON_CLASS} jp-mod-styled`;
      git_checkout.textContent = 'Discard';
      node.appendChild(icon);
      node.appendChild(label);
      node.appendChild(git_add);
      node.appendChild(git_checkout);
      return node;
    }



    /**
     * Get the shutdown node for a terminal node.
     *
     * @param node - A node created by a call to `createTerminalNode`.
     *
     * @returns The node representing the shutdown option.
     *
     * #### Notes
     * A click on this node is considered a shutdown request.
     * A click anywhere else on the node is considered an open request.
     */
    getUncommittedReset(node: HTMLLIElement): HTMLElement {
      return DOMUtils.findElement(node, RESET_BUTTON_CLASS);
    }
    getUncommittedCommit(node: HTMLLIElement): HTMLElement{
      return DOMUtils.findElement(node, COMMIT_BUTTON_CLASS);
    };
    getUncommittedLabel(node: HTMLLIElement): HTMLElement{
      return DOMUtils.findElement(node, ITEM_LABEL_CLASS);
    };

    /**
     * Get the shutdown node for a session node.
     *
     * @param node - A node created by a call to `createSessionNode`.
     *
     * @returns The node representing the shutdown option.
     *
     * #### Notes
     * A click on this node is considered a shutdown request.
     * A click anywhere else on the node is considered an open request.
     */

    getUnstagedAdd(node: HTMLLIElement): HTMLElement {
      return DOMUtils.findElement(node, ADD_BUTTON_CLASS);
    }

    getUnstagedCheckout(node: HTMLLIElement): HTMLElement {
      return DOMUtils.findElement(node, CHECKOUT_BUTTON_CLASS);
    }
    getUnstagedLabel(node: HTMLLIElement): HTMLElement {
      return DOMUtils.findElement(node, ITEM_LABEL_CLASS);
    }

    getUntrackedAdd(node: HTMLLIElement): HTMLElement {
      return DOMUtils.findElement(node, ADD_BUTTON_CLASS);
    }
    getUntrackedLabel(node: HTMLLIElement): HTMLElement {
      return DOMUtils.findElement(node, ITEM_LABEL_CLASS);
    }

    /**
     * Populate a node with running terminal session data.
     *
     * @param node - A node created by a call to `createTerminalNode`.
     *
     * @param models - The list of terminal session models.
     *
     * #### Notes
     * This method should completely reset the state of the node to
     * reflect the data for the session models.
     */
    updateUncommittedNode(node: HTMLLIElement, model: TerminalSession.IModel): void {
      let label = DOMUtils.findElement(node, ITEM_LABEL_CLASS);
      label.textContent = `terminals/${model.name}`;
    }

    /**
     * Populate a node with running kernel session data.
     *
     * @param node - A node created by a call to `createSessionNode`.
     *
     * @param models - The list of kernel session models.
     *
     * @param kernelName - The kernel display name.
     *
     * #### Notes
     * This method should completely reset the state of the node to
     * reflect the data for the session models.
     */
    updateUntrackedNode(node: HTMLLIElement, model: Session.IModel, kernelName: string): void {
      let icon = DOMUtils.findElement(node, ITEM_ICON_CLASS);
      let name = model.name || model.path.split('/').pop();
      if (name.indexOf('.ipynb') !== -1) {
        icon.className = `${ITEM_ICON_CLASS} ${NOTEBOOK_ICON_CLASS}`;
      } else if (model.type.toLowerCase() === 'console') {
        icon.className = `${ITEM_ICON_CLASS} ${CONSOLE_ICON_CLASS}`;
      } else {
        icon.className = `${ITEM_ICON_CLASS} ${FILE_ICON_CLASS}`;
      }
      let label = DOMUtils.findElement(node, ITEM_LABEL_CLASS);
      label.textContent = name;
      let title = (
        `Path: ${model.path}\n` +
        `Kernel: ${kernelName}`
      );
      label.title = title;
    }
  }

  /**
   * The default `Renderer` instance.
   */
  export
  const defaultRenderer = new Renderer();
}

/**
 * The default running sessions extension.
 */
const plugin: JupyterLabPlugin<void> = {
  activate,
  id: 'jupyter.extensions.running-sessions-git',
  requires: [IServiceManager, ILayoutRestorer],
  autoStart: true
};


/**
 * Export the plugin as default.
 */
export default plugin;


/**
 * Activate the running plugin.
 */
function activate(app: JupyterLab, services: IServiceManager, restorer: ILayoutRestorer, panel: ConsolePanel,model: Session.IModel): void {
  let git_plugin = new GitSessions({ manager: services });
  git_plugin.id = 'jp-git-sessions';
  git_plugin.title.label = 'Git';
  //console.log(mainBrowser.title.label);
  // Let the application restorer track the running panel for restoration of
  // application state (e.g. setting the running panel as the current side bar
  // widget).
  app0 = app;

  restorer.add(git_plugin, 'git-sessions');

  // Rank has been chosen somewhat arbitrarily to give priority to the running
  // sessions widget in the sidebar.
  app.shell.addToLeftArea(git_plugin, { rank: 200 });

}
