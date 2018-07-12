import {
  Dialog, showDialog
} from '@jupyterlab/apputils'

import {
  JupyterLab
} from '@jupyterlab/application'

import {
  ServiceManager
} from '@jupyterlab/services'

import {
  InstanceTracker
} from '@jupyterlab/apputils'

import {
  Terminal
} from '@jupyterlab/terminal'

import {
  Widget
} from '@phosphor/widgets'

import {
  Git
} from './git'

import {
  GitSessions
} from './components/GitSessions'

import '../style/index.css'

/**
 * The command IDs used by the git plugin.
 */
export namespace CommandIDs {
  export const gitUI = 'git:ui'
  export const gitTerminal = 'git:create-new-terminal'
  export const gitTerminalCommand = 'git:terminal-command'
  export const gitPull = 'git:pull'
  export const gitPush = 'git:push'
  export const gitInit = 'git:init'
  export const setupRemotes = 'git:tutorial-remotes'
  export const tutorialPull = 'git:tutorial-pull'
  export const tutorialPush = 'git:tutorial-push'
  export const googleLink = 'git:google-link'
}

/**
 * Add the commands for the git extension.
 */
export function addCommands(app: JupyterLab, services: ServiceManager) {
  let { commands } = app
  const namespace = 'terminal'
  const tracker = new InstanceTracker<Terminal>({ namespace })
  let gitApi = new Git()

  /**
   * Get the current path of the working directory.
   */
  function findCurrentFileBrowserPath(): string {
   try {
    let leftSidebarItems = app.shell.widgets('left')
    let fileBrowser = leftSidebarItems.next()
    while(fileBrowser.id !== 'filebrowser'){
      fileBrowser = leftSidebarItems.next()
    }
    return(fileBrowser as any).model.path
   } catch(err) {}
  }

   /**
    * Check if the current branch is ready to pull from a remote
   */
  function pullReady() {
    let isReady = false
    try {
      let leftSidebarItems = app.shell.widgets('left')
      let gitSessions = leftSidebarItems.next()
      while(gitSessions.id !== 'jp-git-sessions') {
        gitSessions = leftSidebarItems.next()
      }
      isReady = (!(gitSessions.isHidden)) && (gitSessions as GitSessions).component.state.enablePull
    } catch(err) {}
    return isReady
  }

  /**
   * Check if the current branch is ready to push to a remote
   */
  function pushReady() {
    let isReady = false
    try {
      let leftSidebarItems = app.shell.widgets('left')
      let gitSessions = leftSidebarItems.next()
      while(gitSessions.id!='jp-git-sessions') {
        gitSessions = leftSidebarItems.next()
      }
      isReady = (!(gitSessions.isHidden)) && (gitSessions as GitSessions).component.state.enablePush
    } catch(err){}
    return isReady
  }

  /** Add open terminal command */
  commands.addCommand(CommandIDs.gitTerminal, {
    label: 'Open Terminal',
    caption: 'Start a new terminal session to directly use git command',
    execute: args => {
      let currentFileBrowserPath = findCurrentFileBrowserPath()
      let name = args ? args['name'] as string : ''
      let terminal = new Terminal()
      terminal.title.closable = true
      terminal.title.label = '...'
      app.shell.addToMainArea(terminal)
      let promise = name ?
        services.terminals.connectTo(name)
        : services.terminals.startNew()

      return promise.then(session => {
        terminal.session = session
        tracker.add(terminal)
        app.shell.activateById(terminal.id)
        terminal.session.send({
          type: 'stdin',
          content: ['cd ' + currentFileBrowserPath + '\n']
        })
        return terminal
      }).catch(() => { terminal.dispose() })
    }
  })

    /** Add open terminal and run command */
    commands.addCommand(CommandIDs.gitTerminalCommand, {
    label: 'Terminal Command',
    caption: 'Open a new terminal session and perform git command',
    execute: args => {
      let currentFileBrowserPath = findCurrentFileBrowserPath()
      let changeDirectoryCommand = currentFileBrowserPath === ' ' ? '' : ('cd ' + currentFileBrowserPath)
      let gitCommand = args ? (args['cmd'] as string) : ''
      let linkCommand = (changeDirectoryCommand !== '' && gitCommand !== '') ? '&&' : ''
      let terminal = new Terminal()
      terminal.title.closable = true
      terminal.title.label = '...'
      app.shell.addToMainArea(terminal)
      let promise = services.terminals.startNew()

      return promise.then(session => {
        terminal.session = session
        tracker.add(terminal)
        app.shell.activateById(terminal.id)
        terminal.session.send({
          type: 'stdin',
          content: [changeDirectoryCommand + linkCommand + gitCommand + '\n']
        })
        return terminal
      }).catch(() => { terminal.dispose() })
    }
  })

  /** Add open/go to git interface command */
  commands.addCommand(CommandIDs.gitUI, {
    label: 'Git Interface',
    caption: 'Go to Git user interface',
    execute: () => {
      try {
        app.shell.activateById('jp-git-sessions')
       } catch(err){}
    }
  })

  /** Add git pull command */
  commands.addCommand(CommandIDs.gitPull, {
    label: 'Pull',
    caption: 'Update remote refs along with associated objects',
    execute: () => {
      let currentFileBrowserPath = findCurrentFileBrowserPath()
      let inputBlock = document.createElement("div")
      let remoteRepoPrompt = document.createElement("li")
      remoteRepoPrompt.textContent = 'Enter the name of remote repository to Pull from'
      let remoteRepoInput = document.createElement("input")
      let branchPrompt = document.createElement("li")
      branchPrompt.textContent = 'Enter the name of branch to Pull into'
      let branchInput = document.createElement("input")

      inputBlock.appendChild(remoteRepoPrompt)
      inputBlock.appendChild(remoteRepoInput)
      inputBlock.appendChild(branchPrompt)
      inputBlock.appendChild(branchInput)      

      let branchWidget = new Widget({ node: inputBlock })
      showDialog({
        title: " Fetch from and integrate with a repo or branch",
        body: branchWidget,
        buttons: [Dialog.cancelButton(), Dialog.okButton({ label: "OK" })]
      }).then(result => {
          let remoteRepoMessage = remoteRepoInput.value
          let localBranchMessage = branchInput.value
          if (result.button.accept){ 
            if(remoteRepoMessage && remoteRepoMessage !== null && localBranchMessage && localBranchMessage !== null) {
              gitApi.pull(remoteRepoMessage, localBranchMessage, currentFileBrowserPath).then(response => {
                if(response.code !== 0) {
                  showDialog({
                    title: "Warning",
                    body: response.message,
                    buttons: [Dialog.warnButton({ label: "OK"})]
                  })
                } else {
                  showDialog({
                    title: "Git Pull success!",
                    buttons: [Dialog.okButton({ label: "OK"})]
                  })
                }
              }) 
            } else {
              showDialog({
                title: "Repo and branch name cannot be empty",
                buttons: [Dialog.okButton({ label: "OK"})]
              })
            }
          }
      })
    },
    isEnabled: pullReady
  })

  /** Add git push command */
  commands.addCommand(CommandIDs.gitPush, {
    label: 'Push',
    caption: 'Update remote refs along with associated objects',
    execute: () => {
      let currentFileBrowserPath = findCurrentFileBrowserPath()
      let inputBlock = document.createElement("div")
      let remoteRepoPrompt = document.createElement("li")
      remoteRepoPrompt.textContent = 'Enter the name of remote repository to Push into'
      let remoteRepoInput = document.createElement("input")
      let branchPrompt = document.createElement("li")
      branchPrompt.textContent = 'Enter the name of branch to Push from'
      let branchInput = document.createElement("input")

      inputBlock.appendChild(remoteRepoPrompt)
      inputBlock.appendChild(remoteRepoInput)
      inputBlock.appendChild(branchPrompt)
      inputBlock.appendChild(branchInput)      

      let branchWidget = new Widget({node:inputBlock})
      showDialog(
        {
          title: "Update remote refs along with associated objects",
          body: branchWidget,
          buttons: [Dialog.cancelButton(), Dialog.okButton({ label: "OK"})]
        }
      ).then(result => {
          let remoteRepoMessage = remoteRepoInput.value
          let localBranchMessage = branchInput.value
          if (result.button.accept){ 
            if(remoteRepoMessage && remoteRepoMessage !== null && localBranchMessage && localBranchMessage !== null) {
              gitApi.push(remoteRepoMessage, localBranchMessage, currentFileBrowserPath).then(response => {
                if(response.code !== 0){
                  showDialog({
                    title: "Warning",
                    body: response.message,
                    buttons: [Dialog.warnButton({ label: "OK" })]
                  })
                } else {
                  showDialog({
                    title: "Git Push success!",
                    buttons: [Dialog.okButton({ label: "OK" })]
                  })
                }
              }) 
            } else{
              showDialog({
                title: "Repo and branch name cannot be empty",
                buttons: [Dialog.okButton({ label: "OK" })]
              })
            }
          }
      })
    },
    isEnabled: pushReady
  })

  /** Add git init command */
  commands.addCommand(CommandIDs.gitInit, {
    label: 'Init',
    caption: " Create an empty Git repository or reinitialize an existing one",
    execute: () => {
      let currentFileBrowserPath = findCurrentFileBrowserPath()
      showDialog({
        title: 'Initialize a Repository',
        body: "Do you really want to make this directory a Git Repo?",
        buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Yes' })]
        }).then(result => {
          if (result.button.accept) {
            gitApi.init(currentFileBrowserPath)
          }
        })
    },
  })

  /** Add remote tutorial command */
  commands.addCommand(CommandIDs.setupRemotes, {
    label: "Set Up Remotes",
    caption: "Learn about Remotes",
    execute: () => {
      window.open("https://www.atlassian.com/git/tutorials/setting-up-a-repository")
    },
  })

  /** Add pull tutorial command */
  commands.addCommand(CommandIDs.tutorialPull, {
    label: 'How to use Pull',
    caption: "What's Pull",
    execute: () => {
      window.open("https://git-scm.com/docs/git-pull")
    },
  })

  /** Add push tutorial command */
  commands.addCommand(CommandIDs.tutorialPush, {
    label: "How to use Push",
    caption: "What's Push",
    execute: () => {
      window.open("https://git-scm.com/docs/git-push")
    },
  })

  /** Add remote tutorial command */
  commands.addCommand(CommandIDs.googleLink, {
    label: 'Something Else',
    caption: "Dummy Link ",
    execute: () => {
      window.open("https://www.google.com")
    },
  })
}