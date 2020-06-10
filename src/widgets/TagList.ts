import { Spinner } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import {

} from '../git';
import { Git, IGitExtension } from '../tokens';
/**
 * The UI for the content shown within the Git push/pull modal.
 */
export class GitTagDialog extends Widget {
  private _spinner: Spinner;
  private _model: IGitExtension;
  private _body: HTMLElement;

  /**
   * Instantiates the dialog and makes the relevant service API call.
   */
  constructor(model: IGitExtension, repo: string, tag?: string) {
    super();
    this._model = model;

    this._body = this.createBody();
    this.node.appendChild(this._body);

    this._spinner = new Spinner();
    this.node.appendChild(this._spinner.node);

    this.executeGitApi(repo, tag);
  }

  /**
   * Executes the relevant service API depending on the _operation and handles response and errors.
   * @param currentFileBrowserPath the path to the current repo
   */
  private executeGitApi(repo: string, tag?: string) {
    if (tag) {
      this._model
        .tag_checkout(repo, tag)
        .then(response => {
          this.handleCheckoutResponse(response);
        })
        .catch(() => this.handleError());
    } else {
      this._model
        .tags(repo)
        .then(response => {
          this.handleResponse(response);
        })
        .catch(() => this.handleError());
    }
  }

  /**
   * Handles the response from the server by removing the _spinner and showing the appropriate
   * success or error message.
   * @param response the response from the server API call
   */
  private async handleResponse(response: Git.ITagResult) {
    this.node.removeChild(this._spinner.node);
    this._spinner.dispose();
    if (response.code !== 0) {
      if (
        AUTH_ERROR_MESSAGES.map(
          message => response.message.indexOf(message) > -1
        ).indexOf(true) > -1
      ) {
        this.handleError(response.message);
        this.parent!.parent!.close();
      } else {
        this.handleError(response.message);
      }
    } else {
      this.handleSuccess(response);
    }
  }

  private async handleCheckoutResponse(response: Git.ITagResult) {
    this.node.removeChild(this._spinner.node);
    this._spinner.dispose();
    if (response.code !== 0) {
      if (
        AUTH_ERROR_MESSAGES.map(
          message => response.message.indexOf(message) > -1
        ).indexOf(true) > -1
      ) {
        this.handleError(response.message);
        this.parent!.parent!.close();
      } else {
        this.handleError(response.message);
      }
    } else {
      const label = document.createElement('label');
      const text = document.createElement('span');
      text.textContent = response.message;
      label.appendChild(text);
      this._body.appendChild(label);
    }
    console.log(response);
  }

  private handleError(
    message: string = 'Unexpected failure. Please check your Jupyter server logs for more details.'
  ): void {
    const label = document.createElement('label');
    const text = document.createElement('span');
    text.textContent = `Tag list fetch failed with error:`;
    const errorMessage = document.createElement('span');
    errorMessage.textContent = message;
    errorMessage.setAttribute(
      'style',
      'background-color:var(--jp-rendermime-error-background)'
    );
    label.appendChild(text);
    label.appendChild(document.createElement('p'));
    label.appendChild(errorMessage);
    this._body.appendChild(label);
  }

  private handleSuccess(response: Git.ITagResult): void {
    const label = document.createElement('label');
    const text = document.createElement('span');
    text.textContent = 'Tag versions : ';
    let taglist = response.message;
    let dropdown = document.createElement('select');
    for (let i = 0; i <= taglist.length; i++) {
      if (taglist[i] !== '' && taglist[i] != null) {
        let dropdownvalue = document.createElement('option');
        dropdownvalue.textContent = taglist[i];
        dropdown.options.add(dropdownvalue);
      }
    }
    label.appendChild(text);
    this._body.appendChild(label);
    this._body.appendChild(dropdown);
  }

  private createBody(): HTMLElement {
    const node = document.createElement('div');
    node.className = 'jp-RedirectForm';
    return node;
  }

  /**
   * Returns the input value.
   */
  getValue(): string {
    return encodeURIComponent(this.node.querySelector('select').value);
  }
}
