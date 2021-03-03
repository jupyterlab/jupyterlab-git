import { TranslationBundle } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';

/**
 * The UI for the form fields shown within the Clone modal.
 */
export class GitCloneForm extends Widget {
  /**
   * Create a redirect form.
   * @param translator - The language translator
   */
  constructor(trans: TranslationBundle) {
    super({ node: GitCloneForm.createFormNode(trans) });
  }

  /**
   * Returns the input value.
   */
  getValue(): string {
    return encodeURIComponent(this.node.querySelector('input').value);
  }

  private static createFormNode(trans: TranslationBundle): HTMLElement {
    const node = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');
    const text = document.createElement('span');

    node.className = 'jp-RedirectForm';
    text.textContent = trans.__('Enter the Clone URI of the repository');
    input.placeholder = 'https://host.com/org/repo.git';

    label.appendChild(text);
    label.appendChild(input);
    node.appendChild(label);
    return node;
  }
}
