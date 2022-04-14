import { Dialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { Git } from '../tokens';

/**
 * A widget form containing a text block and a checkbox,
 * can be used as a Dialog body.
 */
export class CheckboxForm
  extends Widget
  implements Dialog.IBodyWidget<Git.ICheckboxFormValue>
{
  constructor(textBody: string, checkboxLabel: string) {
    super();
    this.node.appendChild(this.createBody(textBody, checkboxLabel));
  }

  private createBody(textBody: string, checkboxLabel: string): HTMLElement {
    const mainNode = document.createElement('div');

    const text = document.createElement('div');
    text.textContent = textBody;

    const checkboxContainer = document.createElement('label');

    this._checkbox = document.createElement('input');
    this._checkbox.type = 'checkbox';
    this._checkbox.checked = true;

    const label = document.createElement('span');
    label.textContent = checkboxLabel;

    checkboxContainer.appendChild(this._checkbox);
    checkboxContainer.appendChild(label);

    mainNode.appendChild(text);
    mainNode.appendChild(checkboxContainer);

    return mainNode;
  }

  getValue(): Git.ICheckboxFormValue {
    return {
      checked: this._checkbox.checked
    };
  }

  private _checkbox: HTMLInputElement;
}
