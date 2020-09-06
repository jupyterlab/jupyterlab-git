import { Dialog, showDialog, showErrorMessage } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import * as React from 'react';
import { GitExtension } from './model';
import {
  folderFileIconStyle,
  genericFileIconStyle,
  imageFileIconStyle,
  jsonFileIconStyle,
  kernelFileIconStyle,
  markdownFileIconStyle,
  notebookFileIconStyle,
  pythonFileIconStyle,
  spreadsheetFileIconStyle,
  yamlFileIconStyle
} from './style/FileListStyle';
import { Git } from './tokens';

/** Get the filename from a path */
export function extractFilename(path: string): string {
  if (path[path.length - 1] === '/') {
    return path;
  } else {
    return PathExt.basename(path);
  }
}

export function decodeStage(x: string, y: string): Git.Status {
  // If file is untracked
  if (x === '?' && y === '?') {
    return 'untracked';
  } else {
    // If file is staged
    if (x !== ' ') {
      return y !== ' ' ? 'partially-staged' : 'staged';
    }
    // If file is unstaged but tracked
    if (y !== ' ') {
      return 'unstaged';
    }
  }

  return null;
}

export async function discardChanges(
  file: Git.IStatusFile,
  model: GitExtension
) {
  const result = await showDialog({
    title: 'Discard changes',
    body: (
      <span>
        Are you sure you want to permanently discard changes to <b>{file.to}</b>
        ? This action cannot be undone.
      </span>
    ),
    buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard' })]
  });
  if (result.button.accept) {
    try {
      if (file.status === 'staged' || file.status === 'partially-staged') {
        await model.reset(file.to);
      }
      if (
        file.status === 'unstaged' ||
        (file.status === 'partially-staged' && file.x !== 'A')
      ) {
        // resetting an added file moves it to untracked category => checkout will fail
        await model.checkout({ filename: file.to });
      }
    } catch (reason) {
      showErrorMessage(`Discard changes for ${file.to} failed.`, reason, [
        Dialog.warnButton({ label: 'DISMISS' })
      ]);
    }
  }
}

/** Open a file in the git listing */
export async function openListedFile(
  file: Git.IStatusFileResult,
  model: GitExtension
) {
  const { x, y, to } = file;
  if (x === 'D' || y === 'D') {
    await showErrorMessage('Open File Failed', 'This file has been deleted!');
    return;
  }
  try {
    if (to[to.length - 1] !== '/') {
      model.commands.execute('docmanager:open', {
        path: model.getRelativeFilePath(to)
      });
    } else {
      console.log('Cannot open a folder here');
    }
  } catch (err) {
    console.error(`Fail to open ${to}.`);
  }
}

/**
 * Get the extension of a given file
 *
 * @param path File path for which the icon should be found
 */
export function getFileIconClassName(path: string): string {
  if (path[path.length - 1] === '/') {
    return folderFileIconStyle;
  }
  const fileExtension = PathExt.extname(path).toLocaleLowerCase();
  switch (fileExtension) {
    case '.md':
      return markdownFileIconStyle;
    case '.py':
      return pythonFileIconStyle;
    case '.ipynb':
      return notebookFileIconStyle;
    case '.json':
      return jsonFileIconStyle;
    case '.csv':
    case '.xls':
    case '.xlsx':
      return spreadsheetFileIconStyle;
    case '.r':
      return kernelFileIconStyle;
    case '.yml':
    case '.yaml':
      return yamlFileIconStyle;
    case '.svg':
    case '.tiff':
    case '.jpeg':
    case '.jpg':
    case '.gif':
    case '.png':
    case '.raw':
      return imageFileIconStyle;
    default:
      return genericFileIconStyle;
  }
}

/**
 * Returns a promise which resolves after a specified duration.
 *
 * @param ms - duration (in milliseconds)
 * @returns a promise
 */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
