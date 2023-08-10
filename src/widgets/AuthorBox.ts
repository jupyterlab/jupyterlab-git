import { Dialog } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';
import { Git } from '../tokens';

/**
 * The UI for the commit author form
 */
export class GitAuthorForm
  extends Widget
  implements Dialog.IBodyWidget<Git.IIdentity>
{
  constructor({
    author,
    trans
  }: {
    author: Git.IIdentity;
    trans: TranslationBundle;
  }) {
    super();
    this._populateForm(author, trans);
  }

  private _populateForm(
    author: Git.IIdentity,
    trans?: TranslationBundle
  ): void {
    const nameLabel = document.createElement('label');
    nameLabel.textContent = trans.__('Committer name:');
    const emailLabel = document.createElement('label');
    emailLabel.textContent = trans.__('Committer email:');

    this._name = nameLabel.appendChild(document.createElement('input'));
    this._email = emailLabel.appendChild(document.createElement('input'));
    this._name.placeholder = 'Name';
    this._email.type = 'text';
    this._email.placeholder = 'Email';
    this._email.type = 'email';
    this._name.value = author.name;
    this._email.value = author.email;

    this.node.appendChild(nameLabel);
    this.node.appendChild(emailLabel);
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
