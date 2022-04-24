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

/**
 * File list item height
 */
const ITEM_HEIGHT = 24;
/**
 * Maximal number of file display at once
 */
const MAX_VISIBLE_FILES = 5;

/**
 * CommitDiff component properties
 */
export interface ICommitDiffProps {
  /**
   * Global actions on the commit diff
   */
  actions?: JSX.Element;

  /**
   * Class name
   */
  className?: string;

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
  files: Git.ICommitModifiedFile[];

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

/**
 * Display differences between two commits
 */
export class CommitDiff extends React.PureComponent<ICommitDiffProps> {
  render(): JSX.Element {
    return (
      <div className={this.props.className}>
        <div className={commitClass}>
          <div className={commitOverviewNumbersClass}>
            <span title={this.props.trans.__('# Files Changed')}>
              <fileIcon.react className={iconClass} tag="span" />
              {this.props.numFiles}
            </span>
            <span title={this.props.trans.__('# Insertions')}>
              <insertionsMadeIcon.react
                className={classes(iconClass, insertionsIconClass)}
                tag="span"
              />
              {this.props.insertions}
            </span>
            <span title={this.props.trans.__('# Deletions')}>
              <deletionsMadeIcon.react
                className={classes(iconClass, deletionsIconClass)}
                tag="span"
              />
              {this.props.deletions}
            </span>
          </div>
        </div>
        <div className={commitDetailClass}>
          <div className={commitDetailHeaderClass}>
            {this.props.trans.__('Changed')}
            {this.props.actions ?? null}
          </div>
          {this.props.files.length > 0 && (
            <FixedSizeList
              className={fileListClass}
              height={
                Math.min(MAX_VISIBLE_FILES, this.props.files.length) *
                ITEM_HEIGHT
              }
              innerElementType="ul"
              itemCount={this.props.files.length}
              itemData={this.props.files}
              itemKey={(index, data) => data[index].modified_file_path}
              itemSize={ITEM_HEIGHT}
              style={{ overflowX: 'hidden' }}
              width={'auto'}
            >
              {this._renderFile}
            </FixedSizeList>
          )}
        </div>
      </div>
    );
  }

  private _renderFile = (props: ListChildComponentProps): JSX.Element => {
    const { data, index, style } = props;
    const file = data[index];
    const path = file.modified_file_path;
    const previous = file.previous_file_path;
    const flg = !!getDiffProvider(path) || !file.is_binary;
    return (
      <li
        className={commitDetailFileClass}
        onClick={this.props.onOpenDiff(path, flg, previous)}
        style={style}
        title={path}
      >
        <FilePath filepath={path} filetype={file.type} />
        {flg ? (
          <ActionButton
            icon={diffIcon}
            title={this.props.trans.__('View file changes')}
          />
        ) : null}
      </li>
    );
  };
}
