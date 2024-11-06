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
  getValue(): { url: string; versioning: boolean; submodules: boolean } {
    return {
      url: encodeURIComponent(
        (
          this.node.querySelector('#input-link') as HTMLInputElement
        ).value.trim()
      ),
      versioning: Boolean(
        encodeURIComponent(
          (this.node.querySelector('#download') as HTMLInputElement).checked
        )
      ),
      submodules: Boolean(
        encodeURIComponent(
          (this.node.querySelector('#submodules') as HTMLInputElement).checked
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
    const submodulesLabel = document.createElement('label');
    const submodules = document.createElement('input');
    const downloadLabel = document.createElement('label');
    const download = document.createElement('input');

    node.className = 'jp-CredentialsBox';
    inputWrapper.className = 'jp-RedirectForm';
    checkboxWrapper.className = 'jp-CredentialsBox-wrapper';
    submodulesLabel.className = 'jp-CredentialsBox-label-checkbox';
    downloadLabel.className = 'jp-CredentialsBox-label-checkbox';
    submodules.id = 'submodules';
    download.id = 'download';
    inputLink.id = 'input-link';

    linkText.textContent = trans.__(
      'Enter the URI of the remote Git repository'
    );
    inputLink.placeholder = 'https://host.com/org/repo.git';

    submodulesLabel.textContent = trans.__('Include submodules');
    submodulesLabel.title = trans.__(
      'If checked, the remote submodules in the repository will be cloned recursively'
    );
    submodules.setAttribute('type', 'checkbox');
    submodules.setAttribute('checked', 'checked');

    downloadLabel.textContent = trans.__('Download the repository');
    downloadLabel.title = trans.__(
      'If checked, the remote repository default branch will be downloaded instead of cloned'
    );
    download.setAttribute('type', 'checkbox');

    inputLinkLabel.appendChild(linkText);
    inputLinkLabel.appendChild(inputLink);

    inputWrapper.append(inputLinkLabel);

    submodulesLabel.prepend(submodules);
    checkboxWrapper.appendChild(submodulesLabel);

    downloadLabel.prepend(download);
    checkboxWrapper.appendChild(downloadLabel);

    node.appendChild(inputWrapper);
    node.appendChild(checkboxWrapper);

    return node;
  }
}
