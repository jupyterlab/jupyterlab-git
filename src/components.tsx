
import * as React from 'react';
import * as ReactDOM from 'react-dom';
//import ReactWidget from 'react-widgets';
import {
  ServiceManager, Session, TerminalSession
} from '@jupyterlab/services';

import {
  Message
} from '@phosphor/messaging';
/*
import {
  ElementExt
} from '@phosphor/domutils';
*/
import {
  Widget//, Menu
} from '@phosphor/widgets';

import {
  DOMUtils, Dialog, showDialog,/*Styling,*/// IMainMenu
} from '@jupyterlab/apputils';

import {
  JupyterLab
} from '@jupyterlab/application';

/*
import {
  PathExt //URLExt
} from '@jupyterlab/coreutils';

import * as vdom from '@phosphor/virtualdom';

import {
  VDomModel, VDomRenderer
} from '@jupyterlab/apputils';
*/



import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  Git//, GitBranchResult,GitStatusResult,GitShowPrefixResult,GitShowTopLevelResult,GitLogResult,GitErrorInfo,SingleCommitInfo, SingleCommitFilePathInfo
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
//const HEADER_CLASS = 'jp-GitSessions-header';

const SHIFT_LEFT_BUTTON_CLASS = 'jp-GitSessions-headershiftleftbutton';
const SHIFT_RIGHT_BUTTON_CLASS = 'jp-GitSessions-headershiftrightbutton';
//const CUR_BUTTON_CLASS = 'jp-GitSessions-headercurbutton'; 

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
//const NEW_TERMINAL_CLASS = 'jp-GitSessions-headerNewTerminal';
/**
 * The class name added to the git-plugin terminal sessions section.
 */
//const SECTION_CLASS = 'jp-GitSessions-section';

//const PATH_HEADER_CLASS = 'jp-GitSessions-pathHeaderSection';

//const PAST_COMMIT_CLASS = 'jp-GitSessions-pastcommitsection';

//const PAST_COMMIT_INFO_CLASS = 'jp-GitSessions-pastcommitinfoSection';
/**
 * The class name added to the git-plugin terminal sessions section.
 */
//const UNCOMMITTED_CLASS = 'jp-GitSessions-uncommittedSection';

/**
 * The class name added to the git-plugin kernel sessions section.
 */
//const UNTRACKED_CLASS = 'jp-GitSessions-untrackedSection';

//const UNSTAGED_CLASS = 'jp-GitSessions-unstagedSection';

/**
 * The class name added to the git-plugin sessions section header.
 */
//const SECTION_HEADER_CLASS = 'jp-GitSessions-sectionHeader';

/**
 * The class name added to a section container.
 */
//const GIT_WHOLE_CONTAINER_CLASS = 'jp-GitSessions-sectionGitWholeContainer';
const TOP_CONTAINER_CLASS = 'jp-GitSessions-sectionTopContainer';
//const CONTAINER_CLASS = 'jp-GitSessions-sectionContainer';
const PAST_COMMIT_CONTAINER_CLASS = 'jp-GitSessions-sectionPastCommitContainer';
//const PAST_SINGLE_COMMIT_CONTAINER_CLASS = 'jp-GitSessions-sectionPastSingleCommitContainer';
//const PAST_COMMIT_BUTTON_CLASS = 'jp-GitSessions-sectionPastCommitButton';
//const PAST_COMMIT_SELECTED_BUTTON_CLASS = 'jp-GitSessions-sectionPastCommitSelectedButton';
/**
 * The class name added to the git-plugin kernel sessions section list.
 */
//const LIST_CLASS = 'jp-GitSessions-sectionList';

const PAST_COMMIT_LIST_CLASS = 'jp-GitSessions-sectionPastCommitList';
//const PAST_COMMIT_INFO_SECTION_HEADER_CLASS = 'jp-GitSessions-pastcommitinfosectionHeader';
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
//const NOTEBOOK_ICON_CLASS = 'jp-mod-notebook';

/**
 * The class name added to a console icon.
 */
//const CONSOLE_ICON_CLASS = 'jp-mod-console';

/**
 * The class name added to a file icon.
 */
//const FILE_ICON_CLASS = 'jp-mod-file';

/**
 * The class name added to a terminal icon.
 */
//const TERMINAL_ICON_CLASS = 'jp-mod-terminal';
/**
 * The class name added to a markdown file browser item.
 */
//const MARKDOWN_ICON_CLASS = 'jp-MarkdownIcon';

/**
 * The class name added to a python file browser item.
 */
const PYTHON_ICON_CLASS = 'jp-PythonIcon';

/**
 * The class name added to a JSON file browser item.
 */
//const JSON_ICON_CLASS = 'jp-JSONIcon';

const HOME_ICON_CLASS = 'jp-homeIcon';
/**
 * The class name added to a speadsheet file browser item.
 */
//const SPREADSHEET_ICON_CLASS = 'jp-SpreadsheetIcon';

/**
 * The class name added to a R Kernel file browser item.
 */
//const RKERNEL_ICON_CLASS = 'jp-RKernelIcon';

/**
 * The class name added to a YAML file browser item.
 */
//const YAML_ICON_CLASS = 'jp-YamlIcon';

/**
 * The class added for image file browser items.
 */
//const IMAGE_ICON_CLASS = 'jp-ImageIcon';

/**
 * The class name added to a file type content item.
 */
//const FILE_TYPE_CLASS = 'jp-FileIcon';

/**
 * The class name added to a directory file browser item.
 */
//const FOLDER_MATERIAL_ICON_CLASS = 'jp-OpenFolderIcon';
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
//const REFRESH_DURATION = 50000;

