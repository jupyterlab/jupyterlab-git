import { PathExt } from '@jupyterlab/coreutils';
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
 * @param selected Is the file selected? Optional: default is false
 */
export function getFileIconClassName(path: string, selected = false): string {
  if (path[path.length - 1] === '/') {
    return selected ? folderFileIconSelectedStyle : folderFileIconStyle;
  }
  const fileExtension = PathExt.extname(path).toLocaleLowerCase();
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

/**
 * Returns a promise which resolves after a specified duration.
 *
 * @param ms - duration (in milliseconds)
 * @returns a promise
 */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
