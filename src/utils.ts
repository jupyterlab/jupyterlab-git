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
  yamlFileIconStyle
} from './style/FileListStyle';

/** Get the filename from a path */
export function extractFilename(path: string): string {
  if (path[path.length - 1] === '/') {
    return path;
  } else {
    return PathExt.basename(path);
  }
}

export function decodeStage(x: string, y: string) {
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

  return undefined;
}

/** Open a file in the git listing */
export async function openListedFile(
  typeX: string,
  typeY: string,
  path: string,
  model: GitExtension
) {
  if (typeX === 'D' || typeY === 'D') {
    await showDialog({
      title: 'Open File Failed',
      body: 'This file has been deleted!',
      buttons: [Dialog.warnButton({ label: 'OK' })]
    });
    return;
  }
  try {
    if (path[path.length - 1] !== '/') {
      model.commands.execute('docmanager:open', {
        path: model.getRelativeFilePath(path)
      });
    } else {
      console.log('Cannot open a folder here');
    }
  } catch (err) {}
}

/** Get the extension of a given file */
export function parseFileExtension(path: string): string {
  if (path[path.length - 1] === '/') {
    return folderFileIconStyle;
  }
  let fileExtension = PathExt.extname(path).toLocaleLowerCase();
  switch (fileExtension) {
    case '.md':
      return markdownFileIconStyle;
    case '.py':
      return pythonFileIconStyle;
    case '.json':
      return jsonFileIconStyle;
    case '.csv':
      return spreadsheetFileIconStyle;
    case '.xls':
      return spreadsheetFileIconStyle;
    case '.r':
      return kernelFileIconStyle;
    case '.yml':
      return yamlFileIconStyle;
    case '.yaml':
      return yamlFileIconStyle;
    case '.svg':
      return imageFileIconStyle;
    case '.tiff':
      return imageFileIconStyle;
    case '.jpeg':
      return imageFileIconStyle;
    case '.jpg':
      return imageFileIconStyle;
    case '.gif':
      return imageFileIconStyle;
    case '.png':
      return imageFileIconStyle;
    case '.raw':
      return imageFileIconStyle;
    default:
      return genericFileIconStyle;
  }
}

/** Get the extension of a given selected file */
export function parseSelectedFileExtension(path: string): string {
  if (path[path.length - 1] === '/') {
    return folderFileIconSelectedStyle;
  }
  let fileExtension = PathExt.extname(path).toLocaleLowerCase();
  switch (fileExtension) {
    case '.md':
      return markdownFileIconSelectedStyle;
    case '.py':
      return pythonFileIconSelectedStyle;
    case '.json':
      return jsonFileIconSelectedStyle;
    case '.csv':
      return spreadsheetFileIconSelectedStyle;
    case '.xls':
      return spreadsheetFileIconSelectedStyle;
    case '.r':
      return kernelFileIconSelectedStyle;
    case '.yml':
      return yamlFileIconSelectedStyle;
    case '.yaml':
      return yamlFileIconSelectedStyle;
    case '.svg':
      return imageFileIconSelectedStyle;
    case '.tiff':
      return imageFileIconSelectedStyle;
    case '.jpeg':
      return imageFileIconSelectedStyle;
    case '.jpg':
      return imageFileIconSelectedStyle;
    case '.gif':
      return imageFileIconSelectedStyle;
    case '.png':
      return imageFileIconSelectedStyle;
    case '.raw':
      return imageFileIconSelectedStyle;
    default:
      return genericFileIconSelectedStyle;
  }
}
