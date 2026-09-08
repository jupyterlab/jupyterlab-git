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

/**
 * Click handler that prevents the event from reaching an ancestor.
 *
 * @param event Mouse event
 */
export function stopPropagation(
  event: React.MouseEvent<HTMLElement, MouseEvent>
): void {
  event.stopPropagation();
}

/**
 * Wrap mouse event handler to stop event propagation
 * @param fn Mouse event handler
 * @returns Mouse event handler that stops event from propagating
 */
export function stopPropagationWrapper(
  fn: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
): (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void {
  return (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event?.stopPropagation();
    fn(event);
  };
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
 * Convert a commit to a comparable Git ref.
 *
 * @param commit Commit data.
 * @returns comparable Git ref.
 */
export function commitToDiffRef(
  commit: Git.ISingleCommitInfo
): Git.IRefComparison {
  return {
    ref: commit.commit,
    label: commit.commit.substring(0, 7),
    previousRef: commit.pre_commits[0]
  };
}

/**
 * A callback function to display a file diff between two Git refs.
 * @param commands the command registry.
 * @returns a callback function to display a file diff.
 */
export const openFileDiff =
  (commands: CommandRegistry) =>
  /**
   * A callback function to display a file diff between two Git refs.
   *
   * @param current Ref data to compare.
   * @param previous Previous ref data to display the diff against. If not specified, the diff will use the current ref fallback.
   *
   * @returns A callback function.
   */
  (current: Git.IRefComparison, previous?: Git.IRefComparison) =>
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
  async (
    event?: React.MouseEvent<HTMLLIElement, MouseEvent>
  ): Promise<void> => {
    // Prevent the commit component from being collapsed:
    event?.stopPropagation();

    if (isText) {
      try {
        commands.execute(ContextCommandIDs.gitFileDiff, {
          files: [
            {
              filePath,
              previousFilePath,
              isText,
              context: {
                previousRef: previous?.ref ?? current.previousRef ?? 'HEAD',
                currentRef: current.ref
              }
            }
          ]
        } as CommandArguments.IGitFileDiff as any);
      } catch (err) {
        console.error(`Failed to open diff view for ${filePath}.\n${err}`);
      }
    }
  };
