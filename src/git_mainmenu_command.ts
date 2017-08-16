import {
  Dialog, showDialog
} from '@jupyterlab/apputils';

import {
  JupyterLab
} from '@jupyterlab/application';

import {
  ServiceManager
} from '@jupyterlab/services';

import {
  InstanceTracker

} from '@jupyterlab/apputils';

import {
  Terminal
} from '@jupyterlab/terminal';

import {
   Widget
  } from '@phosphor/widgets';

import {
  Git
} from './git'

/*
import {
  newClosableIFrame
}from './urls';
*/
/**
 * The command IDs used by the git plugin.
 */
export namespace CommandIDs {
  export
  const git_terminal = 'git:create-new-terminal';

  export
  const git_terminal_cmd = 'git:terminal-cmd';

  export
  const git_pull = 'git:pull';

  export
  const git_push = 'git:push';

  export
  const git_init = 'git:init';

  export
  const setup_remotes = 'git:tutorial_remotes';

  export
  const tutorial_Pull = 'git:tutorial_Pull';

  export
  const tutorial_Push = 'git:tutorial_Push';
  
  export
  const link4 = 'git:tutorial_link_4';



};

export 
const urrll = 'https://www.google.com';
/**
 * Add the commands for the git-plugin.
 */
export
function addCommands(app: JupyterLab, services: ServiceManager) {
  let { commands } = app;
  const namespace = 'terminal';
  const tracker = new InstanceTracker<Terminal>({ namespace });
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

  function pullReady(){
    return false;
  }

  // Add terminal commands.
  commands.addCommand(CommandIDs.git_terminal, {
    label: 'Open Terminal',
    caption: 'Start a new terminal session to directly use git command',
    execute: args => {
      let cur_fb_path = find_cur_fb_path();
      //console.log("git new terminal");
      //app.commands.execute('terminal:create-new');
      let name = args ? args['name'] as string : '';
      let term = new Terminal();
      term.title.closable = true;
      //term.title.icon = TERMINAL_ICON_CLASS;
      term.title.label = '...';
      app.shell.addToMainArea(term);
      let promise = name ?
        services.terminals.connectTo(name)
        : services.terminals.startNew();

      return promise.then(session => {
        term.session = session;
        tracker.add(term);
        app.shell.activateById(term.id);
        term.session.send({
          type: 'stdin',
          content: ['cd '+cur_fb_path+'\n']
        });
        return term;
      }).catch(() => { term.dispose(); });
    }
  });

    commands.addCommand(CommandIDs.git_terminal_cmd, {
    label: 'Terminal_CMD',
    caption: 'Open a new terminal session and perform git command',
    execute: args => {
      let cur_fb_path = find_cur_fb_path();
      let cd_cmd = cur_fb_path==''?'':('cd '+cur_fb_path);
      let git_cmd = args ? (args['cmd'] as string) : '';
      let link_cmd = (cd_cmd!=''&&git_cmd!='')? '&&' : '';
      let term = new Terminal();
      term.title.closable = true;
      term.title.label = '...';
      app.shell.addToMainArea(term);
      let promise = services.terminals.startNew();

      return promise.then(session => {
        term.session = session;
        tracker.add(term);
        app.shell.activateById(term.id);
        term.session.send({
          type: 'stdin',
          content: [cd_cmd+link_cmd+git_cmd+'\n']
        });
        return term;
      }).catch(() => { term.dispose(); });
    }
  });

  commands.addCommand(CommandIDs.git_pull, {
    label: 'Pull',
    caption: 'Incorporates changes from a remote repository into the current branch',
    execute: args => {
      let cur_fb_path = find_cur_fb_path();
      let br1 = new Widget({node: document.createElement("input")});
      let br2 = new Widget({node: document.createElement("input")});
      showDialog({
       title: "Enter Branch name you would like to Pull from",
       body:br1,
       buttons: [Dialog.cancelButton(), Dialog.okButton({ label: "OK"})]
      }).then(result => {
          let msg1 = (br1.node as HTMLInputElement).value;
          console.log(msg1);
          if (result.button.accept && msg1 && msg1!=null) 
          {
            showDialog({
              title: "Enter Branch name you would like to Pull into",
              body:br2,
              buttons: [Dialog.cancelButton(), Dialog.okButton({ label: "Pull"})]
             }).then(result => {
                 let msg2 = (br2.node as HTMLInputElement).value;
                 console.log(msg2);
                 if (result.button.accept && msg2 && msg2!=null) 
                 {  
                  git_temp.pull(msg1,msg2,cur_fb_path); 
                 }
                 else{
                  showDialog({
                    title: "Oopss you can't leave a branch name empty",
                    buttons: [Dialog.okButton({ label: "OK"})]
                   })
                }
                  
           });
          }
          else{
            showDialog({
              title: "Oopss you can't leave a branch name empty",
              buttons: [Dialog.okButton({ label: "OK"})]
            })
          }
    });
    },
    isEnabled: pullReady
  });


  commands.addCommand(CommandIDs.git_push, {
    label: 'Push',
    caption: 'Update remote refs along with associated objects',
    execute: () => {
      let cur_fb_path = find_cur_fb_path();
      let br1 = new Widget({node: document.createElement("input")});
      let br2 = new Widget({node: document.createElement("input")});
      showDialog({
       title: "Enter Branch name you would like to Push towards",
       body:br1,
       buttons: [Dialog.cancelButton(), Dialog.okButton({ label: "OK"})]
      }).then(result => {
          let msg1 = (br1.node as HTMLInputElement).value;
          console.log(msg1);
          if (result.button.accept && msg1 && msg1!=null) 
          {
            showDialog({
              title: "Enter Branch name you would like to Push from",
              body:br2,
              buttons: [Dialog.cancelButton(), Dialog.okButton({ label: "Push"})]
             }).then(result => {
                 let msg2 = (br2.node as HTMLInputElement).value;
                 console.log(msg2);
                 if (result.button.accept && msg2 && msg2!=null) 
                 {  
                  git_temp.push(msg1,msg2,cur_fb_path); 
                 }
                 else{
                  showDialog({
                    title: "Oopss you can't leave a branch name empty",
                    buttons: [Dialog.okButton({ label: "OK"})]
                   })
                }
                  
           });
          }
          else{
            showDialog({
              title: "Oopss you can't leave a branch name empty",
              buttons: [Dialog.okButton({ label: "OK"})]
            })
          }
    });
    },
  //isEnabled: pushReady();
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
    //isEnabled: initReady();
  });

    commands.addCommand(CommandIDs.setup_remotes, {
    label: "Set Up Remotes",
    caption: "Learn about Remotes",
    execute: () => {
      console.log("Git Tutorial link 1");
      window.open("https://www.atlassian.com/git/tutorials/setting-up-a-repository");
    },
  });

  commands.addCommand(CommandIDs.tutorial_Pull, {
    label: 'How to use Pull',
    caption: "What's Pull",
    execute: () => {
      console.log("Git Tutorial link 2");
      window.open("https://git-scm.com/docs/git-pull");
    },
  });

  commands.addCommand(CommandIDs.tutorial_Push, {
    label: "How to use Push",
    caption: "What's Push",
    execute: () => {
      console.log("Git Tutorial link 3");
      window.open("https://git-scm.com/docs/git-push");
    },
  });

  commands.addCommand(CommandIDs.link4, {
    label: 'Something Else',
    caption: "Dummy Link ",
    execute: () => {
      console.log("Git Tutorial link 4");
      window.open("https://www.google.com");
      //const url = "https://www.google.com";
      //let iframe = newClosableIFrame(url,'link20');
      //app.shell.addToMainArea(iframe);
      //app.shell.activateById(iframe.id);
    },
  });

}


