import { Dialog, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { GitExtension } from './model';
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
    if (x !== ' ' && y !== 'D') {
      return 'staged';
    }
    // If file is unstaged but tracked
    if (y !== ' ') {
      return 'unstaged';
    }
  }

  return null;
}

/** Open a file in the git listing */
export async function openListedFile(
  file: Git.IStatusFileResult,
  model: GitExtension
) {
  const { x, y, to } = file;
  if (x === 'D' || y === 'D') {
    await showDialog({
      title: 'Open File Failed',
      body: 'This file has been deleted!',
      buttons: [Dialog.warnButton({ label: 'OK' })]
    });
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
