import * as React from 'react';

import * as ReactDOM from 'react-dom';

import { ServiceManager } from '@jupyterlab/services';

import { Message } from '@phosphor/messaging';

import { Widget } from '@phosphor/widgets';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { ISignal, Signal } from '@phosphor/signaling';

import { GitPanel } from './GitPanel';

import { gitWidgetStyle } from '../componentsStyle/GitWidgetStyle';

import { IDiffCallback } from '../git';

import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
/**
 * An options object for creating a running sessions widget.
 */
export interface IOptions {
  /**
   * A service manager instance.
   */
  manager: ServiceManager.IManager;

  /**
   * The renderer for the running sessions widget.
   * The default is a shared renderer instance.
   */
  renderer?: IRenderer;
}

/**
 * A renderer for use with a running sessions widget.
 */
export interface IRenderer {
  createNode(): HTMLElement;
}

/**
 * The default implementation of `IRenderer`.
 */
export class Renderer implements IRenderer {
  createNode(): HTMLElement {
    let node = document.createElement('div');
    node.id = 'GitSession-root';

    return node;
  }
}

/**
 * The default `Renderer` instance.
 */
export const defaultRenderer = new Renderer();

/**
 * A class that exposes the git-plugin sessions.
 */
export class GitWidget extends Widget {
  component: any;
  /**
   * Construct a new running widget.
   */
  constructor(
    app: JupyterFrontEnd,
    options: IOptions,
    diffFunction: IDiffCallback,
    renderMime: IRenderMimeRegistry
  ) {
    super({
      node: (options.renderer || defaultRenderer).createNode()
    });
    this.addClass(gitWidgetStyle);
    const element = (
      <GitPanel app={app} diff={diffFunction} renderMime={renderMime} />
    );
    this.component = ReactDOM.render(element, this.node);
    this.component.refresh();
  }

  /**
   * Override widget's default show() to
   * refresh content every time Git widget is shown.
   */
  show(): void {
    super.show();
    this.component.refresh();
  }

  /**
   * The renderer used by the running sessions widget.
   */
  get renderer(): IRenderer {
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
        break;
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
  private _evtChange(event: MouseEvent): void {}
  /**
   * Handle the `'click'` event for the widget.
   *
   * #### Notes
   * This listener is attached to the document node.
   */
  private _evtClick(event: MouseEvent): void {}

  /**
   * Handle the `'dblclick'` event for the widget.
   */
  private _evtDblClick(event: MouseEvent): void {}

  private _renderer: IRenderer = null;
  private _refreshId = -1;
  private _refreshed = new Signal<this, void>(this);
}
