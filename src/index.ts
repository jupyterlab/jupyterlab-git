
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
  DOMUtils, Dialog, showDialog,Styling
} from '@jupyterlab/apputils';

import {
  ILayoutRestorer, JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
  IServiceManager
} from '@jupyterlab/services';

import {
  PathExt //URLExt
} from '@jupyterlab/coreutils';
/*
import {
  ServerConnection
} from '@jupyterlab/services';
*/
import {
  ConsolePanel
} from '@jupyterlab/console';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  Git, GitBranchResult,GitStatusResult,GitShowPrefixResult,GitShowTopLevelResult,GitLogResult, SingleCommitInfo
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
const HEADER0_CLASS = 'jp-GitSessions-header0';

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
//const SWITCH_BRANCH_CLASS = 'jp-GitSessions-headerSwitchBranch';
/**
 * The class name added to a git-plugin widget header refresh button.
 */
const NEW_TERMINAL_CLASS = 'jp-GitSessions-headerNewTerminal';
/**
 * The class name added to the git-plugin terminal sessions section.
 */
const SECTION_CLASS = 'jp-GitSessions-section';


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
const CHECKOUT_BUTTON_CLASS = 'jp-GitSessions-itemCheckout';
/**
 * The class name added to a git-plugin session item git-commit button.
 */
const COMMIT_BUTTON_CLASS = 'jp-GitSessions-itemCommit';

/**
 * The class name added to a notebook icon.
 */
//const NOTEBOOK_ICON_CLASS = 'jp-mod-notebook';

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
//const TERMINAL_ICON_CLASS = 'jp-mod-terminal';
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
let current_repo_branch = '';
let current_root_repo_path = '';
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

    let git_temp = new Git();

