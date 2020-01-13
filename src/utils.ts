import { Dialog, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { GitExtension } from './model';
import {
  folderFileIconSelectedStyle,
  folderFileIconStyle,
  genericFileIconSelectedStyle,
  genericFileIconStyle,
  imageFileIconSelectedStyle,
  imageFileIconStyle,
  jsonFileIconSelectedStyle,
  jsonFileIconStyle,
  kernelFileIconSelectedStyle,
  kernelFileIconStyle,
  markdownFileIconSelectedStyle,
  markdownFileIconStyle,
  pythonFileIconSelectedStyle,
  pythonFileIconStyle,
  spreadsheetFileIconSelectedStyle,
  spreadsheetFileIconStyle,
  yamlFileIconSelectedStyle,
  yamlFileIconStyle,
  notebookFileIconSelectedStyle,
  notebookFileIconStyle
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

export function decodeStage(x: string, y: string): Git.Status | null {
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
  } catch (err) {}
}

/**
 * Get the extension of a given file
 *
 * @param path File path for which the icon should be found
 * @param selected Is the file selected? Optional: default is false
 */
export function getFileIconClassName(
  path: string,
  selected: boolean = false
): string {
  if (path[path.length - 1] === '/') {
    return selected ? folderFileIconSelectedStyle : folderFileIconStyle;
  }
  let fileExtension = PathExt.extname(path).toLocaleLowerCase();
  switch (fileExtension) {
    case '.md':
      return selected ? markdownFileIconSelectedStyle : markdownFileIconStyle;
    case '.py':
      return selected ? pythonFileIconSelectedStyle : pythonFileIconStyle;
    case '.ipynb':
      return selected ? notebookFileIconSelectedStyle : notebookFileIconStyle;
    case '.json':
      return selected ? jsonFileIconSelectedStyle : jsonFileIconStyle;
    case '.csv':
    case '.xls':
    case '.xlsx':
      return selected
        ? spreadsheetFileIconSelectedStyle
        : spreadsheetFileIconStyle;
    case '.r':
      return selected ? kernelFileIconSelectedStyle : kernelFileIconStyle;
    case '.yml':
    case '.yaml':
      return selected ? yamlFileIconSelectedStyle : yamlFileIconStyle;
    case '.svg':
    case '.tiff':
    case '.jpeg':
    case '.jpg':
    case '.gif':
    case '.png':
    case '.raw':
      return selected ? imageFileIconSelectedStyle : imageFileIconStyle;
    default:
      return selected ? genericFileIconSelectedStyle : genericFileIconStyle;
  }
}
