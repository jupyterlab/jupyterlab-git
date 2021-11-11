import { showDialog, Dialog, showErrorMessage } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import { IGitExtension } from '../tokens';

/**
 * Discard changes in all unstaged and staged files
 *
 * @param isFallback If dialog is called when the classical pull operation fails
 */
export async function discardAllChanges(
  model: IGitExtension,
  trans: TranslationBundle,
  isFallback?: boolean
): Promise<void> {
  const result = await showDialog({
    title: trans.__('Discard all changes'),
    body: isFallback
      ? trans.__(
          'Your current changes forbid pulling the latest changes. Do you want to permanently discard those changes? This action cannot be undone.'
        )
      : trans.__(
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

  return Promise.reject({
    cancelled: true,
    message: 'The user refused to discard all changes'
  });
}
