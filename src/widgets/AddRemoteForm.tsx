import { Dialog } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';
import { Git } from '../tokens';
import { GitExtension } from '../model';

/**
 * The UI for the add remote repository form
 */
export class AddRemoteForm
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
    this._addRemoteFormContainer = this.createBody(textContent, warningContent);
    this.node.appendChild(this._addRemoteFormContainer);
    this._showRemotes();
  }

  private createBody(textContent: string, warningContent: string): HTMLElement {
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

  private async _showRemotes(): Promise<void> {
    const remotes: Git.IGitRemote[] = await this._model.getRemotes();

    const existingRemotesWrapper = document.createElement('div');
    existingRemotesWrapper.className = 'jp-existing-remotes-wrapper';
    const existingRemotesHeader = document.createElement('div');
    existingRemotesHeader.textContent = 'Existing remotes:';
    existingRemotesWrapper.appendChild(existingRemotesHeader);

    const remoteList = document.createElement('ul');
    remoteList.className = 'jp-remote-list';
    remotes.forEach(remote => {
      const { name, url } = remote;
      const container = document.createElement('li');
      container.innerHTML = `
        <div>${name}</div>
        <div>${url}</div>
      `;
      remoteList.appendChild(container);
    });

    existingRemotesWrapper.appendChild(remoteList);
    this._addRemoteFormContainer.appendChild(existingRemotesWrapper);
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
  private _addRemoteFormContainer: HTMLElement;
  private _model: GitExtension;
  private _url: HTMLInputElement;
  private _name: HTMLInputElement;
}
