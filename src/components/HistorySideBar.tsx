import { TranslationBundle } from '@jupyterlab/translation';
import { closeIcon } from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import * as React from 'react';
import { CommandArguments } from '../commandsAndMenu';
import { GitExtension } from '../model';
import { hiddenButtonStyle } from '../style/ActionButtonStyle';
import {
  historySideBarStyle,
  noHistoryFoundStyle,
  selectedHistoryFileStyle
} from '../style/HistorySideBarStyle';
import { ContextCommandIDs, Git } from '../tokens';
import { ActionButton } from './ActionButton';
import { FileItem } from './FileItem';
import { PastCommitNode } from './PastCommitNode';
import { SinglePastCommitInfo } from './SinglePastCommitInfo';

/**
 * Interface describing component properties.
 */
export interface IHistorySideBarProps {
  /**
   * List of commits.
   */
  commits: Git.ISingleCommitInfo[];

  /**
   * List of branches.
   */
  branches: Git.IBranch[];

  /**
   * Git extension data model.
   */
  model: GitExtension;

  /**
   * Jupyter App commands registry
   */
  commands: CommandRegistry;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

/**
 * Returns a React component for displaying commit history.
 *
 * @param props - component properties
 * @returns React element
 */
export const HistorySideBar: React.FunctionComponent<IHistorySideBarProps> = (
  props: IHistorySideBarProps
): React.ReactElement => {
  /**
   * Discards the selected file and shows the full history.
   */
  const removeSelectedFile = () => {
    props.model.selectedHistoryFile = null;
  };

  /**
   * Curried callback function to display a file diff.
   *
   * @param commit Commit data.
   */
  const openDiff =
    (commit: Git.ISingleCommitInfo) =>
    /**
     * Returns a callback to be invoked on click to display a file diff.
     *
     * @param filePath file path
     * @param isText indicates whether the file supports displaying a diff
     * @param previousFilePath when file has been relocated
     * @returns callback
     */
    (filePath: string, isText: boolean, previousFilePath?: string) =>
    /**
     * Callback invoked upon clicking to display a file diff.
     *
     * @param event - event object
     */
    async (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
      // Prevent the commit component from being collapsed:
      event.stopPropagation();

      if (isText) {
        try {
          props.commands.execute(ContextCommandIDs.gitFileDiff, {
            files: [
              {
                filePath,
                previousFilePath,
                isText,
                context: {
                  previousRef: commit.pre_commit,
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

  /**
   * Commit info for 'Uncommitted Changes' history.
   */
  const uncommitted = React.useMemo<Git.ISingleCommitInfo>(() => {
    return {
      author: props.trans.__('You'),
      commit: `${
        props.model.selectedHistoryFile?.status === 'staged'
          ? Git.Diff.SpecialRef.INDEX
          : Git.Diff.SpecialRef.WORKING
      }`,
      pre_commit: 'HEAD',
      is_binary: props.commits[0]?.is_binary ?? false,
      commit_msg: props.trans.__('Uncommitted Changes'),
      date: props.trans.__('now')
    };
  }, [props.model.selectedHistoryFile]);

  const commits =
    props.model.selectedHistoryFile &&
    props.model.selectedHistoryFile?.status !== 'unmodified'
      ? [uncommitted, ...props.commits]
      : props.commits;

  return (
    <ol className={historySideBarStyle}>
      {!!props.model.selectedHistoryFile && (
        <FileItem
          className={selectedHistoryFileStyle}
          model={props.model}
          trans={props.trans}
          actions={
            <ActionButton
              className={hiddenButtonStyle}
              icon={closeIcon}
              title={props.trans.__('Discard file history')}
              onClick={removeSelectedFile}
            />
          }
          file={props.model.selectedHistoryFile}
          onDoubleClick={removeSelectedFile}
        />
      )}
      {commits.length ? (
        commits.map((commit: Git.ISingleCommitInfo) => {
          const commonProps = {
            commit,
            branches: props.branches,
            model: props.model,
            commands: props.commands,
            trans: props.trans
          };

          // Only pass down callback when single file history is open
          // and its diff is viewable
          const onOpenDiff =
            props.model.selectedHistoryFile && !commit.is_binary
              ? openDiff(commit)(
                  commit.file_path ?? props.model.selectedHistoryFile.to,
                  !commit.is_binary,
                  commit.previous_file_path
                )
              : undefined;

          return (
            <PastCommitNode
              key={commit.commit}
              {...commonProps}
              onOpenDiff={onOpenDiff}
            >
              {!props.model.selectedHistoryFile && (
                <SinglePastCommitInfo
                  {...commonProps}
                  onOpenDiff={openDiff(commit)}
                />
              )}
            </PastCommitNode>
          );
        })
      ) : (
        <li className={noHistoryFoundStyle}>
          {props.trans.__('No history found.')}
        </li>
      )}
    </ol>
  );
};
