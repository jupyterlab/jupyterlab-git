import { TranslationBundle } from '@jupyterlab/translation';
import { closeIcon } from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import * as React from 'react';
import { CommandArguments } from '../commandsAndMenu';
import { GitExtension } from '../model';
import { hiddenButtonStyle } from '../style/ActionButtonStyle';
import { historySideBarStyle } from '../style/HistorySideBarStyle';
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
     * @returns callback
     */
    (filePath: string, isText: boolean) =>
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

  return (
    <ol className={historySideBarStyle}>
      {!!props.model.selectedHistoryFile && (
        <FileItem
          style={{ overflowX: 'hidden', flexGrow: 0, flexShrink: 0 }}
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
      {props.commits.map((commit: Git.ISingleCommitInfo) => {
        const commitNodeProps = {
          commit,
          branches: props.branches,
          model: props.model,
          commands: props.commands,
          trans: props.trans
        };

        // Only pass down callback when single file history is open and diff is viewable
        const onOpenDiff =
          props.model.selectedHistoryFile && !commit.is_binary
            ? openDiff(commit)(
                props.model.selectedHistoryFile.to,
                !commit.is_binary
              )
            : undefined;

        return (
          <PastCommitNode
            key={commit.commit}
            {...commitNodeProps}
            onOpenDiff={onOpenDiff}
          >
            {!props.model.selectedHistoryFile && (
              <SinglePastCommitInfo
                {...commitNodeProps}
                onOpenDiff={openDiff(commit)}
              />
            )}
          </PastCommitNode>
        );
      })}
    </ol>
  );
};
