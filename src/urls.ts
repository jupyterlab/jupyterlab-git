

import {
  IFrame,InstanceTracker
} from '@jupyterlab/apputils';


  

  import {
	Message
  } from '@phosphor/messaging';
    
  import {
		PanelLayout, Widget
  } from '@phosphor/widgets';
  
  import '../style/index.css';

  //const LAB_IS_SECURE = window.location.protocol === 'https:';
  //const HELP_CLASS = 'jp-Help';
  

  export class GitWidget extends Widget {
	/**
	 * Construct a new help widget.
	 */
	constructor(url: string) {
	  super();
	  let layout = this.layout = new PanelLayout();
	  let iframe = new IFrame();
	  this.url = iframe.url = url;
	  layout.addWidget(iframe);
	}
  
	/**
	 * The url of the widget.
	 */
	readonly url: string;
  
	/**
	 * Handle activate requests for the widget.
	 */
	protected onActivateRequest(msg: Message): void {
	  this.node.tabIndex = -1;
	  this.node.focus();
	}
  
	/**
	 * Dispose of the IFrame when closing.
	 */
	protected onCloseRequest(msg: Message): void {
	  this.dispose();
	}
  }
 

	
  

	const namespace = 'one';
	const HELP_CLASS = 'jp-Help';

  const tracker = new InstanceTracker<GitWidget>({ namespace });
  // Handle state restoration.

   export function newClosableIFrame(url: string, text: string): GitWidget {
    let iframe = new GitWidget(url);
    iframe.addClass(HELP_CLASS);
    iframe.title.label = text;
    iframe.title.closable = true;
    iframe.id = `${namespace}`;
    tracker.add(iframe);
    return iframe;
	}

