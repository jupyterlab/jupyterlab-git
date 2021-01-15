import { Dialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { Git } from '../tokens';

/**
 * The UI for the commit author form
 */
export class GitAuthorForm
  extends Widget
  implements Dialog.IBodyWidget<Git.IIdentity> {
  constructor() {
    super();
    this.node.appendChild(this.createBody());
  }

  private createBody(): HTMLElement {
    const node = document.createElement('div');
    const text = document.createElement('span');
    this._name = document.createElement('input');
    this._email = document.createElement('input');

    node.className = 'jp-RedirectForm';
    text.textContent = 'Enter your name and email for commit';
    this._name.placeholder = 'Name';
    this._email.placeholder = 'Email';

    node.appendChild(text);
    node.appendChild(this._name);
    node.appendChild(this._email);
    return node;
  }

  /**
   * Returns the input value.
   */
  getValue(): Git.IIdentity {
    const credentials = {
      name: this._name.value,
      email: this._email.value
    };
    return credentials;
  }

  private _name: HTMLInputElement;
  private _email: HTMLInputElement;
}
