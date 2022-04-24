import { TranslationBundle } from '@jupyterlab/translation';
import { fileIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { classes } from 'typestyle';
import { getDiffProvider } from '../model';
import {
  deletionsMadeIcon,
  diffIcon,
  insertionsMadeIcon
} from '../style/icons';
import {
  commitClass,
  commitDetailClass,
  commitDetailFileClass,
  commitDetailHeaderClass,
  commitOverviewNumbersClass,
  deletionsIconClass,
  fileListClass,
  iconClass,
  insertionsIconClass
} from '../style/SinglePastCommitInfo';
import { Git } from '../tokens';
import { ActionButton } from './ActionButton';
import { FilePath } from './FilePath';

const ITEM_HEIGHT = 24; // File list item height
const MAX_VISIBLE_FILES = 20; // Maximal number of file display at once

export interface ICommitDiffProps {
  actions?: JSX.Element;

  /**
   * Number of modified files.
   */
  numFiles: string;

  /**
   * Number of insertions.
   */
  insertions: string;

  /**
   * Number of deletions.
   */
  deletions: string;

  /**
   * A list of modified files.
   */
  modifiedFiles: Git.ICommitModifiedFile[];

  /**
   * The application language translator.
   */
  trans: TranslationBundle;

  /**
   * Returns a callback to be invoked on click to display a file diff.
   *
   * @param filePath file path
   * @param isText indicates whether the file supports displaying a diff
   * @param previousFilePath when file has been relocated
   * @returns callback
   */
  onOpenDiff: (
    filePath: string,
    isText: boolean,
    previousFilePath?: string
  ) => (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
}

export function CommitDiff(props: ICommitDiffProps): JSX.Element {
  const renderFile = (subProps: ListChildComponentProps): JSX.Element => {
    const { data, index, style } = subProps;
    const file = data[index];
    const path = file.modified_file_path;
    const previous = file.previous_file_path;
    const flg = !!getDiffProvider(path) || !file.is_binary;
    return (
      <li
        className={commitDetailFileClass}
        onClick={props.onOpenDiff(path, flg, previous)}
        style={style}
        title={path}
      >
        <FilePath filepath={path} filetype={file.type} />
        {flg ? (
          <ActionButton
            icon={diffIcon}
            title={props.trans.__('View file changes')}
          />
        ) : null}
      </li>
    );
  };

  return (
    <div>
      <div className={commitClass}>
        <div className={commitOverviewNumbersClass}>
          <span title={props.trans.__('# Files Changed')}>
            <fileIcon.react className={iconClass} tag="span" />
            {props.numFiles}
          </span>
          <span title={props.trans.__('# Insertions')}>
            <insertionsMadeIcon.react
              className={classes(iconClass, insertionsIconClass)}
              tag="span"
            />
            {props.insertions}
          </span>
          <span title={props.trans.__('# Deletions')}>
            <deletionsMadeIcon.react
              className={classes(iconClass, deletionsIconClass)}
              tag="span"
            />
            {props.deletions}
          </span>
        </div>
      </div>
      <div className={commitDetailClass}>
        <div className={commitDetailHeaderClass}>
          {props.trans.__('Changed')}
          {props.actions ?? null}
        </div>
        {props.modifiedFiles.length > 0 && (
          <FixedSizeList
            className={fileListClass}
            height={
              Math.min(MAX_VISIBLE_FILES, props.modifiedFiles.length) *
              ITEM_HEIGHT
            }
            innerElementType="ul"
            itemCount={props.modifiedFiles.length}
            itemData={props.modifiedFiles}
            itemKey={(index, data) => data[index].modified_file_path}
            itemSize={ITEM_HEIGHT}
            style={{ overflowX: 'hidden' }}
            width={'auto'}
          >
            {renderFile}
          </FixedSizeList>
        )}
      </div>
    </div>
  );
}
