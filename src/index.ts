import {
  ILayoutRestorer, JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';
/*
import {
  JSONObject
} from '@phosphor/coreutils';
*/
import {
  LauncherModel, LauncherWidget
} from '@jupyterlab/launcher';

import {
  each
} from '@phosphor/algorithm';

import {
  TabBar, Widget
} from '@phosphor/widgets';

import {
  URLExt
} from '@jupyterlab/coreutils';

import {
  ServerConnection
} from '@jupyterlab/services';

import '../style/index.css';

function parseStatus(str) {
	var chunks = str.split('\0');
	var ret = [];
	for (var i = 0; i < chunks.length; i++) {
		var chunk = chunks[i];
		if (chunk.length) {
			var x = chunk[0];
			var fileStatus = {
				x: x,
				y: chunk[1],
				to: chunk.substring(3),
				from: null
			};
			if (x === 'R') {
				i++;
				fileStatus.from = chunks[i];
			}
			ret.push(fileStatus);
		}
	}
	return ret;
}
/*
var DESCRIPTIONS = {
	' ': 'unmodified',
	'M': 'modified',
	'A': 'added',
	'D': 'deleted',
	'R': 'renamed',
	'C': 'copied',
	'U': 'umerged',
	'?': 'untracked',
	'!': 'ignored'
};

function describeCode(code) {
	return DESCRIPTIONS[code.toUpperCase()];
}
*/
function POST_Git_Request(git_command){
  let data0 = {"git_command":git_command , "parameters":{"id":"valore"}};
      let request = {
        url: URLExt.join((ServerConnection.makeSettings()).baseUrl, 'hi'),
          method: 'POST',
          cache: true,
          contentType: 'bar',
          headers: {
            foo: 'bar'
          },
          data: JSON.stringify(data0),
          //data: '{"git_command":["git", "status"], "parameters":{"id":"valore"}}'
      };
      ServerConnection.makeRequest(request, ServerConnection.makeSettings()).then(response =>{
        if (response.xhr.status !== 200) {
          throw ServerConnection.makeError(response);
        }
        let data_json = parseStatus(response.data)
        console.log(JSON.stringify(data_json, null, 2)); 
       // console.log(parseStatus(response.data));
      for (var i=0; i<data_json.length; i++){
        console.log("CheckBit 1: "+data_json[i].x);
        console.log("CheckBit 2: "+data_json[i].y);
        console.log("Path To: "+data_json[i].to);
        console.log("Path From: "+data_json[i].from);
      }
        return data_json;
      });
}

/**
 * The default tab manager extension.
 */
const plugin1: JupyterLabPlugin<void> = {
  id: 'jupyter.extensions.tab-manager1',
  activate: (app: JupyterLab, restorer: ILayoutRestorer): void => {
    const { shell } = app;
    const tabs = new TabBar<Widget>({ orientation: 'vertical' });
    const header = document.createElement('header');

    const header1 = document.createElement('header');
    const header2 = document.createElement('header');

    restorer.add(tabs, 'tab-manager');
    tabs.id = 'tab-manager';
    tabs.title.label = 'Git Plugin';
    header.textContent = 'Unstaged Files';
    header1.textContent = 'Add Files';
    header2.textContent = 'Untracked Files';
    

    tabs.node.insertBefore(header, tabs.contentNode);
    tabs.node.insertBefore(header1, null);
    tabs.node.insertBefore(header2, null);
    shell.addToLeftArea(tabs, { rank: 600 });

    app.restored.then(() => {
      const populate = () => {
        tabs.clearTabs();
        POST_Git_Request(    ["git","status","--porcelain", "-z"]   );

        let data0 = {"git_command": ["git","status","--porcelain", "-z"] , "parameters":{"id":"valore"}};
        let request = {
          url: URLExt.join((ServerConnection.makeSettings()).baseUrl, 'hi'),
          method: 'POST',
          cache: true,
          contentType: 'bar',
          headers: {
            foo: 'bar'
          },
          data: JSON.stringify(data0),
          //data: '{"git_command":["git", "status"], "parameters":{"id":"valore"}}'
        };
        ServerConnection.makeRequest(request, ServerConnection.makeSettings()).then(response =>{
          if (response.xhr.status !== 200) {
            throw ServerConnection.makeError(response);
          }
          let data_json = parseStatus(response.data)
          console.log(JSON.stringify(data_json, null, 2)); 
          // console.log(parseStatus(response.data));
          for (var i=0; i<data_json.length; i++){

            let model = new LauncherModel();
            let cwd = String(data_json[i].to) ;
            let id = data_json[i].to;
            let callback = (item: Widget) => {
              shell.addToMainArea(item, { ref: id });
              shell.activateById(item.id);
            };
            let widget = new LauncherWidget({ cwd, callback });
            widget.model = model;
            widget.id = id;
            widget.title.label = data_json[i].to;
            widget.title.closable = true;
            //shell.addToMainArea(widget);
            /*
            if (args['activate'] !== false) {
              shell.activateById(widget.id);
            }
            */
            tabs.addTab(widget.title);
          }
        });
        
        each(shell.widgets('main'), widget => { tabs.addTab(widget.title); });
      };

      // Connect signal handlers.
      shell.layoutModified.connect(() => { populate(); });

      tabs.tabActivateRequested.connect((sender, tab) => {
        shell.activateById(tab.title.owner.id);
      });
      tabs.tabCloseRequested.connect((sender, tab) => {
        tab.title.owner.close();
      });

      // Populate the tab manager.
      populate();
    });
  },
  autoStart: true,
  requires: [ILayoutRestorer]
};


/**
 * Export the plugin as default.
 */
export default plugin1;