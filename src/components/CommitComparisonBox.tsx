import { TranslationBundle } from '@jupyterlab/translation';
import {
  caretDownIcon,
  caretRightIcon,
  fileIcon
} from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import * as React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { classes } from 'typestyle';
import { getDiffProvider } from '../model';
import {
  clickableSpanStyle,
  commitComparisonBoxChangedFileListStyle,
  commitComparisonBoxDetailStyle
} from '../style/CommitComparisonBox';
import {
  changeStageButtonStyle,
  sectionAreaStyle,
  sectionHeaderLabelStyle
} from '../style/GitStageStyle';
import {
  deletionsMadeIcon,
  diffIcon,
  insertionsMadeIcon
} from '../style/icons';
import {
  commitClass,
  commitDetailFileClass,
  commitDetailHeaderClass,
  commitOverviewNumbersClass,
  deletionsIconClass,
  fileListClass,
  iconClass,
  insertionsIconClass
} from '../style/SinglePastCommitInfo';
import { Git, IGitExtension } from '../tokens';
import { ActionButton } from './ActionButton';
import { FilePath } from './FilePath';

const ITEM_HEIGHT = 24; // File list item height

interface ICommitComparisonBoxHeaderProps {
  collapsible: boolean;
  collapsed?: boolean;
  label?: string;
  trans: TranslationBundle;
  onCollapseExpand?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  onClickCancel?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

const CommitComparisonBoxHeader: React.VFC<ICommitComparisonBoxHeaderProps> = (
  props: ICommitComparisonBoxHeaderProps
) => {
  return (
    <div className={sectionAreaStyle} onClick={props.onCollapseExpand}>
      {props.collapsible && (
        <button className={changeStageButtonStyle}>
          {props.collapsed ? <caretRightIcon.react /> : <caretDownIcon.react />}
        </button>
      )}
      <span className={sectionHeaderLabelStyle}>{props.label}</span>
      {props.onClickCancel && (
        <span className={clickableSpanStyle} onClick={props.onClickCancel}>
          {props.trans.__('Cancel')}
        </span>
      )}
    </div>
  );
};

interface ICommitComparisonBoxOverviewProps {
  totalFiles: number;
  totalInsertions: number;
  totalDeletions: number;
  trans: TranslationBundle;
}

const CommitComparisonBoxOverview: React.VFC<ICommitComparisonBoxOverviewProps> =
  (props: ICommitComparisonBoxOverviewProps) => {
    return (
      <div className={commitClass}>
        <div className={commitOverviewNumbersClass}>
          <span title={props.trans.__('# Files Changed')}>
            <fileIcon.react className={iconClass} tag="span" />
            {props.totalFiles}
          </span>
          <span title={props.trans.__('# Insertions')}>
            <insertionsMadeIcon.react
              className={classes(iconClass, insertionsIconClass)}
              tag="span"
            />
            {props.totalInsertions}
          </span>
          <span title={props.trans.__('# Deletions')}>
            <deletionsMadeIcon.react
              className={classes(iconClass, deletionsIconClass)}
              tag="span"
            />
            {props.totalDeletions}
          </span>
        </div>
      </div>
    );
  };

interface ICommitComparisonBoxChangedFileListProps {
  files: Git.ICommitModifiedFile[];
  trans: TranslationBundle;
  onOpenDiff?: (
    filePath: string,
    isText: boolean,
    previousFilePath?: string
  ) => (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
}

class CommitComparisonBoxChangedFileList extends React.Component<ICommitComparisonBoxChangedFileListProps> {
  render() {
    return (
      <div className={commitComparisonBoxDetailStyle}>
        <div className={commitDetailHeaderClass}>
          {this.props.trans.__('Changed')}
        </div>
        {this.props.files.length > 0 && (
          <FixedSizeList
            className={classes(
              commitComparisonBoxChangedFileListStyle,
              fileListClass
            )}
            height={this.props.files.length * ITEM_HEIGHT}
            innerElementType={'ul'}
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
    );
  }
  /**
   * Renders a modified file.
   *
   * @param props Row properties
   * @returns React element
   */
  private _renderFile = (
    props: ListChildComponentProps<Git.ICommitModifiedFile[]>
  ): JSX.Element => {
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

interface ICommitComparisonBoxBodyProps {
  files: Git.ICommitModifiedFile[];
  show: boolean;
  trans: TranslationBundle;
  onOpenDiff?: (
    filePath: string,
    isText: boolean,
    previousFilePath?: string
  ) => (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
}

const CommitComparisonBoxBody: React.VFC<ICommitComparisonBoxBodyProps> = (
  props: ICommitComparisonBoxBodyProps
) => {
  const totalInsertions = props.files.reduce((acc, file) => {
    const insertions = Number.parseInt(file.insertion, 10);
    return acc + (Number.isNaN(insertions) ? 0 : insertions);
  }, 0);
  const totalDeletions = props.files.reduce((acc, file) => {
    const deletions = Number.parseInt(file.deletion, 10);
    return acc + (Number.isNaN(deletions) ? 0 : deletions);
  }, 0);
  return (
    <React.Fragment>
      <CommitComparisonBoxOverview
        totalDeletions={totalDeletions}
        totalFiles={props.files.length}
        totalInsertions={totalInsertions}
        trans={props.trans}
      />
      <CommitComparisonBoxChangedFileList
        files={props.files}
        onOpenDiff={props.onOpenDiff}
        trans={props.trans}
      />
    </React.Fragment>
  );
};

/**
 * Interface describing ComparisonBox component properties.
 */
export interface ICommitComparisonBoxProps {
  /**
   * Is this collapsible?
   */
  collapsible: boolean;

  /**
   * Jupyter App commands registry
   */
  commands: CommandRegistry;

  /**
   * Commit comparison result
   */
  comparison: Git.ICommitComparison | null;

  /**
   * Header text
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
   * Returns a callback to be invoked on clicking cancel.
   */
  onCancel?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;

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
export const CommitComparisonBox: React.VFC<ICommitComparisonBoxProps> = (
  props: ICommitComparisonBoxProps
) => {
  const [collapsed, setCollapsed] = React.useState<boolean>(false);
  return (
    <React.Fragment>
      <CommitComparisonBoxHeader
        collapsible={props.collapsible}
        collapsed={collapsed}
        label={props.header}
        onCollapseExpand={() => setCollapsed(!collapsed)}
        onClickCancel={props.onCancel}
        trans={props.trans}
      />
      {!collapsed && props.comparison?.changedFiles && (
        <CommitComparisonBoxBody
          files={props.comparison.changedFiles}
          onOpenDiff={props.onOpenDiff}
          show={!collapsed}
          trans={props.trans}
        />
      )}
    </React.Fragment>
  );
};
