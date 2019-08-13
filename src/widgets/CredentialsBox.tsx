import { Dialog } from '@jupyterlab/apputils';
import { Widget } from '@phosphor/widgets';
import { IGitAuth } from '../git';

/**
 * The UI for the credentials form
 */
export class GitCredentialsForm extends Widget
  implements Dialog.IBodyWidget<IGitAuth> {
  constructor(
    textContent: string = 'Enter credentials for remote repository',
    warningContent: string = ''
  ) {
    super();
    this.node.appendChild(this.createBody(textContent, warningContent));
  }

  private createBody(textContent: string, warningContent: string): HTMLElement {
    const node = document.createElement('div');
    const label = document.createElement('label');
    this._user = document.createElement('input');
    this._password = document.createElement('input');
    this._password.type = 'password';

    const text = document.createElement('span');
    const warning = document.createElement('div');

    node.className = 'jp-RedirectForm';
    warning.className = 'jp-RedirectForm-warning';
    text.textContent = textContent;
    warning.textContent = warningContent;
    this._user.placeholder = 'username';
    this._password.placeholder = 'password';

    label.appendChild(text);
    label.appendChild(this._user);
    label.appendChild(this._password);
    node.appendChild(label);
    node.appendChild(warning);
    return node;
  }

  /**
   * Returns the input value.
   */
  getValue(): IGitAuth {
    let credentials = {
      username: this._user.value,
      password: this._password.value
    };
    return credentials;
  }

  private _user: HTMLInputElement;
  private _password: HTMLInputElement;
}
