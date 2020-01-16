import {
  Dialog,
  ReactWidget,
  showDialog,
  showErrorMessage,
  ToolbarButtonComponent,
  UseSignal
} from '@jupyterlab/apputils';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { FileBrowser } from '@jupyterlab/filebrowser';
import { Widget } from '@phosphor/widgets';
import * as React from 'react';
import { AUTH_ERROR_MESSAGES } from '../git';
import { cloneButtonStyle } from '../style/CloneButton';
import { IGitExtension } from '../tokens';
import { GitCredentialsForm } from './CredentialsBox';

export function addCloneButton(model: IGitExtension, filebrowser: FileBrowser) {
  filebrowser.toolbar.addItem(
    'gitClone',
    ReactWidget.create(
      <UseSignal
        signal={filebrowser.model.pathChanged}
        initialArgs={{
          name: 'path',
          oldValue: '/',
          newValue: filebrowser.model.path
        }}
      >
        {(_, change: IChangedArgs<string>) => (
          <GitCloneButton
            model={model}
            filebrowser={filebrowser}
            change={change}
          />
        )}
      </UseSignal>
    )
  );
}

/**
 * Makes the API call to the server.
 *
 * @param cloneUrl
 */
async function makeApiCall(
  model: IGitExtension,
  path: string,
  cloneUrl: string
) {
  try {
    let response = await model.clone(path, cloneUrl);

    let retry = false;
    while (response.code !== 0) {
      if (
        response.code === 128 &&
        AUTH_ERROR_MESSAGES.map(
          message => response.message.indexOf(message) > -1
        ).indexOf(true) > -1
      ) {
        // request user credentials and try to clone again
        const result = await showDialog({
          title: 'Git credentials required',
          body: new GitCredentialsForm(
            'Enter credentials for remote repository',
            retry ? 'Incorrect username or password.' : ''
          )
        });
        retry = true;

        if (result.button.accept) {
          // user accepted attempt to login
          // try to clone again
          response = await model.clone(path, cloneUrl, result.value);
        } else {
          showErrorMessage('Clone failed', response.message, [
            Dialog.warnButton({ label: 'DISMISS' })
          ]);
          break;
        }
      }
    }
  } catch (error) {
    showErrorMessage('Clone failed', error, [
      Dialog.warnButton({ label: 'DISMISS' })
    ]);
  }
}

/**
 * Callback method on Git Clone button in the File Browser toolbar.
 * 1. Invokes a new dialog box with form fields.
 * 2. Invokes the server API with the form input.
 */
async function doGitClone(model: IGitExtension, path: string): Promise<void> {
  const result = await showDialog({
    title: 'Clone a repo',
    body: new GitCloneForm(),
    focusNodeSelector: 'input',
    buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'CLONE' })]
  });

  if (result.button.accept) {
    if (typeof result.value !== 'undefined' && result.value) {
      const cloneUrl: string = result.value;
      await makeApiCall(model, path, cloneUrl);
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

/**
 * Git clone toolbar button properties
 */
interface IGitCloneButtonProps {
  /**
   * Git extension model
   */
  model: IGitExtension;
  /**
   * File browser object
   */
  filebrowser: FileBrowser;
  /**
   * File browser path change
   */
  change: IChangedArgs<string>;
}

const GitCloneButton: React.FunctionComponent<IGitCloneButtonProps> = (
  props: IGitCloneButtonProps
) => {
  const [enable, setEnable] = React.useState(false);

  React.useEffect(() => {
    model
      .showTopLevel(change.newValue)
      .then(answer => {
        setEnable(answer.code !== 0);
      })
      .catch(reason => {
        console.error(
          `Fail to get the top level path for ${change.newValue}.\n${reason}`
        );
      });
  });

  const { model, filebrowser, change } = props;

  return (
    <ToolbarButtonComponent
      enabled={enable}
      iconClassName={`${cloneButtonStyle} jp-Icon jp-Icon-16`}
      onClick={async () => {
        await doGitClone(model, filebrowser.model.path);
        filebrowser.model.refresh();
      }}
      tooltip={'Git Clone'}
    />
  );
};
