import { TranslationBundle } from '@jupyterlab/translation';
import {
  caretDownIcon,
  caretRightIcon,
  closeIcon
} from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import * as React from 'react';
import { Logger } from '../logger';
import {
  commitComparisonBoxStyle,
  commitComparisonDiffStyle
} from '../style/CommitComparisonBox';
import {
  changeStageButtonStyle,
  sectionAreaStyle,
  sectionHeaderLabelStyle
} from '../style/GitStageStyle';
import { Git, IGitExtension, Level } from '../tokens';
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
   * Header text.
   */
  header: string;

  /**
   * Extension logger
   */
  logger: Logger;

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
  const [files, setFiles] = React.useState<Git.ICommitModifiedFile[]>([]);

  const { referenceCommit, challengerCommit, model } = props;
  const hasDiff = referenceCommit !== null && challengerCommit !== null;
  const totalInsertions = files.reduce((acc, file) => {
    const insertions = Number.parseInt(file.insertion, 10);
    return acc + (Number.isNaN(insertions) ? 0 : insertions);
  }, 0);
  const totalDeletions = files.reduce((acc, file) => {
    const deletions = Number.parseInt(file.deletion, 10);
    return acc + (Number.isNaN(deletions) ? 0 : deletions);
  }, 0);

  React.useEffect(() => {
    (async () => {
      if (referenceCommit === null || challengerCommit === null) {
        setFiles([]);
        return;
      }

      let diffResult: Git.IDiffResult = null;
      try {
        diffResult = await model.diff(
          referenceCommit.commit,
          challengerCommit.commit
        );
        if (diffResult.code !== 0) {
          throw new Error(diffResult.message);
        }
      } catch (err) {
        const msg = `Failed to get the diff for ${referenceCommit.commit} and ${challengerCommit.commit}.`;
        console.error(msg, err);
        props.logger.log({
          level: Level.ERROR,
          message: msg,
          error: err
        });
        return;
      }
      if (diffResult) {
        setFiles(
          diffResult.result.map(changedFile => {
            const pathParts = changedFile.filename.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const filePath = changedFile.filename;
            return {
              deletion: changedFile.deletions,
              insertion: changedFile.insertions,
              is_binary:
                changedFile.deletions === '-' || changedFile.insertions === '-',
              modified_file_name: fileName,
              modified_file_path: filePath,
              type: changedFile.filetype
            } as Git.ICommitModifiedFile;
          })
        );
      } else {
        setFiles([]);
      }
    })();
  }, [referenceCommit, challengerCommit]);

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
        (files.length ? (
          <CommitDiff
            className={commitComparisonDiffStyle}
            deletions={`${totalDeletions}`}
            files={files}
            insertions={`${totalInsertions}`}
            numFiles={`${files.length}`}
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
