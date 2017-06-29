/*
this is a test JupyterLab-extension-program for Jupyterlab-Git
based on chatbox-extension code, we are trying to create events in typescript file and eventually
can communicate with the tornado server through HTTP requests. 
*/
import $ = require('jquery');

import {
  URLExt
} from '@jupyterlab/coreutils';
/*
import {
  JSONObject
} from '@phosphor/coreutils';
*/
import {
  PromiseDelegate
} from '@phosphor/coreutils';

import {
  ServerConnection
} from '@jupyterlab/services';

import {
  ILayoutRestorer, JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette
} from '@jupyterlab/apputils';

import {
  IDocumentManager
} from '@jupyterlab/docmanager';

import {
  IEditorServices
} from '@jupyterlab/codeeditor';

import {
  ChatboxPanel
} from '@jupyterlab/chatbox';

import {
  IRenderMime
} from '@jupyterlab/rendermime';
//const SESSION_SERVICE_URL = 'api/sessions';
/**
 * The command IDs used by the AVCbox(Version Control box) plugin.
 */
namespace CommandIDs {
  export
  const git_st = 'AVCbox:git status';

  export
  const git_log = 'AVCbox:git log';

  export 
  const git_pull = 'AVCbox:git pull';

  export
  const get_git_api = 'AVCbox:git api';
};

/**
 * The AVCbox widget content factory.
 */
export
const AVCboxPlugin: JupyterLabPlugin<void> = {
  id: 'jupyter.extensions.AVCbox',
  requires: [IRenderMime, ICommandPalette, IEditorServices, IDocumentManager, ILayoutRestorer],
  autoStart: true,
  activate: activateAVCbox
}


/**
 * Export the plugin as the default.
 */
export default AVCboxPlugin;

/**
 * a test link function for buttons
 */


let serverSettings = ServerConnection.makeSettings();
let gapiLoaded = new PromiseDelegate<void>();
export
function loadGapi(): Promise<void> {
  return new Promise<void>( (resolve, reject) => {
    // Get the gapi script from Google.
    $.getJSON('https://api.github.com')
    .done((script, textStatus) => {
      console.log("gapi: loaded onto page");
      console.log(JSON.stringify(script, null, 2));
    }).fail( () => {
      console.log("gapi: unable to load onto page");
      gapiLoaded.reject(void 0);
      reject(void 0);
    });
  });
}

function POST_Git_Request(git_command){
      let request = {
        url: URLExt.join(serverSettings.baseUrl, 'hi'),
          method: 'POST',
          cache: true,
          contentType: 'bar',
          headers: {
            foo: 'bar'
          },
          //data: '["foo", {"bar":["git status", null, 1.0, 2]}]',
          data: '{"git_command":"'+git_command+'", "parameters":{"id":"valore"}}'
      };
  
      ServerConnection.makeRequest(request, serverSettings).then(response =>{
        if (response.xhr.status !== 200) {
          throw ServerConnection.makeError(response);
        }
        console.log(JSON.stringify(response.data, null, 2));
      });

}

/**
 * Activate the AVCbox extension.
 */
function activateAVCbox(app: JupyterLab, rendermime: IRenderMime, palette: ICommandPalette, editorServices: IEditorServices, docManager: IDocumentManager, restorer: ILayoutRestorer): void {
  const id = 'AVCbox';
  let { commands, shell } = app;
  let category = 'AVCbox';
  let command: string;

  /**
   * Create a AVCbox for a given path.
   */
  let editorFactory = editorServices.factoryService.newInlineEditor.bind(
    editorServices.factoryService);
  let contentFactory = new ChatboxPanel.ContentFactory({ editorFactory });
  let panel = new ChatboxPanel({
    rendermime: rendermime.clone(),
    contentFactory
  });
  //test msg
  console.log('JupyterLab extension JL_git (typescript extension) is activated!');
  // Add the AVCbox panel to the tracker.
  panel.title.label = 'AVC';
  panel.id = id;

  restorer.add(panel, 'AVCbox');

  //git status button
  command = CommandIDs.git_st;
  commands.addCommand(command, {
    label: 'git status command',
    execute: args => {
      console.log('Try to exec *git status* command');
      POST_Git_Request("status")
    }
  });
  palette.addItem({ command, category });


//git log button
  command = CommandIDs.git_log;
  commands.addCommand(command, {
    label: 'git log command',
    execute: args => {
      console.log('Try to exec *git log* command');
      
     $.getJSON(serverSettings.baseUrl + 'hi', function(data) {
            console.log(data['rss']);
            console.log(data['limits']['memory']);
            //console.log(JSON.stringify(data, null, 2));
      });  
      POST_Git_Request("log")
    }
  });
  palette.addItem({ command, category });

 //git pull button
  command = CommandIDs.git_pull;
  commands.addCommand(command, {
    label: 'git pull command',
    execute: args => {
      console.log('Try to exec *git pull* command');
      POST_Git_Request("pull")
    }
  });
  palette.addItem({ command, category });

//test button
  command = CommandIDs.get_git_api;
  commands.addCommand(command, {
    label: 'Access GitHub JSON',
    execute: args => {
      console.log('Try to receive JSON from api.github.com!!');
      loadGapi();
    }
  });
  palette.addItem({ command, category });



  let updateDocumentContext = function (): void {
    let context = docManager.contextForWidget(shell.currentWidget);
    if (context && context.model.modelDB.isCollaborative) {
      if (!panel.isAttached) {
        shell.addToLeftArea(panel);
      }
      panel.context = context;
    }
  };

  app.restored.then(() => {
    updateDocumentContext();
  });
  shell.currentChanged.connect(updateDocumentContext);
}
