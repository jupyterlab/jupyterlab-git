import { Dialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { GitExtension } from '../model';
import { TranslationBundle } from '@jupyterlab/translation';

/**
 * Interface for returned value from dialog box
 */
export interface IAdvancedPushFormValue {
  /**
   * The name of the remote repository to push to.
   */
  remoteName: string;
  /**
   * Whether to use force push.
   */
  force: boolean;
}

/**
 * A widget form with advanced push options,
 * can be used as a Dialog body.
 */
export class AdvancedPushForm
  extends Widget
  implements Dialog.IBodyWidget<IAdvancedPushFormValue>
{
  constructor(trans: TranslationBundle, model: GitExtension) {
    super();
    this._trans = trans;
    this._model = model;
    this._radioButtons = [];
    this.node.appendChild(this.createBody());
    this.addRemoteOptions();
  }

  private createBody(): HTMLElement {
    const mainNode = document.createElement('div');

    // Instructional text
    const text = document.createElement('div');
    text.className = 'jp-remote-text';
    text.textContent = this._trans.__('Choose a remote to push to.');

    // List of remotes
    const remoteOptionsContainer = document.createElement('div');
    remoteOptionsContainer.className = 'jp-remote-options-wrapper';
    const loadingMessage = document.createElement('div');
    loadingMessage.textContent = this._trans.__(
      'Loading remote repositories...'
    );
    remoteOptionsContainer.appendChild(loadingMessage);
    this._remoteOptionsContainer = remoteOptionsContainer;

    // Force option
    const forceCheckboxContainer = document.createElement('label');
    forceCheckboxContainer.className = 'jp-force-box-container';

    this._forceCheckbox = document.createElement('input');
    this._forceCheckbox.type = 'checkbox';
    this._forceCheckbox.checked = false;

    const label = document.createElement('span');
    label.textContent = this._trans.__('Force Push');

    forceCheckboxContainer.appendChild(this._forceCheckbox);
    forceCheckboxContainer.appendChild(label);

    mainNode.appendChild(text);
    mainNode.appendChild(remoteOptionsContainer);
    mainNode.appendChild(forceCheckboxContainer);

    return mainNode;
  }

  private async addRemoteOptions(): Promise<void> {
    const remotes = await this._model.getRemotes();
    this._remoteOptionsContainer.innerHTML = '';
    if (remotes.length > 0) {
      remotes.forEach(remote => {
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'jp-button-wrapper';
        const radioButton = document.createElement('input');
        radioButton.type = 'radio';
        radioButton.id = remote.name;
        radioButton.value = remote.name;
        radioButton.name = 'option';
        radioButton.className = 'jp-option';
        if (remote.name === 'origin') {
          radioButton.checked = true;
        }
        this._radioButtons.push(radioButton);

        const label = document.createElement('label');
        label.htmlFor = remote.name;
        label.textContent = `${remote.name}: ${remote.url}`;

        buttonWrapper.appendChild(radioButton);
        buttonWrapper.appendChild(label);
        this._remoteOptionsContainer.appendChild(buttonWrapper);
      });
    } else {
      const noRemoteMsg = document.createElement('div');
      noRemoteMsg.textContent = this._trans.__(
        'This repository has no known remotes.'
      );
      this._remoteOptionsContainer.appendChild(noRemoteMsg);
    }
  }

  getValue(): IAdvancedPushFormValue {
    return {
      remoteName: this._radioButtons.find(rb => rb.checked)?.value,
      force: this._forceCheckbox.checked
    };
  }

  private _trans: TranslationBundle;
  private _model: GitExtension;
  private _remoteOptionsContainer: HTMLElement;
  private _radioButtons: HTMLInputElement[];
  private _forceCheckbox: HTMLInputElement;
}
