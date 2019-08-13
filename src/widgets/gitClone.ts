import { Dialog, showDialog, ToolbarButton } from '@jupyterlab/apputils';

import { Widget } from '@phosphor/widgets';

import { FileBrowser, IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { style } from 'typestyle';

import { Git } from '../git';

import { GitCredentialsForm } from './CredentialsBox';

/**
 * The widget encapsulating the Git Clone UI:
 * 1. Includes the Git Clone button in the File Browser toolbar.
 * 2. Includes the modal (UI + callbacks) which invoked to enable Git Clone functionality.
 */
export class GitClone extends Widget {
  fileBrowser: FileBrowser;
  gitApi: Git;
  enabledCloneButton: ToolbarButton;
  disabledCloneButton: ToolbarButton;

  /**
   * Creates the Widget instance by attaching the clone button to the File Browser toolbar and Git Clone modal.
   * @param factory
   */
  constructor(factory: IFileBrowserFactory) {
    super();
    this.id = 'git-clone-button';
    this.fileBrowser = factory.defaultBrowser;
    this.gitApi = new Git();

    // Initialize the clone button in enabled state
    this.enabledCloneButton = new ToolbarButton({
      iconClassName: `${this.gitTabStyleEnabled} jp-Icon jp-Icon-16`,
      onClick: () => {
        this.doGitClone();
      },
      tooltip: 'Git Clone'
    });
    this.disabledCloneButton = new ToolbarButton({
      iconClassName: `${this.gitTabStyleDisabled} jp-Icon jp-Icon-16`,
      tooltip: 'Cloning disabled within a git repository'
    });
    this.fileBrowser.toolbar.addItem('gitClone', this.enabledCloneButton);

    // Attached a listener on the pathChanged event.
    factory.defaultBrowser.model.pathChanged.connect(() =>
      this.disableIfInGitDirectory()
    );
  }

  /**
   * Event listener for the `pathChanged` event in the file browser. Checks if the current file browser path is a
   * Git repo and disables/enables the clone button accordingly.
   */
  disableIfInGitDirectory(): void {
    this.gitApi
      .showTopLevel(this.fileBrowser.model.path)
      .then(response => {
        if (response.code === 0) {
          this.enabledCloneButton.parent = null;
          this.fileBrowser.toolbar.addItem(
            'disabledCloneButton',
            this.disabledCloneButton
          );
        } else {
          this.disabledCloneButton.parent = null;
          this.fileBrowser.toolbar.addItem(
            'enabledCloneButton',
            this.enabledCloneButton
          );
        }
      })
      .catch(() => {
        // NOOP
      });
  }

  /**
   * Makes the API call to the server.
   *
   * @param cloneUrl
   */
  private makeApiCall(cloneUrl: string) {
    this.gitApi
      .clone(this.fileBrowser.model.path, cloneUrl)
      .then(async response => {
        let retry = false;
        while (response.code !== 0) {
          if (
            response.code === 128 &&
            (response.message.indexOf('could not read Username') >= 0 ||
              response.message.indexOf('Invalid username or password') >= 0)
          ) {
            // request user credentials and try to clone again
            const dialog = new Dialog({
              title: 'Git credentials required',
              body: new GitCredentialsForm(
                'Enter credentials for remote repository',
                retry ? 'Incorrect username or password.' : ''
              ),
              buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'OK' })]
            });
            retry = true;

            const result = await dialog.launch();
            dialog.dispose();

            if (result.button.accept) {
              // user accepted attempt to login
              // try to clone again
              response = await this.gitApi.clone(
                this.fileBrowser.model.path,
                cloneUrl,
                result.value
              );
            } else {
              this.showErrorDialog(response.message);
              break;
            }
          }
        }
      })
      .catch(() => this.showErrorDialog());
  }

  /**
   * Displays the error dialog when the Git Clone operation fails.
   * @param body the message to be shown in the body of the modal.
   */
  private showErrorDialog(body: string = '') {
    return showDialog({
      title: 'Clone failed',
      body: body,
      buttons: [Dialog.warnButton({ label: 'DISMISS' })]
    }).then(() => {
      // NO-OP
    });
  }

  /**
   * Creates the CSS style for the Git Clone button image.
   */
  private gitTabStyleEnabled = style({
    backgroundImage: 'var(--jp-icon-git-clone)'
  });

  /**
   * Creates the CSS style for the Git Clone button image.
   */
  private gitTabStyleDisabled = style({
    backgroundImage: 'var(--jp-icon-git-clone-disabled)'
  });

  /**
   * Callback method on Git Clone button in the File Browser toolbar.
   * 1. Invokes a new dialog box with form fields.
   * 2. Invokes the server API with the form input.
   */
  private async doGitClone(): Promise<void> {
    const dialog = new Dialog({
      title: 'Clone a repo',
      body: new GitCloneForm(),
      focusNodeSelector: 'input',
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'CLONE' })]
    });

    const result = await dialog.launch();
    dialog.dispose();

    if (typeof result.value !== 'undefined' && result.value) {
      const cloneUrl: string = result.value;
      this.makeApiCall(cloneUrl);
    } else {
      // NOOP
    }
  }
}

/**
 * The UI for the form fields shown within the Clone modal.
 */
class GitCloneForm extends Widget {
  /**
   * Create a redirect form.
   */
  constructor() {
    super({ node: GitCloneForm.createFormNode() });
  }

  private static createFormNode(): HTMLElement {
    const node = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');
    const text = document.createElement('span');
    const warning = document.createElement('div');

    node.className = 'jp-RedirectForm';
    warning.className = 'jp-RedirectForm-warning';
    text.textContent = 'Enter the Clone URI of the repository';
    input.placeholder = 'https://host.com/org/repo.git';

    label.appendChild(text);
    label.appendChild(input);
    node.appendChild(label);
    node.appendChild(warning);
    return node;
  }

  /**
   * Returns the input value.
   */
  getValue(): string {
    return encodeURIComponent(this.node.querySelector('input').value);
  }
}
