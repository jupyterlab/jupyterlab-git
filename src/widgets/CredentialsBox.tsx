import { Dialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { Git } from '../tokens';

/**
 * The UI for the credentials form
 */
export class GitCredentialsForm extends Widget
  implements Dialog.IBodyWidget<Git.IAuth> {
  constructor(
    textContent = 'Enter credentials for remote repository',
    warningContent = ''
  ) {
    super();
    this.node.appendChild(this.createBody(textContent, warningContent));
  }

  private createBody(textContent: string, warningContent: string): HTMLElement {
    const node = document.createElement('div');
    const label = document.createElement('label');
    this._user = document.createElement('input');
    this._password_secret = document.createElement('input');

    const text = document.createElement('span');
    const warning = document.createElement('div');

    node.className = 'jp-RedirectForm';
    warning.className = 'jp-RedirectForm-warning';
    text.textContent = textContent;
    warning.textContent = warningContent;
    this._user.placeholder = 'username';
    this._password_secret.placeholder = 'password secret';

    label.appendChild(text);
    label.appendChild(this._user);
    label.appendChild(this._password_secret);
    node.appendChild(label);
    node.appendChild(warning);
    return node;
  }

  /**
   * Returns the input value.
   */
  getValue(): Git.IAuth {
    return {
      username: this._user.value,
      password_secret: this._password_secret.value
    };
  }

  private _user: HTMLInputElement;
  private _password_secret: HTMLInputElement;
}
