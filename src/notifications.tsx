import { Dialog, Notification, showErrorMessage } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import * as React from 'react';

/**
 * Build notification options to display in a dialog the detailed error.
 *
 * @param error Error object to display
 * @param trans Extension translation object
 * @returns Notification option to display the full error
 */
export function showError(
  error: Error,
  trans: TranslationBundle
): Notification.IOptions<null> {
  return {
    autoClose: false,
    actions: [
      {
        label: trans.__('Show'),
        callback: () => {
          showErrorMessage(
            trans.__('Error'),
            {
              // Render error in a <pre> element to preserve line breaks and
              // use a monospace font so e.g. pre-commit errors are readable.
              // Ref: https://github.com/jupyterlab/jupyterlab-git/issues/1407
              message: (
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '7pt' }}>
                  {error.message || error.stack || String(error)}
                </pre>
              )
            },
            [Dialog.warnButton({ label: trans.__('Dismiss') })]
          );
        },
        displayType: 'warn'
      } as Notification.IAction
    ]
  };
}

/**
 * Display additional information in a dialog from a notification
 * button.
 *
 * Note: it will not add a button if the message is empty.
 *
 * @param message Details to display
 * @param trans Translation object
 * @returns Notification option to display the message
 */
export function showDetails(
  message: string,
  trans: TranslationBundle
): Notification.IOptions<null> {
  return message
    ? {
        autoClose: 5000,
        actions: [
          {
            label: trans.__('Details'),
            callback: () => {
              showErrorMessage(trans.__('Detailed message'), message, [
                Dialog.okButton({ label: trans.__('Dismiss') })
              ]);
            },
            displayType: 'warn'
          } as Notification.IAction
        ]
      }
    : {};
}
