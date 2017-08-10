
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


import {
  VDomModel, VDomRenderer
} from '@jupyterlab/apputils';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  Git, GitBranchResult,GitStatusResult,GitShowPrefixResult,GitShowTopLevelResult,GitLogResult,GitErrorInfo,SingleCommitInfo, SingleCommitFilePathInfo, CommitModifiedFile
} from './git'
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
  
  function find_cur_fb_path(): string {
   try{
    let ll = app.shell.widgets('left');
    let fb = ll.next();
    while(fb.id!='filebrowser'){
      fb = ll.next();
    }
    return(fb as any).model.path;
   }catch(err){}
  }

  // Add terminal commands.
  commands.addCommand(CommandIDs.git_terminal, {
    label: 'Open Terminal',
    caption: 'Start a new terminal session to directly use git command',
    execute: args => {
      console.log("git new terminal");
      app.commands.execute('terminal:create-new');
    }
  });

  commands.addCommand(CommandIDs.git_pull, {
    label: 'Pull',
    caption: 'Incorporates changes from a remote repository into the current branch',
    execute: args => {
      let cur_fb_path = find_cur_fb_path();
      console.log("git pull");
      let upstream = prompt("Enter Upstream Branch Name");
      if(upstream==="" || upstream===null)
        alert("Oops.. You can't leave branch name empty");
      else
        {
          let master = prompt("Enter Master Branch Name");
          if(master==="" || master ===null)
            alert("Oops.. You can't leave branch name empty");
          else
            {
              git_temp.pull(upstream,master,cur_fb_path);
        
            }
        }
  }});

  commands.addCommand(CommandIDs.git_push, {
    label: 'Push',
    caption: 'Update remote refs along with associated objects',
    execute: () => {
      let cur_fb_path = find_cur_fb_path();
      console.log("git push");
      let upstream = prompt("Enter Upstream Branch Name");
      if(upstream=="" || upstream===null)
        alert("Oops.. You can't leave branch name empty");
      else
        {
          let master = prompt("Enter Master Branch Name");
          if(master==="" || master===null)
            alert("Oops.. You can't leave branch name empty");
          else
            {
              git_temp.push(upstream,master,cur_fb_path); 
            }
        }
    }
  });

  commands.addCommand(CommandIDs.git_init, {
    label: 'Init',
    caption: " Create an empty Git repository or reinitialize an existing one",
    execute: () => {
      let curr_fb_path = find_cur_fb_path();
      console.log("git init");
      showDialog({
        title: 'Initialize a Repository',
        body: "Do you really want to make this directory a Git Repo?",
        buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Yes'})]
        }).then(result => {
          if (result.button.accept) {
            git_temp.init(curr_fb_path);
          }
        });
    },
  });

}



