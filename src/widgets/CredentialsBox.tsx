import { Dialog } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';
import { Git } from '../tokens';

/**
 * The UI for the credentials form
 */
export class GitCredentialsForm
  extends Widget
  implements Dialog.IBodyWidget<Git.IAuth>
{
  constructor(
    trans: TranslationBundle,
    textContent = trans.__('Enter credentials for remote repository'),
    warningContent = ''
  ) {
    super();
    this._trans = trans;
    this.node.appendChild(this.createBody(textContent, warningContent));
  }

  private createBody(textContent: string, warningContent: string): HTMLElement {
    const node = document.createElement('div');
    const label = document.createElement('label');

    const checkboxLabel = document.createElement('label');
    this._checkboxCacheCredentials = document.createElement('input');
    const checkboxText = document.createElement('span');

    this._user = document.createElement('input');
    this._user.type = 'text';
    this._password = document.createElement('input');
    this._password.type = 'password';

    const text = document.createElement('span');
    const warning = document.createElement('div');

    node.className = 'jp-CredentialsBox';
    warning.className = 'jp-CredentialsBox-warning';
    text.textContent = textContent;
    warning.textContent = warningContent;
    this._user.placeholder = this._trans.__('username');
    this._password.placeholder = this._trans.__(
      'password / personal access token'
    );

    checkboxLabel.className = 'jp-CredentialsBox-label-checkbox';
    this._checkboxCacheCredentials.type = 'checkbox';
    checkboxText.textContent = this._trans.__('Save my login temporarily');

    label.appendChild(text);
    label.appendChild(this._user);
    label.appendChild(this._password);
    node.appendChild(label);
    node.appendChild(warning);

    checkboxLabel.appendChild(this._checkboxCacheCredentials);
    checkboxLabel.appendChild(checkboxText);
    node.appendChild(checkboxLabel);

    return node;
  }

  /**
   * Returns the input value.
   */
  getValue(): Git.IAuth {
    return {
      username: this._user.value,
      password: this._password.value,
      cache_credentials: this._checkboxCacheCredentials.checked
    };
  }
  protected _trans: TranslationBundle;
  private _user: HTMLInputElement;
  private _password: HTMLInputElement;
  private _checkboxCacheCredentials: HTMLInputElement;
}
