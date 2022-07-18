import { Dialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';

/**
 * Interface for returned value from dialog box
 */
export interface ISingleSelectionFormValue {
  selection: string;
}

/**
 * A widget form containing a text block and a list of options,
 * can be used as a Dialog body.
 */
export class SingleSelectionForm
  extends Widget
  implements Dialog.IBodyWidget<ISingleSelectionFormValue>
{
  constructor(textBody: string, options: string[]) {
    super();
    this._radioButtons = [];
    this.node.appendChild(this.createBody(textBody, options));
  }

  private createBody(textBody: string, options: string[]): HTMLElement {
    const mainNode = document.createElement('div');

    const text = document.createElement('div');
    text.textContent = textBody;

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'jp-options-wrapper';

    options.forEach(option => {
      const buttonWrapper = document.createElement('div');
      buttonWrapper.className = 'jp-button-wrapper';
      const radioButton = document.createElement('input');
      radioButton.type = 'radio';
      radioButton.id = option;
      radioButton.value = option;
      radioButton.name = 'option';
      radioButton.className = 'jp-option';
      if (option === 'origin') {
        radioButton.checked = true;
      }
      this._radioButtons.push(radioButton);

      const label = document.createElement('label');
      label.htmlFor = option;
      label.textContent = option;

      buttonWrapper.appendChild(radioButton);
      buttonWrapper.appendChild(label);
      optionsContainer.appendChild(buttonWrapper);
    });

    mainNode.appendChild(text);
    mainNode.appendChild(optionsContainer);

    return mainNode;
  }

  getValue(): ISingleSelectionFormValue {
    return {
      selection: this._radioButtons.find(rb => rb.checked).value
    };
  }

  private _radioButtons: HTMLInputElement[];
}
