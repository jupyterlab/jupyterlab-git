import { PathExt } from '@jupyterlab/coreutils';
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
