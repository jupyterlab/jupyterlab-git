import { TranslationBundle } from '@jupyterlab/translation';
import { closeIcon } from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import * as React from 'react';
import { GitExtension } from '../model';
import { hiddenButtonStyle } from '../style/ActionButtonStyle';
import {
  historySideBarStyle,
  noHistoryFoundStyle,
  selectedHistoryFileStyle,
  historySideBarWrapperStyle
} from '../style/HistorySideBarStyle';
import { Git } from '../tokens';
import { openFileDiff } from '../utils';
import { ActionButton } from './ActionButton';
import { FileItem } from './FileItem';
import { PastCommitNode } from './PastCommitNode';
import { SinglePastCommitInfo } from './SinglePastCommitInfo';
import { GitCommitGraph } from './GitCommitGraph';

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

  /**
   * The commit to compare against.
   */
  referenceCommit: Git.ISingleCommitInfo | null;

  /**
   * The commit to compare.
   */
  challengerCommit: Git.ISingleCommitInfo | null;

  /**
   * Callback invoked upon clicking to select a commit for comparison.
   * @param event - event object
   */
  onSelectForCompare?: (
    commit: Git.ISingleCommitInfo
  ) => (event: React.MouseEvent<HTMLElement, MouseEvent>) => Promise<void>;

  /**
   * Callback invoked upon clicking to compare a commit against the selected.
   * @param event - event object
   */
  onCompareWithSelected?: (
    commit: Git.ISingleCommitInfo
  ) => (event: React.MouseEvent<HTMLElement, MouseEvent>) => Promise<void>;
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
      pre_commits: ['HEAD'],
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

  const [expandedCommits, setExpandedCommits] = React.useState<string[]>([]);
  const [nodeHeights, setNodeHeights] = React.useState<{
    [sha: string]: number;
  }>({});
  const nodes = React.useRef<{ [sha: string]: HTMLLIElement }>({});

  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const borderBoxSize = Array.isArray(entry.borderBoxSize)
          ? entry.borderBoxSize[0]
          : entry.borderBoxSize;
        const offsetHeight = borderBoxSize.blockSize;
        const sha = entry.target.id;
        setNodeHeights(prev => ({ ...prev, [sha]: offsetHeight }));
      }
    });

    props.commits.forEach(commit =>
      resizeObserver.observe(nodes.current[commit.commit], {
        box: 'border-box'
      })
    );
    return () => resizeObserver.disconnect();
  }, [props.commits]);

  return (
    <div className={historySideBarWrapperStyle}>
      {!props.model.selectedHistoryFile && (
        <GitCommitGraph
          commits={props.commits.map(commit => ({
            sha: commit.commit,
            parents: commit.pre_commits
          }))}
          getNodeHeight={(sha: string) => nodeHeights[sha] ?? 55}
        />
      )}

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
                ? openFileDiff(props.commands)(commit)(
                    commit.file_path ?? props.model.selectedHistoryFile.to,
                    !commit.is_binary,
                    commit.previous_file_path
                  )
                : undefined;

            const isReferenceCommit =
              commit.commit === props.referenceCommit?.commit;
            const isChallengerCommit =
              commit.commit === props.challengerCommit?.commit;

            return (
              <PastCommitNode
                key={commit.commit}
                setRef={node => {
                  nodes.current[commit.commit] = node;
                }}
                {...commonProps}
                isReferenceCommit={isReferenceCommit}
                isChallengerCommit={isChallengerCommit}
                onOpenDiff={onOpenDiff}
                onSelectForCompare={
                  isChallengerCommit ? null : props.onSelectForCompare(commit)
                }
                onCompareWithSelected={
                  isReferenceCommit || props.referenceCommit === null
                    ? null
                    : props.onCompareWithSelected(commit)
                }
                expanded={expandedCommits.includes(commit.commit)}
                toggleCommitExpansion={sha =>
                  setExpandedCommits(prevExpandedCommits => {
                    if (prevExpandedCommits.includes(sha)) {
                      return prevExpandedCommits.filter(
                        commit => commit !== sha
                      );
                    } else {
                      return [...prevExpandedCommits, sha];
                    }
                  })
                }
              >
                {!props.model.selectedHistoryFile && (
                  <SinglePastCommitInfo
                    {...commonProps}
                    onOpenDiff={openFileDiff(props.commands)(commit)}
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
    </div>
  );
};
