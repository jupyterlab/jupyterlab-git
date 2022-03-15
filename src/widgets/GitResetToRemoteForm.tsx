import { Dialog } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';
import { Git } from '../tokens';

/**
 * The UI used for the Reset to Remote Form,
 * used as the body for Reset to Remote Dialog.
 */
export class GitResetToRemoteForm
  extends Widget
  implements Dialog.IBodyWidget<Git.IGitResetToRemoteFormValue>
{
  constructor(
    trans: TranslationBundle,
    promptContent = trans.__(
      'To bring the current branch to the state of its corresponding remote tracking branch, \
      a hard reset will be performed, which may result in some files being permanently deleted \
      and some changes being permanently discarded. Are you sure you want to proceed? \
      This action cannot be undone.'
    ),
    warningCloseAllOpenedFilesContent = trans.__(
      'Also close all opened files to avoid conflicts'
    )
  ) {
    super();
    this._trans = trans;
    this.node.appendChild(
      this.createBody(promptContent, warningCloseAllOpenedFilesContent)
    );
  }

  private createBody(
    promptContent: string,
    warningCloseAllOpenedFilesContent: string
  ): HTMLElement {
    const mainNode = document.createElement('div');

    const warning = document.createElement('div');
    warning.textContent = promptContent;

    const labelWarnCloseAllOpenedFiles = document.createElement('label');

    this._chkCloseAllOpenedFiles = document.createElement('input');
    this._chkCloseAllOpenedFiles.type = 'checkbox';
    this._chkCloseAllOpenedFiles.checked = true;

    const textWarnCloseAllOpenedFiles = document.createElement('span');
    textWarnCloseAllOpenedFiles.textContent = warningCloseAllOpenedFilesContent;

    labelWarnCloseAllOpenedFiles.appendChild(this._chkCloseAllOpenedFiles);
    labelWarnCloseAllOpenedFiles.appendChild(textWarnCloseAllOpenedFiles);

    mainNode.appendChild(warning);
    mainNode.appendChild(labelWarnCloseAllOpenedFiles);

    return mainNode;
  }

  getValue(): Git.IGitResetToRemoteFormValue {
    return {
      doCloseAllOpenedFiles: this._chkCloseAllOpenedFiles.checked
    };
  }

  protected _trans: TranslationBundle;
  private _chkCloseAllOpenedFiles: HTMLInputElement;
}
