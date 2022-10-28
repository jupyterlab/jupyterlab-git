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
  getValue(): { url: string; versioning: boolean } {
    return {
      url: encodeURIComponent(
        (
          this.node.querySelector('#input-link') as HTMLInputElement
        ).value.trim()
      ),
      versioning: Boolean(
        encodeURIComponent(
          (this.node.querySelector('#checkbox') as HTMLInputElement).checked
        )
      )
    };
  }

  private static createFormNode(trans: TranslationBundle): HTMLElement {
    const node = document.createElement('div');
    const inputWrapper = document.createElement('div');
    const inputLinkLabel = document.createElement('label');
    const inputLink = document.createElement('input');
    const linkText = document.createElement('span');
    const checkboxWrapper = document.createElement('div');
    const checkboxLabel = document.createElement('label');
    const checkbox = document.createElement('input');

    node.className = 'jp-CredentialsBox';
    inputWrapper.className = 'jp-RedirectForm';
    checkboxWrapper.className = 'jp-CredentialsBox-wrapper';
    checkboxLabel.className = 'jp-CredentialsBox-label-checkbox';
    checkbox.id = 'checkbox';
    inputLink.id = 'input-link';

    linkText.textContent = trans.__(
      'Enter the URI of the remote Git repository'
    );
    inputLink.placeholder = 'https://host.com/org/repo.git';
    checkboxLabel.textContent = trans.__('Download the repository');
    checkboxLabel.title = trans.__(
      'If checked, the remote repository default branch will be downloaded instead of cloned'
    );
    checkbox.setAttribute('type', 'checkbox');

    inputLinkLabel.appendChild(linkText);
    inputLinkLabel.appendChild(inputLink);

    inputWrapper.append(inputLinkLabel);

    checkboxLabel.prepend(checkbox);
    checkboxWrapper.appendChild(checkboxLabel);

    node.appendChild(inputWrapper);
    node.appendChild(checkboxWrapper);

    return node;
  }
}
