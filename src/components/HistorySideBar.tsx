import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
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
): React.ReactElement => (
  <ol className={historySideBarStyle}>
    {props.commits.map((commit: Git.ISingleCommitInfo) => (
      <PastCommitNode
        key={commit.commit}
        commit={commit}
        branches={props.branches}
        model={props.model}
        commands={props.commands}
        trans={props.trans}
      />
    ))}
  </ol>
);