/**
 * The enforced time between refreshes in ms.
 */
//const MIN_REFRESH = 5000;


//let app0 = null;
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
    $(app).ready(function(){
      let ll = app.shell.widgets('left');
      let fb = ll.next();
      while(fb.id!='filebrowser'){
        fb = ll.next();
      }
      let current_fb_path = (fb as any).model.path;
      ReactDOM.render(<GitSessionNode(current_fb_path) />, this.node);
    });
      

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





class GitSessionNode extends React.Component{
  constructor(current_fb_path:string) {
    super();
	}  
  render(){
    return(
      <div >
        <PathHeader />
        <GitWholeContainer />
      </div>
    );
  }
}

class PathHeader extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      React.createElement('div',{className:"TOP_CONTAINER_CLASS"},
        React.createElement('li',{className: ITEM_CLASS}, 
          React.createElement('span', {className:`${ITEM_ICON_CLASS} ${HOME_ICON_CLASS}`}),
          React.createElement('span',{className: ITEM_LABEL_CLASS}, "current_path _in_filefrowser"),
          React.createElement('button',{className: REFRESH_CLASS})
        )
        //React.createElement('li',{className:`${ADD_BUTTON_CLASS} jp-mod-styled`}," Git-plugin tracks the work directory in jupyterlab-filebrowser, the current folder is not under a git repository")
      )
    );
  }
}

class GitWholeContainer extends React.Component{
  constructor() {
    super();
	}
  render(){
    return(
      <div>
        <BranchHeader />
        <PastCommits />
        <SinglePastCommitInfo />
        <Staged />
        <Unstaged />
        <Untracked />
        </div>
    );
  }
}


class BranchHeader extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      React.createElement('div', {className : CSV_TOOLBAR_CLASS},
        React.createElement('span',{className : CSV_TOOLBAR_LABEL_CLASS},"current_branch"),
        React.createElement('select',{className : CSV_TOOLBAR_DROPDOWN_CLASS})
      )
    );
  }
}

class PastCommits extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      React.createElement('div',{className: TOP_CONTAINER_CLASS},
        React.createElement('button',{className : SHIFT_LEFT_BUTTON_CLASS}, '<'),
        React.createElement('div',{className : PAST_COMMIT_LIST_CLASS},
            React.createElement('ul',{className : PAST_COMMIT_CONTAINER_CLASS})
          ),      
        React.createElement('button',{className : SHIFT_RIGHT_BUTTON_CLASS},'>')
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

class Staged extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      <div>
        <StagedHeader />
        <StagedNode />
      </div>
    );
  }
}

class StagedHeader extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      React.createElement('div',{className: TOP_CONTAINER_CLASS},
        React.createElement('span',{className:ITEM_LABEL_CLASS}, 'Staged'),
        React.createElement('button',{className:`${RESET_BUTTON_CLASS} jp-mod-styled`}, 'Reset'),
        React.createElement('button',{className:`${COMMIT_BUTTON_CLASS} jp-mod-styled`}, 'Commit')
      )
    );
  }
}

class StagedNode extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      React.createElement('li',{className: TOP_CONTAINER_CLASS},
        React.createElement('span',{className:`${ITEM_ICON_CLASS} ${PYTHON_ICON_CLASS}`}),
        React.createElement('span',{className:ITEM_LABEL_CLASS}, 'dummy staged files'),
        React.createElement('button',{className:`${RESET_BUTTON_CLASS} jp-mod-styled`}, 'Reset')
      )
    );
  }
}

class Unstaged extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      <div>
        <UnstagedHeader />
        <UnstagedNode />
      </div>
    );
  }
}

class UnstagedHeader extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      React.createElement('div',{className: TOP_CONTAINER_CLASS},
        React.createElement('span',{className:ITEM_LABEL_CLASS}, 'Unstaged'),
        React.createElement('button',{className:`${ADD_BUTTON_CLASS} jp-mod-styled`}, 'Add'),
        React.createElement('button',{className:`${RESET_BUTTON_CLASS} jp-mod-styled`}, 'Reset')
      )
    );
  }
}

class UnstagedNode extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      React.createElement('li',{className: TOP_CONTAINER_CLASS},
        React.createElement('span',{className:`${ITEM_ICON_CLASS} ${PYTHON_ICON_CLASS}`}),
        React.createElement('span',{className:ITEM_LABEL_CLASS},'dummy unstaged files'),
        React.createElement('button',{className:`${ADD_BUTTON_CLASS} jp-mod-styled`}, 'Add'),
        React.createElement('button',{className:`${RESET_BUTTON_CLASS} jp-mod-styled`}, 'Reset')
      )
    );
  }
}


class Untracked extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      <div>
        <UntrackedHeader />
        <UntrackedNode />
      </div>
    );
  }
}

class UntrackedHeader extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      React.createElement('div',{className: TOP_CONTAINER_CLASS},
        React.createElement('span',{className:ITEM_LABEL_CLASS}, 'Untracked'),
        React.createElement('button',{className:`${ADD_BUTTON_CLASS} jp-mod-styled`}, 'Add'),
      )
    );
  }
}

class UntrackedNode extends React.Component{
  constructor() {
    super();
	}
  render(){
    return (
      React.createElement('li',{className: TOP_CONTAINER_CLASS},
        React.createElement('span',{className:`${ITEM_ICON_CLASS} ${PYTHON_ICON_CLASS}`}),
        React.createElement('span',{className:ITEM_LABEL_CLASS}, 'dummy untracked files'),
        React.createElement('button',{className:`${ADD_BUTTON_CLASS} jp-mod-styled`}, 'Add')
      )
    );
  }
}


/*
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
*/