//prepare 6 sections
    /**build the head node (below header0) containing branch info, refresh button, terminal button and triple dot button in the future */
      let headerNode = DOMUtils.findElement(this.node, HEADER_CLASS);
      let headerWholeContainer = this._renderer.createHeaderNode();
      headerNode.appendChild(headerWholeContainer);



    /**build the pastcommits node (below header) containing sliding cards for past commits, left, right button, and a button for current work?? */
      let pastcommitsNode = DOMUtils.findElement(this.node, PAST_COMMIT_CLASS);
      let pastcommitsWholeContainer = this._renderer.createpastcommitsNode();
      pastcommitsNode.appendChild(pastcommitsWholeContainer);
      let pastcommitsList = DOMUtils.findElement(pastcommitsNode, PAST_COMMIT_LIST_CLASS);

      (git_temp.log('')).then(response=> {
        if(response.code==0){
          let data_json = (response as GitLogResult).commits;
          for (var i=0; i<data_json.length; i++){
              let node = renderer.createPastCommitNode(data_json[i], i);
              pastcommitsList.appendChild(node);
          }
        }
      });

      /**build the pastcommitinfoNode (below pastcommits), usually it's hidden, will be visible to display the detail information of a single past commit
       *  if users double click a card of past commit in pastcommits node */
      let pastcommitinfoNode = DOMUtils.findElement(this.node, PAST_COMMIT_INFO_CLASS);
      let pastcommitinfoHeader = this._renderer.createpastcommitinfoHeaderNode();
      pastcommitinfoHeader.className = PAST_COMMIT_INFO_SECTION_HEADER_CLASS;
      pastcommitinfoHeader.hidden = true;
      pastcommitinfoNode.appendChild(pastcommitinfoHeader);
      let pastcommitinfoContainer = document.createElement('div');
      pastcommitinfoContainer.className = CONTAINER_CLASS;
      pastcommitinfoContainer.hidden = true;
      let pastcommitinfoList = document.createElement('ul');
      pastcommitinfoList.className = LIST_CLASS;
      pastcommitinfoContainer.appendChild(pastcommitinfoList);
      pastcommitinfoNode.appendChild(pastcommitinfoContainer);

      /**build the node to hold all staged but uncommitted changes */
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

      /**build the node to hold all unstaged changes */
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

      /**build the node to hold all untracked changes */
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

      
      (git_temp.status('')).then(response=> {
        let SF = 0; /** staged file count */
        let USF = 0; /** unstaged file count */
        let UTF = 0; /** untracked file count */
        if(response.code==0){
          let data_json = (response as GitStatusResult).files;
          for (var i=0; i<data_json.length; i++){
            if(data_json[i].x=="M"){
              let node = renderer.createUncommittedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              uncommittedList.appendChild(node);
              SF++;
            }
            if(data_json[i].y=="M"){
              let node = renderer.createUnstagedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              unstagedList.appendChild(node);
              USF++;
            }
            if(data_json[i].x=="?"&&data_json[i].y=="?"){
              let node = renderer.createUntrackedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              untrackedList.appendChild(node);
              UTF++;
            }
          }
        }
        renderer.UpdateFileCount(uncommittedHeader, SF, 'staged');
        renderer.UpdateFileCount(unstagedHeader, USF, 'unstaged');
        renderer.UpdateFileCount(untrackedHeader, UTF,'untracked');
      });
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
    this.refresh_past_commit_list();
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
   * Refresh the widget.
   */


  open_new_terminal() {
    let ll = app0.shell.widgets('left');
    let fb = ll.next();
    while(fb.id!='filebrowser'){
      fb = ll.next();
    }
    app0.commands.execute('terminal:open', {  path:fb.model.path });
  }
  /**
   * get the path shown in filebrowser widget.
   */
  refresh_current_fb_path():void {
    let ll = app0.shell.widgets('left');
    let fb = ll.next();
    while(fb.id!='filebrowser'){
      fb = ll.next();
    }
    current_fb_path = fb.model.path;
  }

  /**
   * refresh the past commit list.
   */
  refresh_past_commit_list(): Promise<void> {
    let pastcommitsNode = DOMUtils.findElement(this.node, PAST_COMMIT_CLASS);
    let pastcommitsContainer = DOMUtils.findElement(pastcommitsNode, PAST_COMMIT_CONTAINER_CLASS);
    pastcommitsContainer.removeChild(pastcommitsContainer.firstChild);
    let renderer = this._renderer;

    let pastcommitsList = document.createElement('ul');
    pastcommitsList.className = PAST_COMMIT_LIST_CLASS;
    pastcommitsContainer.appendChild(pastcommitsList);

    let git_temp = new Git();
    (git_temp.log(current_fb_path)).then(response=> {
        if(response.code==0){
          let data_json = (response as GitLogResult).commits;
          for (var i=0; i<data_json.length; i++){
              let node = renderer.createPastCommitNode(data_json[i], i);
              pastcommitsList.appendChild(node);
          }
        }
      });
    let promises: Promise<void>[] = [];
    this._lastRefresh = new Date().getTime();
    this._requested = false;
    return Promise.all(promises).then(() => void 0);
  }

  /**
   * Refresh the widget.
   */
  refresh(): Promise<void> {
    let header0Node = DOMUtils.findElement(this.node, HEADER0_CLASS);
    let GitWhoeleContainer = DOMUtils.findElement(this.node, GIT_WHOLE_CONTAINER_CLASS);
    //let headerNode = DOMUtils.findElement(this.node, HEADER_CLASS);
    //let headerWholeContainer = DOMUtils.findElement(headerNode, TOP_CONTAINER_CLASS);
    //let pastcommitsSection = DOMUtils.findElement(this.node, PAST_COMMIT_CLASS);
    //let pastcommitsWholeContainer = DOMUtils.findElement(pastcommitsSection, TOP_CONTAINER_CLASS);
    let uncommittedSection = DOMUtils.findElement(this.node, UNCOMMITTED_CLASS);
    let uncommittedContainer = DOMUtils.findElement(uncommittedSection, CONTAINER_CLASS);
    let untrackedSection = DOMUtils.findElement(this.node, UNTRACKED_CLASS);
    let untrackedContainer = DOMUtils.findElement(untrackedSection, CONTAINER_CLASS);
    let unstagedSection = DOMUtils.findElement(this.node, UNSTAGED_CLASS);
    let unstagedContainer = DOMUtils.findElement(unstagedSection, CONTAINER_CLASS);
    let switch_branch = DOMUtils.findElement(this.node, CSV_TOOLBAR_CLASS);
    let switch_branch_label = DOMUtils.findElement(switch_branch, CSV_TOOLBAR_LABEL_CLASS);
    let switch_branch_old_node = DOMUtils.findElement(switch_branch, CSV_TOOLBAR_DROPDOWN_CLASS);
    let renderer = this._renderer;

    let uncommittedHeader = DOMUtils.findElement(uncommittedSection, SECTION_HEADER_CLASS);
    let unstagedHeader = DOMUtils.findElement(unstagedSection,SECTION_HEADER_CLASS);
    let untrackedHeader = DOMUtils.findElement(untrackedSection,SECTION_HEADER_CLASS);

    //pastcommitsContainer.removeChild(pastcommitsContainer.firstChild);
    uncommittedContainer.removeChild(uncommittedContainer.firstChild);
    unstagedContainer.removeChild(unstagedContainer.firstChild);
    untrackedContainer.removeChild(untrackedContainer.firstChild);

    /** while not in a repo, this step may be performed multiple times, causing null to call remove() (which will cause an error)
     * an easy solution is to use try..catch here to prevent such action
     * A more serious solution may be adding a dummy if not in a repo, but that seems quite redundant ??*/
    try{
      switch_branch_old_node.remove();
    }catch(err){}

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
    (git_temp.branch(current_fb_path)).then(response=>{
      if(response.code==0){
        header0Node.textContent = "HOME:/"+current_fb_path;
        let select = document.createElement('select');
        let data_json = (response as GitBranchResult).repos;
        for (var i=0; i<data_json.length; i++){
          let option = document.createElement('option');
          option.value = data_json[i].name;;
          if(data_json[i].current[0]){
            switch_branch_label.textContent = 'Branch: '+ data_json[i].name;
            option.selected = true;
            current_repo_branch = data_json[i].name;
          }
          if(data_json[i].remote[0]){
            option.textContent = data_json[i].name + ": Remote branch at "+ data_json[i].tag;
          }
          else{
            option.textContent = data_json[i].name + ": "+ data_json[i].tag;
          }
          select.appendChild(option);
        }
        let switch_branch_node = Styling.wrapSelect(select);
        switch_branch_node.classList.add(CSV_TOOLBAR_DROPDOWN_CLASS);
        switch_branch.appendChild(switch_branch_node);

        (git_temp.status(current_fb_path)).then(response=> {
          let SF = 0; /** staged file count */
          let USF = 0; /** unstaged file count */
          let UTF = 0; /** untracked file count */ 
          let Changes = 0;       
        if(response.code==0){
          let data_json = (response as GitStatusResult).files;
          for (var i=0; i<data_json.length; i++){
            if(data_json[i].x!="?"&&data_json[i].x!="!"){
              Changes++;
            }
            if(data_json[i].x=="M"){
              let node = renderer.createUncommittedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              uncommittedList.appendChild(node);
              SF++;
            }
            if(data_json[i].y=="M"){
              let node = renderer.createUnstagedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              unstagedList.appendChild(node);
              USF++;
            }
            if(data_json[i].x=="?"&&data_json[i].y=="?"){
              let node = renderer.createUntrackedNode(data_json[i].to);
              node.classList.add(ITEM_CLASS);
              untrackedList.appendChild(node);
              UTF++;
            }
          }
        }
        renderer.UpdateFileCount(uncommittedHeader, SF, 'Staged');
        renderer.UpdateFileCount(unstagedHeader, USF, 'unstaged');
        renderer.UpdateFileCount(untrackedHeader, UTF, 'untracked');
      });

        GitWhoeleContainer.hidden = false;

      }
      else{
        header0Node.textContent = "HOME:/"+current_fb_path+" || Git-plugin tracks the work directory in jupyterlab-filebrowser, the current folder in a git repository";
        
        GitWhoeleContainer.hidden = true;

      }
    });


    let promises: Promise<void>[] = [];
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
      (git_temp.status(current_fb_path)).then(response=> {
        if(response.code==0){
          let data_json = (response as GitStatusResult).files;
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
      });


  }
  /**
   * Handle the `'click'` event for the widget.
   *
   * #### Notes
   * This listener is attached to the document node.
   */
  private _evtChange(event: MouseEvent): void {
    let switch_branch = DOMUtils.findElement(this.node, CSV_TOOLBAR_CLASS);
    let switch_branch_dropdown = DOMUtils.findElement(switch_branch, CSV_TOOLBAR_DROPDOWN_CLASS);

    let pastcommitsSection = DOMUtils.findElement(this.node, PAST_COMMIT_CLASS);
    let pastcommitsContainer = DOMUtils.findElement(pastcommitsSection, PAST_COMMIT_CONTAINER_CLASS);

    let NL = (switch_branch_dropdown.getElementsByTagName('select')![0]).childNodes;
    for(var i = 0; i<NL.length; i++){
      let option_node = NL.item(i) as HTMLSelectElement;
      if(option_node.selected){ 
        current_repo_branch =  option_node.value;
        let git_temp = new Git();
        git_temp.checkout(true,current_repo_branch, false, null, current_fb_path).then(response=>{
          if(response.code == 0){  
            this.refresh();
            this.refresh_past_commit_list().then(response=>{
              console.log(pastcommitsContainer.scrollWidth);
              pastcommitsContainer.scrollLeft += pastcommitsContainer.scrollWidth;
            });
          }
          else{
/*
            let msg_box = document.createElement('div');
            msg_box.textContent = (response as GitErrorInfo).stderr;
            let input = document.createElement('input');
            msg_box.appendChild(input);
            showDialog({        
              title: 'Input commit message:',
              body: msg_box,
              buttons: [Dialog.cancelButton(), Dialog.warnButton({label: 'Stash'}) ,Dialog.okButton({ label: 'Commit'})]
            }).then(result => {
              if (result.accept&&input.value) {
                git_temp.add(true,null, current_root_repo_path).then(response =>{
                  git_temp.commit(input.value, current_root_repo_path).then(response=>{
                    git_temp.checkout(true,current_repo_branch, false, null, current_fb_path).then(response=>{
                      this.refresh();
                    });
                  });
                })            
              }
            });            
          */
          }
        });
        return;   
      }    
    }
    return;  
  }
  /**
   * Handle the `'click'` event for the widget.
   *
   * #### Notes
   * This listener is attached to the document node.
   */
  private _evtClick(event: MouseEvent): void {
    // Fetch common variables.
    let GitWhoeleContainer = DOMUtils.findElement(this.node, GIT_WHOLE_CONTAINER_CLASS);
    if(GitWhoeleContainer.hidden){
      return;
    }
    let uncommittedSection = DOMUtils.findElement(this.node, UNCOMMITTED_CLASS);
    let uncommittedHeader = DOMUtils.findElement(uncommittedSection, SECTION_HEADER_CLASS);
    let uncommittedList = DOMUtils.findElement(uncommittedSection, LIST_CLASS);
    let unstagedSection = DOMUtils.findElement(this.node, UNSTAGED_CLASS);
    let unstagedHeader = DOMUtils.findElement(unstagedSection,SECTION_HEADER_CLASS);
    let unstagedList = DOMUtils.findElement(unstagedSection, LIST_CLASS);
    let untrackedSection = DOMUtils.findElement(this.node, UNTRACKED_CLASS);
   // let untrackedHeader = DOMUtils.findElement(untrackedSection,SECTION_HEADER_CLASS);
    let untrackedList = DOMUtils.findElement(untrackedSection, LIST_CLASS);



    let pastcommitsSection = DOMUtils.findElement(this.node, PAST_COMMIT_CLASS);
    let pastcommits_left_button = DOMUtils.findElement(pastcommitsSection, SHIFT_LEFT_BUTTON_CLASS);
    let pastcommits_right_button = DOMUtils.findElement(pastcommitsSection, SHIFT_RIGHT_BUTTON_CLASS);
    let pastcommitsContainer = DOMUtils.findElement(pastcommitsSection, PAST_COMMIT_CONTAINER_CLASS);

    let new_terminal = DOMUtils.findElement(this.node, NEW_TERMINAL_CLASS);
    let refresh = DOMUtils.findElement(this.node, REFRESH_CLASS);
    let renderer = this._renderer;
    let clientX = event.clientX;
    let clientY = event.clientY;
      
    this.refresh_current_fb_path();


     // Check for opening a new terminal.
    if (ElementExt.hitTest(new_terminal, clientX, clientY)) {
      this.open_new_terminal();
      return;
    }  

    // Check for a refresh.
    if (ElementExt.hitTest(refresh, clientX, clientY)) {
      this.refresh();
      return;
    }

    //check for commit list left shift
    if (ElementExt.hitTest(pastcommits_left_button, clientX, clientY)) {
      console.log("left shift");
      $(pastcommitsContainer).animate({scrollTop: pastcommitsContainer.scrollTop-200});
      $(pastcommitsContainer).animate({scrollLeft: pastcommitsContainer.scrollLeft-200});
    }

    //check for commit list right shift
    if (ElementExt.hitTest(pastcommits_right_button, clientX, clientY)) {
      console.log("right shift");
      $(pastcommitsContainer).animate({scrollTop: pastcommitsContainer.scrollTop+200});
      $(pastcommitsContainer).animate({scrollLeft: pastcommitsContainer.scrollLeft+200});
    }

    let git_temp = new Git();
      

    git_temp.showtoplevel(current_fb_path).then(response=>{
      if(response.code==0){
        current_root_repo_path = (response as GitShowTopLevelResult).top_repo_path;
        let node0 = uncommittedHeader as HTMLLIElement;

        let git_reset_all = renderer.getUncommittedReset(node0);
        if (ElementExt.hitTest(git_reset_all, clientX, clientY)) {
          git_temp.reset(true,null,current_root_repo_path).then(response=>{
            this.refresh();
            return;
          });
        }

        let git_commit = renderer.getUncommittedCommit(node0);
        if (ElementExt.hitTest(git_commit, clientX, clientY)) {
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
                git_temp.commit(msg, current_root_repo_path).then(response=>{
                  this.refresh();
                  this.refresh_past_commit_list().then(response=>{
                    console.log(pastcommitsContainer.scrollWidth);
                    pastcommitsContainer.scrollLeft += pastcommitsContainer.scrollWidth;
                  });
                });
            }
        });
          return;
        }
        // Check for a uncommitted item click.
        let index = DOMUtils.hitTestNodes(uncommittedList.children, clientX, clientY);
        if (index !== -1) {
          let node = uncommittedList.children[index] as HTMLLIElement;
          let git_reset = renderer.getUncommittedReset(node);
          if (ElementExt.hitTest(git_reset, clientX, clientY)) {
            git_temp.reset(false,node.title, current_root_repo_path).then(response=>{
              this.refresh();
              return;
            });
          }
        }
    
    
        node0 = unstagedHeader as HTMLLIElement;
        let git_add_all = renderer.getUnstagedAdd(node0);
        if (ElementExt.hitTest(git_add_all, clientX, clientY)) {
          git_temp.add(true,null, current_root_repo_path).then(response=>{
            this.refresh();
            return;
          });
        }

        let git_checkout_all = renderer.getUnstagedCheckout(node0);
        if (ElementExt.hitTest(git_checkout_all, clientX, clientY)) {
          showDialog({
            title: 'DISCARD CHANGES',
            body: "Do you really want to discard all uncommitted changes?",
            buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard'})]
          }).then(result => {
            if (result.button.accept) {
                git_temp.checkout(false, null,true,null,current_root_repo_path).then(response=>{
                  this.refresh();
                });
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
            git_temp.add(false,node.title,current_root_repo_path).then(response=>{
              this.refresh();
              return;
            });
          }
          else if(ElementExt.hitTest(git_checkout, clientX, clientY)) {
            showDialog({
              title: 'DISCARD CHANGES',
              body: "Do you really want to discard the uncommitted changes in this file?",
              buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard'})]
            }).then(result => {
              if (result.button.accept) {
                git_temp.checkout(false, null, false,node.title,current_root_repo_path).then(response=>{
                  this.refresh();
                });
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
            git_temp.add(false,node.title,current_root_repo_path).then(respones=>{
              this.refresh();
              return;
            });
          }
        }
      }
      }) ;
  }
  /**
   * Handle the `'dblclick'` event for the widget.
   */
  private _evtDblClick(event: MouseEvent): void {
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
    let GitWhoeleContainer = DOMUtils.findElement(this.node, GIT_WHOLE_CONTAINER_CLASS);
    if(GitWhoeleContainer.hidden){
      return;
    }

    let pastcommitinfoSection = DOMUtils.findElement(this.node, PAST_COMMIT_INFO_CLASS);
    let pastcommitinfoContainer = DOMUtils.findElement(pastcommitinfoSection, CONTAINER_CLASS);
    let pastcommitinfoHeader = DOMUtils.findElement(pastcommitinfoSection, PAST_COMMIT_INFO_SECTION_HEADER_CLASS);

    let uncommittedSection = DOMUtils.findElement(this.node, UNCOMMITTED_CLASS);
    let uncommittedList = DOMUtils.findElement(uncommittedSection, LIST_CLASS);
    let unstagedSection = DOMUtils.findElement(this.node, UNSTAGED_CLASS);
    let unstagedList = DOMUtils.findElement(unstagedSection, LIST_CLASS);
    let untrackedSection = DOMUtils.findElement(this.node, UNTRACKED_CLASS);
    let untrackedList = DOMUtils.findElement(untrackedSection, LIST_CLASS);
    
    let uncommittedHeader = DOMUtils.findElement(uncommittedSection, SECTION_HEADER_CLASS);
    let unstagedHeader = DOMUtils.findElement(unstagedSection,SECTION_HEADER_CLASS);
    let untrackedHeader = DOMUtils.findElement(untrackedSection,SECTION_HEADER_CLASS);

    let uncommittedContainer = DOMUtils.findElement(uncommittedSection, CONTAINER_CLASS);
    let untrackedContainer = DOMUtils.findElement(untrackedSection, CONTAINER_CLASS);
    let unstagedContainer = DOMUtils.findElement(unstagedSection, CONTAINER_CLASS);


    let pastcommitsSection = DOMUtils.findElement(this.node, PAST_COMMIT_CLASS);
    let pastcommitsContainer = DOMUtils.findElement(pastcommitsSection, PAST_COMMIT_CONTAINER_CLASS);
    let pastcommitsList = DOMUtils.findElement(pastcommitsContainer, PAST_COMMIT_LIST_CLASS);
    let currentworkbutton = DOMUtils.findElement(pastcommitsSection, CUR_BUTTON_CLASS);
    let pastcommits_left_button = DOMUtils.findElement(pastcommitsSection, SHIFT_LEFT_BUTTON_CLASS);
    let pastcommits_right_button = DOMUtils.findElement(pastcommitsSection, SHIFT_RIGHT_BUTTON_CLASS);

    let renderer = this._renderer;
    let clientX = event.clientX;
    let clientY = event.clientY;
    
    let git_temp = new Git();

    // Check for a past commit item click.
    if(ElementExt.hitTest(currentworkbutton, clientX, clientY)){
          console.log(pastcommitsContainer.scrollWidth);
          pastcommitinfoContainer.hidden = true;
          pastcommitinfoHeader.hidden = true;
          uncommittedHeader.hidden = false
          uncommittedContainer.hidden = false;
          unstagedHeader.hidden = false;
          unstagedContainer.hidden = false;
          untrackedHeader.hidden = false;
          untrackedContainer.hidden = false;
          this.refresh();
    }
    else if(ElementExt.hitTest(pastcommits_left_button, clientX, clientY)){
      $(pastcommitsContainer).animate({scrollTop: pastcommitsContainer.scrollTop-200});
      $(pastcommitsContainer).animate({scrollLeft: pastcommitsContainer.scrollLeft-200});
    }
    else if(ElementExt.hitTest(pastcommits_right_button, clientX, clientY)){
      $(pastcommitsContainer).animate({scrollTop: pastcommitsContainer.scrollTop+200});
      $(pastcommitsContainer).animate({scrollLeft: pastcommitsContainer.scrollLeft+200}); 
    }
    else{
      let index = DOMUtils.hitTestNodes(pastcommitsList.children, clientX, clientY);
      if (index !== -1) {
        let node = pastcommitsList.children[index] as HTMLLIElement;
        let past_commit = renderer.getPastCommitButton(node);
        if (ElementExt.hitTest(past_commit, clientX, clientY)) {
          console.log('just hit past commit');
          console.log(past_commit.getAttribute('commit'));
          console.log(past_commit.getAttribute('Author'));

          let label_node = pastcommitinfoHeader.firstChild;
          label_node.textContent = 'Commit: '+past_commit.getAttribute('commit');
          label_node = label_node.nextSibling;
          label_node.textContent = 'Author: '+past_commit.getAttribute('author');
          label_node = label_node.nextSibling;
          label_node.textContent = 'Date: '+past_commit.getAttribute('date');
          label_node = label_node.nextSibling;
          label_node.textContent = past_commit.getAttribute('commit_msg');

          pastcommitinfoContainer.removeChild(pastcommitinfoContainer.firstChild);
          let pastcommitinfoList = document.createElement('ul');
          pastcommitinfoList.className = LIST_CLASS;
          pastcommitinfoContainer.appendChild(pastcommitinfoList);

          for (var i=0; i<3; i++){
              let node = renderer.createPastCommitInforFileNode('src/index.ts');
              node.classList.add(ITEM_CLASS);
              pastcommitinfoList.appendChild(node);
          }

          pastcommitinfoContainer.hidden = false;
          pastcommitinfoHeader.hidden = false;
          uncommittedHeader.hidden = true
          uncommittedContainer.hidden = true;
          unstagedHeader.hidden = true;
          unstagedContainer.hidden = true;
          untrackedHeader.hidden = true;
          untrackedContainer.hidden = true;




        }
        return;
      }
    }
    let ll = app0.shell.widgets('left');
    let fb = ll.next();
    while(fb.id!='filebrowser'){
      fb = ll.next();
    }


      
    let current_under_repo_path = '';
    git_temp.showprefix(fb.model.path).then(response=>{
        if(response.code==0){
          current_under_repo_path = (response as GitShowPrefixResult).under_repo_path;
          let filebrowser_cur_path = fb.model.path+'/';
          let open_file_path = filebrowser_cur_path.substring(0,filebrowser_cur_path.length-current_under_repo_path.length);
          // Check for a uncommitted item click.
          let index = DOMUtils.hitTestNodes(uncommittedList.children, clientX, clientY);
          if (index !== -1) {
            let node = uncommittedList.children[index] as HTMLLIElement;
            let git_label = renderer.getUncommittedLabel(node);
            if (ElementExt.hitTest(git_label, clientX, clientY)) {
              //let temp = find(fb._listing._sortedItems as  Contents.IModel[], value => value.path === open_file_path+node.title);
              if(node.title[node.title.length-1]!=='/'){
                fb._listing._manager.openOrReveal(open_file_path+node.title);
              }
              else{
                console.log("Cannot open a folder here")
              };
              return;
            }
          }

          // Check for a unstaged item click.
          index = DOMUtils.hitTestNodes(unstagedList.children, clientX, clientY);
          if (index !== -1) {
            let node = unstagedList.children[index] as HTMLLIElement;
            let git_label = renderer.getUnstagedLabel(node);
            if (ElementExt.hitTest(git_label, clientX, clientY)) {
              if(node.title[node.title.length-1]!=='/'){
                fb._listing._manager.openOrReveal(open_file_path+node.title);
              }
              else{
                console.log("Cannot open a folder here")
              };            
              return;
            }
          }

          // Check for a untracked item click.
          index = DOMUtils.hitTestNodes(untrackedList.children, clientX, clientY);
          if (index !== -1) {
            let node = untrackedList.children[index] as HTMLLIElement;
            let git_label = renderer.getUntrackedLabel(node);
            if (ElementExt.hitTest(git_label, clientX, clientY)) {
              if(node.title[node.title.length-1]!=='/'){
                fb._listing._manager.openOrReveal(open_file_path+node.title);
              }
              else{
                console.log("Cannot open a folder here")
              };         
              return;
            }
          }
        }
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
    createHeaderNode(): HTMLElement;
    createpastcommitsNode(): HTMLElement; 
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

    createpastcommitinfoHeaderNode():HTMLElement;
    createPastCommitNode(commit_info:SingleCommitInfo, num: number): HTMLSpanElement;
    createPastCommitInforFileNode(path:string): HTMLLIElement;
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

    getPastCommitButton(node: HTMLLIElement): HTMLElement;
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
    UpdateFileCount(node: HTMLElement, num: number, label: string):void;
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
      let header0 = this.createPathHeaderNode();
      header0.className = HEADER0_CLASS;

      /**create a container for all Git related info (visiblity depends on if it's in a repo) */
      let GitWhoeleContainer = document.createElement('div');
      GitWhoeleContainer.className = GIT_WHOLE_CONTAINER_CLASS;

      let header = document.createElement('div');
      header.className = HEADER_CLASS;
      

      let past_commits = document.createElement('div');
      past_commits.className = `${SECTION_CLASS} ${PAST_COMMIT_CLASS}`;

      let past_commit_info = document.createElement('div');
      past_commit_info.className = `${SECTION_CLASS} ${PAST_COMMIT_INFO_CLASS}`;

      let uncommitted = document.createElement('div');
      uncommitted.className = `${SECTION_CLASS} ${UNCOMMITTED_CLASS}`;
      let unstaged = document.createElement('div');
      unstaged.className = `${SECTION_CLASS} ${UNSTAGED_CLASS}`;
      let untracked = document.createElement('div');
      untracked.className = `${SECTION_CLASS} ${UNTRACKED_CLASS}`;
      
      node.appendChild(header0);
      node.appendChild(GitWhoeleContainer);
      GitWhoeleContainer.appendChild(header);
      GitWhoeleContainer.appendChild(past_commits);
      GitWhoeleContainer.appendChild(past_commit_info);
      GitWhoeleContainer.appendChild(uncommitted);
      GitWhoeleContainer.appendChild(unstaged);
      GitWhoeleContainer.appendChild(untracked);

      return node;
    }
    /**
     * Create a fully populated header node for the terminals section.
     *
     * @returns A new node for a running terminal session header.
     */
    createPathHeaderNode(): HTMLElement {
      let node = document.createElement('div');
      node.textContent = 'Current Path Repo';
      node.className = SECTION_HEADER_CLASS;
      return node;
    }

    createHeaderNode(): HTMLElement {

      let headerWholeContainer = document.createElement('div');
      headerWholeContainer.className = TOP_CONTAINER_CLASS;

      let switch_branch = document.createElement('div');
      switch_branch.className = CSV_TOOLBAR_CLASS;
      let label = document.createElement('span');
      let select = document.createElement('select');
      label.textContent = 'Branch: ';
      label.className = CSV_TOOLBAR_LABEL_CLASS;
      {
        let option = document.createElement('option');
        option.value = 'initial dummy node';
        option.textContent = '';
        select.appendChild(option);
      };
      switch_branch.appendChild(label);
      let switch_branch_node = Styling.wrapSelect(select);
      switch_branch_node.classList.add(CSV_TOOLBAR_DROPDOWN_CLASS);
      switch_branch.appendChild(switch_branch_node);
      headerWholeContainer.appendChild(switch_branch);

      let refresh = document.createElement('button');
      refresh.className = REFRESH_CLASS;
      headerWholeContainer.appendChild(refresh);
      let new_terminal = document.createElement('button');
      new_terminal.className = NEW_TERMINAL_CLASS;
      headerWholeContainer.appendChild(new_terminal);
      
      return headerWholeContainer;
    }

    createpastcommitsNode(): HTMLElement {
      let pastcommitsWholeContainer = document.createElement('div');
      pastcommitsWholeContainer.className = TOP_CONTAINER_CLASS;

      let pastcommitsContainer = document.createElement('div');
      pastcommitsContainer.id = "past_commits_list";
      pastcommitsContainer.className = PAST_COMMIT_CONTAINER_CLASS;

      let shift_left = document.createElement('button');
      shift_left.textContent = '<';
      shift_left.className = SHIFT_LEFT_BUTTON_CLASS;
      pastcommitsWholeContainer.appendChild(shift_left);

      let pastcommitsList = document.createElement('ul');
      pastcommitsList.className = PAST_COMMIT_LIST_CLASS;
      pastcommitsContainer.appendChild(pastcommitsList);
      pastcommitsWholeContainer.appendChild(pastcommitsContainer);

      let shift_right = document.createElement('button');
      shift_right.textContent = '>';
      shift_right.className = SHIFT_RIGHT_BUTTON_CLASS;
      pastcommitsWholeContainer.appendChild(shift_right);

      let cur_work = document.createElement('button');
      cur_work.className = CUR_BUTTON_CLASS;
      cur_work.textContent = 'CUR';
      pastcommitsWholeContainer.appendChild(cur_work);

      return pastcommitsWholeContainer;
    }

    createpastcommitinfoHeaderNode():HTMLElement{
      let node = document.createElement('div');
      //node.textContent = 'Staged Files';
      
      let commit = document.createElement('div');
      commit.className = PAST_COMMIT_INFO_LABEL_CLASS;
      commit.textContent = 'commit'
      node.appendChild(commit);

      let author = document.createElement('div');
      author.className = PAST_COMMIT_INFO_LABEL_CLASS;
      author.textContent = 'author'
      node.appendChild(author);

      let date = document.createElement('div');
      date.className = PAST_COMMIT_INFO_LABEL_CLASS;
      date.textContent = 'date';
      node.appendChild(date);

      let commit_msg = document.createElement('div');
      commit_msg.className = PAST_COMMIT_INFO_LABEL_CLASS;
      commit_msg.textContent = 'commit msg';
      node.appendChild(commit_msg);
/*
      let commit_info = document.createElement('div');
      commit_info.className = PAST_COMMIT_INFO_LABEL_CLASS;
      commit_info.textContent = '1 file changed';
      node.appendChild(commit_info);
*/
      return node;  
    }
    /**
     * Create a fully populated header node for the terminals section.
     *
     * @returns A new node for a running terminal session header.
     */
    createUncommittedHeaderNode(): HTMLElement {
      let node = document.createElement('div');
      //node.textContent = 'Staged Files';
      
      let label = document.createElement('span');
      label.className = ITEM_LABEL_CLASS;
      label.textContent = 'Staged Files';
      node.appendChild(label);

      let git_reset = document.createElement('button');
      git_reset.className = `${RESET_BUTTON_CLASS} jp-mod-styled`;
      git_reset.textContent = 'Reset';
      node.appendChild(git_reset);

      let git_commit = document.createElement('button');
      git_commit.className = `${COMMIT_BUTTON_CLASS} jp-mod-styled`;
      git_commit.textContent = 'Commit';
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
      //node.textContent = 'Unstaged files';

      let label = document.createElement('span');
      label.className = ITEM_LABEL_CLASS;
      label.textContent = 'Unstaged Files';
      node.appendChild(label);

      let git_add = document.createElement('button');
      git_add.className = `${ADD_BUTTON_CLASS} jp-mod-styled`;
      git_add.textContent = 'Add';
      node.appendChild(git_add);

      let git_checkout = document.createElement('button');
      git_checkout.className = `${CHECKOUT_BUTTON_CLASS} jp-mod-styled`;
      git_checkout.textContent = 'Discard';
      node.appendChild(git_checkout);

      return node;
    }

    createUntrackedHeaderNode(): HTMLElement {
      let node = document.createElement('div');
      //node.textContent = 'Untracked files';

      let label = document.createElement('span');
      label.className = ITEM_LABEL_CLASS;
      label.textContent = 'Untracked Files';
      node.appendChild(label);
      
      let git_add = document.createElement('button');
      git_add.className = `${ADD_BUTTON_CLASS} jp-mod-styled`;
      git_add.textContent = 'Add';
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
      icon.className = `${ITEM_ICON_CLASS} ${parseFileExtension(path)}`;
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
      icon.className = `${ITEM_ICON_CLASS} ${parseFileExtension(path)}`;
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
      
      icon.className = `${ITEM_ICON_CLASS} ${parseFileExtension(path)}`;
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

    createPastCommitNode(commit_info: SingleCommitInfo, num:number): HTMLSpanElement{
      let past_commit_container = document.createElement('span');
      past_commit_container.className = PAST_SINGLE_COMMIT_CONTAINER_CLASS;
      past_commit_container.textContent = "---"
      let node = document.createElement('button');
      node.className = PAST_COMMIT_BUTTON_CLASS;
      if(num==0){
          node.id = "H";
          node.textContent = "H";
      }
      else{
        node.id = "^"+num;
        node.textContent = "^"+num;
      }
      node.setAttribute('commit', commit_info.commit);
      node.setAttribute('author',commit_info.author);
      node.setAttribute('date', commit_info.date);
      node.setAttribute('commit_msg', commit_info.commit_msg);
      node.setAttribute('file_changed','1');
      node.setAttribute("file_path", 'src/index.ts');
      node.setAttribute('open', 'no');
      past_commit_container.appendChild(node);
      
      return past_commit_container;
    }
    
    createPastCommitInforFileNode(path:string): HTMLLIElement{
      let node = document.createElement('li');
      let icon = document.createElement('span');
      icon.className = `${ITEM_ICON_CLASS} ${parseFileExtension(path)}`;
      let label = document.createElement('span');
      label.className = ITEM_LABEL_CLASS;
      label.textContent = path;
      node.title = path;
      node.appendChild(icon);
      node.appendChild(label);
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

    getPastCommitButton(node: HTMLLIElement): HTMLElement{
      return DOMUtils.findElement(node, PAST_COMMIT_BUTTON_CLASS);
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
        icon.className = `${ITEM_ICON_CLASS} ${FOLDER_MATERIAL_ICON_CLASS}`;
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

    UpdateFileCount(node: HTMLElement, num: number ,label: string){
      let label_node = DOMUtils.findElement(node, ITEM_LABEL_CLASS);
      label_node.textContent = label + " ("+num+")";
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
  // Let the application restorer track the running panel for restoration of
  // application state (e.g. setting the running panel as the current side bar
  // widget).
  app0 = app;
  restorer.add(git_plugin, 'git-sessions');

  // Rank has been chosen somewhat arbitrarily to give priority to the running
  // sessions widget in the sidebar.
  app.shell.addToLeftArea(git_plugin, { rank: 200 });

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


