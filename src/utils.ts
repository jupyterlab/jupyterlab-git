import { PathExt } from '@jupyterlab/coreutils';
import { CommandRegistry } from '@lumino/commands';
import { CommandArguments } from './commandsAndMenu';
import { ContextCommandIDs, Git } from './tokens';

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

/**
 * A callback function to display a file diff between two commits.
 * @param commands the command registry.
 * @returns a callback function to display a file diff.
 */
export const openFileDiff =
  (commands: CommandRegistry) =>
  /**
   * A callback function to display a file diff between two commits.
   *
   * @param commit Commit data.
   * @param previousCommit Previous commit data to display the diff against. If not specified, the diff will be against the preceding commit.
   *
   * @returns A callback function.
   */
  (commit: Git.ISingleCommitInfo, previousCommit?: Git.ISingleCommitInfo) =>
  /**
   * Returns a callback to be invoked on click to display a file diff.
   *
   * @param filePath file path.
   * @param isText indicates whether the file supports displaying a diff.
   * @param previousFilePath when file has been relocated.
   * @returns callback.
   */
  (filePath: string, isText: boolean, previousFilePath?: string) =>
  /**
   * Callback invoked upon clicking to display a file diff.
   *
   * @param event - event object
   */
  async (event: React.MouseEvent<HTMLLIElement, MouseEvent>): Promise<void> => {
    // Prevent the commit component from being collapsed:
    event.stopPropagation();

    if (isText) {
      try {
        commands.execute(ContextCommandIDs.gitFileDiff, {
          files: [
            {
              filePath,
              previousFilePath,
              isText,
              context: {
                previousRef: previousCommit?.commit ?? commit.pre_commits[0], // not sure
                currentRef: commit.commit
              }
            }
          ]
        } as CommandArguments.IGitFileDiff as any);
      } catch (err) {
        console.error(`Failed to open diff view for ${filePath}.\n${err}`);
      }
    }
  };
