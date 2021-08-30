import { showDialog, Dialog, showErrorMessage } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import { IGitExtension } from '../tokens';

/**
 * Discard changes in all unstaged and staged files
 */
export async function discardAllChanges(
  model: IGitExtension,
  trans: TranslationBundle
): Promise<void> {
  const result = await showDialog({
    title: trans.__('Discard all changes'),
    body: trans.__(
      'Are you sure you want to permanently discard changes to all files? This action cannot be undone.'
    ),
    buttons: [
      Dialog.cancelButton({ label: trans.__('Cancel') }),
      Dialog.warnButton({ label: trans.__('Discard') })
    ]
  });

  if (result.button.accept) {
    try {
      return model.resetToCommit('HEAD');
    } catch (reason) {
      showErrorMessage(trans.__('Discard all changes failed.'), reason);
      return Promise.reject(reason);
    }
  }

  return Promise.reject('The user refused to discard all changes');
}
