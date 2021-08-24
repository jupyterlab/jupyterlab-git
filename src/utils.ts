import { PathExt } from '@jupyterlab/coreutils';
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
  /**
   * All combinations of statuses for merge conflicts
   * @see https://git-scm.com/docs/git-status#_short_format
   */
  const unmergedCombinations: Record<string, string[]> = {
    D: ['D', 'U'],
    A: ['U', 'A'],
    U: ['D', 'A', 'U']
  };

  // If the file has a merge conflict
  if ((unmergedCombinations[x] ?? []).includes(y)) {
    return 'unmerged';
  }

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
 * Returns a promise which resolves after a specified duration.
 *
 * @param ms - duration (in milliseconds)
 * @returns a promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
