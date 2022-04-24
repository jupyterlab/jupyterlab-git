import { TranslationBundle } from '@jupyterlab/translation';
import {
  caretDownIcon,
  caretRightIcon,
  closeIcon
} from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import * as React from 'react';
import { commitComparisonBoxStyle } from '../style/CommitComparisonBox';
import {
  changeStageButtonStyle,
  sectionAreaStyle,
  sectionHeaderLabelStyle
} from '../style/GitStageStyle';
import { Git, IGitExtension } from '../tokens';
import { ActionButton } from './ActionButton';
import { CommitDiff } from './CommitDiff';

/**
 * Interface describing ComparisonBox component properties.
 */
export interface ICommitComparisonBoxProps {
  /**
   * Jupyter App commands registry.
   */
  commands: CommandRegistry;

  /**
   * The commit to compare against.
   */
  referenceCommit: Git.ISingleCommitInfo | null;

  /**
   * The commit to compare.
   */
  challengerCommit: Git.ISingleCommitInfo | null;

  /**
   * The commit comparison result.
   */
  changedFiles: Git.ICommitModifiedFile[] | null;

  /**
   * Header text.
   */
  header: string;

  /**
   * Extension data model.
   */
  model: IGitExtension;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;

  /**
   * Returns a callback to be invoked on close.
   */
  onClose: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;

  /**
   * Returns a callback to be invoked on click to display a file diff.
   *
   * @param filePath file path
   * @param isText indicates whether the file supports displaying a diff
   * @param previousFilePath when file has been relocated
   * @returns callback
   */
  onOpenDiff?: (
    filePath: string,
    isText: boolean,
    previousFilePath?: string
  ) => (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
}

/**
 * A component which displays a comparison between two commits.
 */
export function CommitComparisonBox(
  props: ICommitComparisonBoxProps
): JSX.Element {
  const [collapsed, setCollapsed] = React.useState<boolean>(false);

  const { changedFiles, referenceCommit, challengerCommit } = props;
  const hasDiff = referenceCommit !== null && challengerCommit !== null;
  const totalInsertions = (changedFiles ?? []).reduce((acc, file) => {
    const insertions = Number.parseInt(file.insertion, 10);
    return acc + (Number.isNaN(insertions) ? 0 : insertions);
  }, 0);
  const totalDeletions = (changedFiles ?? []).reduce((acc, file) => {
    const deletions = Number.parseInt(file.deletion, 10);
    return acc + (Number.isNaN(deletions) ? 0 : deletions);
  }, 0);

  return (
    <div className={commitComparisonBoxStyle}>
      <div
        className={sectionAreaStyle}
        onClick={() => setCollapsed(!collapsed)}
      >
        <button className={changeStageButtonStyle}>
          {collapsed ? <caretRightIcon.react /> : <caretDownIcon.react />}
        </button>

        <span className={sectionHeaderLabelStyle}>{props.header}</span>
        <ActionButton
          title={props.trans.__('Close')}
          icon={closeIcon}
          onClick={(event: React.MouseEvent<HTMLElement, MouseEvent>) => {
            props.onClose(event);
          }}
        ></ActionButton>
      </div>
      {!collapsed &&
        (changedFiles ? (
          <CommitDiff
            deletions={`${totalDeletions}`}
            files={props.changedFiles}
            insertions={`${totalInsertions}`}
            numFiles={`${changedFiles.length}`}
            onOpenDiff={props.onOpenDiff}
            trans={props.trans}
          ></CommitDiff>
        ) : (
          <p>
            {hasDiff
              ? props.trans.__('No changes')
              : props.trans.__('No challenger commit selected.')}
          </p>
        ))}
    </div>
  );
}
