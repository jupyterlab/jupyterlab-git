import { Dialog } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';
import { Git } from '../tokens';
import { GitExtension } from '../model';

/**
 * The UI for the add remote repository form
 */
export class GitAddRemoteForm
  extends Widget
  implements Dialog.IBodyWidget<Git.IGitRemote>
{
  constructor(
    trans: TranslationBundle,
    textContent = trans.__('Enter remote repository name and url'),
    warningContent = '',
    model: GitExtension
  ) {
    super();
    this._trans = trans;
    this._model = model;
    this.node.appendChild(this.createBody(textContent, warningContent));
  }

  private createBody(textContent: string, warningContent: string): HTMLElement {
    console.log(this._model);
    const node = document.createElement('div');
    node.className = 'jp-AddRemoteBox';

    const label = document.createElement('label');

    const text = document.createElement('span');
    text.textContent = textContent;
    this._name = document.createElement('input');
    this._name.type = 'text';
    this._name.placeholder = this._trans.__('name');
    this._url = document.createElement('input');
    this._url.type = 'text';
    this._url.placeholder = this._trans.__('Remote GIt repository URL');

    label.appendChild(text);
    label.appendChild(this._name);
    label.appendChild(this._url);

    const warning = document.createElement('div');
    warning.className = 'jp-AddRemoteBox-warning';
    warning.textContent = warningContent;

    node.appendChild(label);
    node.appendChild(warning);

    return node;
  }

  /**
   * Returns the input value.
   */
  getValue(): Git.IGitRemote {
    return {
      url: this._url.value,
      name: this._name.value
    };
  }
  protected _trans: TranslationBundle;
  private _model: GitExtension;
  private _url: HTMLInputElement;
  private _name: HTMLInputElement;
}
