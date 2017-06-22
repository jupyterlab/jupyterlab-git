/*
this is a test JupyterLab-extension-program for Jupyterlab-Git
based on chatbox-extension code, we are trying to create events in typescript file and eventually
can communicate with the tornado server through HTTP requests. 
*/

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


/**
 * The command IDs used by the VCbox(Version Control box) plugin.
 */
namespace CommandIDs {
  export
  const clear = 'VCbox:clear';

  export
  const run = 'VCbox:post';

  export
  const linebreak = 'VCbox:linebreak';
};

/**
 * The VCbox widget content factory.
 */
export
const VCboxPlugin: JupyterLabPlugin<void> = {
  id: 'jupyter.extensions.VCbox',
  requires: [IRenderMime, ICommandPalette, IEditorServices, IDocumentManager, ILayoutRestorer],
  autoStart: true,
  activate: activateVCbox
}


/**
 * Export the plugin as the default.
 */
export default VCboxPlugin;


/**
 * Activate the VCbox extension.
 */
function activateVCbox(app: JupyterLab, rendermime: IRenderMime, palette: ICommandPalette, editorServices: IEditorServices, docManager: IDocumentManager, restorer: ILayoutRestorer): void {
  const id = 'VCbox';
  let { commands, shell } = app;
  let category = 'VCbox';
  let command: string;

  /**
   * Create a VCbox for a given path.
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
  // Add the VCbox panel to the tracker.
  panel.title.label = 'VC';
  panel.id = id;

  restorer.add(panel, 'VCbox');

  command = CommandIDs.clear;
  commands.addCommand(command, {
    label: 'Clear VC',
    execute: args => {
      console.log('Just hit Clear VC button');
    }
  });
  palette.addItem({ command, category });

  command = CommandIDs.run;
  commands.addCommand(command, {
    label: 'Post VC Entry',
    execute: args => {
      console.log('Just hit VC Entry button');
    }
  });
  palette.addItem({ command, category });

  command = CommandIDs.linebreak;
  commands.addCommand(command, {
    label: 'Insert Line Break',
    execute: args => {
      console.log('Just hit Insert Line Button button');
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
