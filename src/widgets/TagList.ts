import { Spinner } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { Git, IGitExtension } from '../tokens';
/**
 * The UI for the content shown within the Git push/pull modal.
 */
export class GitTagDialog extends Widget {
  /**
   * Instantiates the dialog and makes the relevant service API call.
   */
  constructor(model: IGitExtension) {
    super();
    this._model = model;

    this._body = this._createBody();
    this.node.appendChild(this._body);

    this._spinner = new Spinner();
    this.node.appendChild(this._spinner.node);

    this._executeGitApi();
  }

  /**
   * Call the Git REST API
   */
  private _executeGitApi() {
    this._model
      .tags()
      .then(response => {
        this._handleResponse(response);
      })
      .catch(() => this._handleError());
  }

  /**
   * Handles the response from the server by removing the _spinner and showing the appropriate
   * success or error message.
   *
   * @param response the response from the server API call
   */
  private async _handleResponse(response: Git.ITagResult) {
    this.node.removeChild(this._spinner.node);
    this._spinner.dispose();
    if (response.code === 0) {
      this._handleSuccess(response);
    } else {
      this._handleError(response.message);
    }
  }

  /**
   * Handle failed Git tag REST API call
   *
   * @param message Error message
   */
  private _handleError(
    message = 'Unexpected failure. Please check your Jupyter server logs for more details.'
  ): void {
    const label = document.createElement('label');
    const text = document.createElement('span');
    text.textContent = 'Tag list fetch failed with error:';
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

  /**
   * Handle successful Git tag REST API call
   *
   * @param response Git REST API response
   */
  private _handleSuccess(response: Git.ITagResult): void {
    const label = document.createElement('label');
    const text = document.createElement('span');
    text.textContent = 'Select the tag to checkout : ';
    const tags = response.tags;
    this._list = document.createElement('select');
    tags.forEach(tag => {
      if (tag) {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        this._list.appendChild(option);
      }
    });
    label.appendChild(text);
    this._body.appendChild(label);
    this._body.appendChild(this._list);
  }

  /**
   * Create the dialog body node
   */
  private _createBody(): HTMLElement {
    const node = document.createElement('div');
    node.className = 'jp-RedirectForm';
    return node;
  }

  /**
   * Returns the input value.
   */
  getValue(): string {
    return this._list.value;
  }

  private _body: HTMLElement;
  private _list: HTMLSelectElement;
  private _model: IGitExtension;
  private _spinner: Spinner;
}
