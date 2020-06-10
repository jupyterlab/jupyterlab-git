import { Spinner } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { AUTH_ERROR_MESSAGES } from '../git';
import { Git, IGitExtension } from '../tokens';
/**
 * The UI for the content shown within the Git push/pull modal.
 */
export class GitTagCheckoutDialog extends Widget {
  private _spinner: Spinner;
  private _model: IGitExtension;
  private _body: HTMLElement;

  /**
   * Instantiates the dialog and makes the relevant service API call.
   */
  constructor(model: IGitExtension, repo: string, tag: string) {
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
  private executeGitApi(repo: string, tag: string) {
    this._model
      .tag_checkout(repo, tag)
      .then(response => {
        this.handleResponse(response);
      })
      .catch(() => this.handleError());
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
    text.textContent = response.message;
    label.appendChild(text);
    this._body.appendChild(label);
  }

  private createBody(): HTMLElement {
    const node = document.createElement('div');
    node.className = 'jp-RedirectForm';
    return node;
  }
}
