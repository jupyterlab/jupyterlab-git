import {
    Dialog, showDialog, ToolbarButton
} from "@jupyterlab/apputils";

import {
    Widget
} from "@phosphor/widgets";

import {
    FileBrowser,
    IFileBrowserFactory
} from '@jupyterlab/filebrowser'

import {
    style
} from 'typestyle';

import {
    Git
} from './git';

/**
 * The widget encapsulating the Git Clone UI:
 * 1. Includes the Git Clone button in the File Browser toolbar.
 * 2. Includes the modal (UI + callbacks) which invoked to enable Git Clone functionality.
 */
export class GitClone extends Widget {
    file_browser: FileBrowser;

    /**
     * Creates the Widget instance by attaching the clone button to the File Browser toolbar and Git Clone modal.
     * @param factory
     */
    constructor(factory: IFileBrowserFactory) {
        super();
        this.id = 'git-clone-button'
        this.file_browser = factory.defaultBrowser;

        const gitClone = new ToolbarButton({
            iconClassName: `${this.gitTabStyle} jp-Icon jp-Icon-16`,
            onClick: () => {
                this.doGitClone();
            },
            tooltip: 'Git Clone'
        });
        this.file_browser.toolbar.addItem('gitClone', gitClone);
    }

    /**
     * Makes the API call to the server.
     *
     * @param cloneUrl
     */
    private makeApiCall(cloneUrl: string) {
        new Git().clone(this.file_browser.model.path, cloneUrl)
            .then(response => {
                // TODO: Implement error handling with error message when the backend API is fleshed out.
            })
            .catch(() => this.showErrorDialog())
    }

    /**
     * Displays the error dialog when the Git Clone operation fails.
     * @param body the message to be shown in the body of the modal.
     */
    private showErrorDialog(body: string = '') {
        return showDialog({
            title: 'Clone failed',
            body: body,
            buttons: [Dialog.warnButton({label: 'DISMISS'})]
        }).then(() => {
            // NO-OP
        });
    }

    /**
     * Creates the CSS style for the Git Clone button image.
     */
    private gitTabStyle = style({
        backgroundImage: 'var(--jp-icon-git-clone)'
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
            buttons: [
                Dialog.cancelButton(),
                Dialog.okButton({label: 'CLONE'})
            ]
        });

        const result = await dialog.launch();
        dialog.dispose();

        if (typeof result.value != 'undefined' && result.value) {
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
        super({node: GitCloneForm.createFormNode()});
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
        input.placeholder = 'https://github.com/jupyterlab/jupyterlab-git.git';

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
