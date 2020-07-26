import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { GitExtension } from '../model';
import { historySideBarStyle } from '../style/HistorySideBarStyle';
import { Git } from '../tokens';
import { PastCommitNode } from './PastCommitNode';

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
   * Render MIME type registry.
   */
  renderMime: IRenderMimeRegistry;

  /**
   * Boolean indicating whether to enable UI suspension.
   */
  suspend: boolean;
}

/**
 * Returns a React component for displaying commit history.
 *
 * @param props - component properties
 * @returns React element
 */
export const HistorySideBar: React.FunctionComponent<IHistorySideBarProps> = (
  props: IHistorySideBarProps
): React.ReactElement => (
  <ol className={historySideBarStyle}>
    {props.commits.map((commit: Git.ISingleCommitInfo) => (
      <PastCommitNode
        key={commit.commit}
        commit={commit}
        branches={props.branches}
        model={props.model}
        renderMime={props.renderMime}
        suspend={props.suspend}
      />
    ))}
  </ol>
);
