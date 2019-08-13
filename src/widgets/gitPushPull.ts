import { Spinner } from '@jupyterlab/apputils';
import { Widget } from '@phosphor/widgets';
import { Git, IGitPushPullResult, IGitAuth } from '../git';

export enum Operation {
  Pull = 'Pull',
  Push = 'Push'
}

/**
 * The UI for the content shown within the Git push/pull modal.
 */
export class GitPullPushDialog extends Widget {
  spinner: Spinner;
  gitApi: Git;
  body: HTMLElement;
  operation: Operation;

  /**
   * Instantiates the dialog and makes the relevant service API call.
   */
  constructor(
    currentFileBrowserPath: string,
    operation: Operation,
    auth?: IGitAuth
  ) {
    super();
    this.operation = operation;

    this.body = this.createBody();
    this.node.appendChild(this.body);

    this.spinner = new Spinner();
    this.node.appendChild(this.spinner.node);

    this.gitApi = new Git();

    this.executeGitApi(currentFileBrowserPath, auth);
  }

  /**
   * Executes the relevant service API depending on the operation and handles response and errors.
   * @param currentFileBrowserPath the path to the current repo
   */
  private executeGitApi(currentFileBrowserPath: string, auth?: IGitAuth) {
    switch (this.operation) {
      case Operation.Pull:
        this.gitApi
          .pull(currentFileBrowserPath, auth)
          .then(response => {
            this.handleResponse(response);
          })
          .catch(() => this.handleError());
        break;
      case Operation.Push:
        this.gitApi
          .push(currentFileBrowserPath, auth)
          .then(response => {
            this.handleResponse(response);
          })
          .catch(() => this.handleError());
        break;
      default:
        throw new Error(`Invalid operation type: ${this.operation}`);
    }
  }

  /**
   * Handles the response from the server by removing the spinner and showing the appropriate
   * success or error message.
   * @param response the response from the server API call
   */
  private async handleResponse(response: IGitPushPullResult) {
    this.node.removeChild(this.spinner.node);
    this.spinner.dispose();
    if (response.code !== 0) {
      if (
        response.message.indexOf('could not read Username') >= 0 ||
        response.message.indexOf('Invalid username or password') >= 0
      ) {
        this.handleError(response.message);
        this.parent!.parent!.close();
      } else {
        this.handleError(response.message);
      }
    } else {
      this.handleSuccess();
    }
  }

  private handleError(
    message: string = 'Unexpected failure. Please check your Jupyter server logs for more details.'
  ): void {
    const label = document.createElement('label');
    const text = document.createElement('span');
    text.textContent = `Git ${this.operation} failed with error:`;
    const errorMessage = document.createElement('span');
    errorMessage.textContent = message;
    errorMessage.setAttribute(
      'style',
      'background-color:var(--jp-rendermime-error-background)'
    );
    label.appendChild(text);
    label.appendChild(document.createElement('p'));
    label.appendChild(errorMessage);
    this.body.appendChild(label);
  }

  private handleSuccess(): void {
    const label = document.createElement('label');
    const text = document.createElement('span');
    text.textContent = `Git ${this.operation} completed successfully`;
    label.appendChild(text);
    this.body.appendChild(label);
  }
  private createBody(): HTMLElement {
    const node = document.createElement('div');
    node.className = 'jp-RedirectForm';
    return node;
  }
}
