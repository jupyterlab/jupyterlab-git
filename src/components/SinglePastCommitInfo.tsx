import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { fileIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
import { classes } from 'typestyle/';
import { GitExtension } from '../model';
import {
  deletionsMadeIcon,
  diffIcon,
  discardIcon,
  insertionsMadeIcon,
  rewindIcon
} from '../style/icons';
import {
  actionButtonClass,
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
import { isDiffSupported } from './diff/Diff';
import { openDiffView } from './diff/DiffWidget';
import { FilePath } from './FilePath';
import { ResetRevertDialog } from './ResetRevertDialog';

/**
 * Interface describing component properties.
 */
export interface ISinglePastCommitInfoProps {
  /**
   * Commit data.
   */
  commit: Git.ISingleCommitInfo;

  /**
   * Extension data model.
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
 * Interface describing component state.
 */
export interface ISinglePastCommitInfoState {
  /**
   * Commit information.
   */
  info: string;

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
   * Current loading state for loading individual commit information.
   */
  loadingState: 'loading' | 'error' | 'success';

  /**
   * Boolean indicating whether to display a dialog for reseting or reverting a commit.
   */
  resetRevertDialog: boolean;

  /**
   * Reset/revert dialog mode (i.e., whether the dialog should be for reseting to or reverting an individual commit).
   */
  resetRevertAction: 'reset' | 'revert';
}

/**
 * React component for rendering information about an individual commit.
 */
export class SinglePastCommitInfo extends React.Component<
  ISinglePastCommitInfoProps,
  ISinglePastCommitInfoState
> {
  /**
   * Returns a React component for information about an individual commit.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: ISinglePastCommitInfoProps) {
    super(props);
    this.state = {
      info: '',
      numFiles: '',
      insertions: '',
      deletions: '',
      modifiedFiles: [],
      loadingState: 'loading',
      resetRevertDialog: false,
      resetRevertAction: 'reset'
    };
  }

  /**
   * Callback invoked immediately after mounting a component (i.e., inserting into a tree).
   */
  async componentDidMount(): Promise<void> {
    let log: Git.ISingleCommitFilePathInfo;
    try {
      log = await this.props.model.detailedLog(this.props.commit.commit);
    } catch (err) {
      console.error(
        `Error while getting detailed log for commit ${
          this.props.commit.commit
        } and path ${this.props.model.pathRepository}`,
        err
      );
      this.setState({ loadingState: 'error' });
      return;
    }
    if (log.code === 0) {
      this.setState({
        info: log.modified_file_note,
        numFiles: log.modified_files_count,
        insertions: log.number_of_insertions,
        deletions: log.number_of_deletions,
        modifiedFiles: log.modified_files,
        loadingState: 'success'
      });
    }
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    if (this.state.loadingState === 'loading') {
      return <div>...</div>;
    }
    if (this.state.loadingState === 'error') {
      return <div>Error loading commit data</div>;
    }
    return (
      <div>
        <div className={commitClass}>
          <div className={commitOverviewNumbersClass}>
            <span title="# Files Changed">
              <fileIcon.react className={iconClass} tag="span" />
              {this.state.numFiles}
            </span>
            <span title="# Insertions">
              <insertionsMadeIcon.react
                className={classes(iconClass, insertionsIconClass)}
                tag="span"
              />
              {this.state.insertions}
            </span>
            <span title="# Deletions">
              <deletionsMadeIcon.react
                className={classes(iconClass, deletionsIconClass)}
                tag="span"
              />
              {this.state.deletions}
            </span>
          </div>
        </div>
        <div className={commitDetailClass}>
          <div className={commitDetailHeaderClass}>
            Changed
            <ActionButton
              className={actionButtonClass}
              icon={discardIcon}
              title="Revert changes introduced by this commit"
              onClick={this._onRevertClick}
            />
            <ActionButton
              className={actionButtonClass}
              icon={rewindIcon}
              title="Discard changes introduced *after* this commit (hard reset)"
              onClick={this._onResetClick}
            />
            <ResetRevertDialog
              open={this.state.resetRevertDialog}
              action={this.state.resetRevertAction}
              model={this.props.model}
              commit={this.props.commit}
              suspend={this.props.suspend}
              onClose={this._onResetRevertDialogClose}
            />
          </div>
          <ul className={fileListClass}>
            {this.state.modifiedFiles.length > 0
              ? this._renderFileList()
              : null}
          </ul>
        </div>
      </div>
    );
  }

  /**
   * Renders a list of modified files.
   *
   * @returns array of React elements
   */
  private _renderFileList(): React.ReactElement[] {
    return this.state.modifiedFiles.map(this._renderFile, this);
  }

  /**
   * Renders a modified file.
   *
   * @param file - modified file
   * @param idx - file index
   * @returns React element
   */
  private _renderFile(file: Git.ICommitModifiedFile): React.ReactElement {
    const path = file.modified_file_path;
    const flg = isDiffSupported(path) || !file.is_binary;
    return (
      <li
        className={commitDetailFileClass}
        key={path}
        onClick={this._onDiffClickFactory(path, flg)}
        title={path}
      >
        <FilePath filepath={path} />
        {flg ? (
          <ActionButton icon={diffIcon} title="View file changes" />
        ) : null}
      </li>
    );
  }

  /**
   * Callback invoked upon a clicking a button to revert changes.
   *
   * @param event - event object
   */
  private _onRevertClick = (event: any): void => {
    event.stopPropagation();
    this.setState({
      resetRevertDialog: true,
      resetRevertAction: 'revert'
    });
  };

  /**
   * Callback invoked upon a clicking a button to reset changes.
   *
   * @param event - event object
   */
  private _onResetClick = (event: any): void => {
    event.stopPropagation();
    this.setState({
      resetRevertDialog: true,
      resetRevertAction: 'reset'
    });
  };

  /**
   * Callback invoked upon closing a dialog to reset or revert changes.
   */
  private _onResetRevertDialogClose = (): void => {
    this.setState({
      resetRevertDialog: false
    });
  };

  /**
   * Returns a callback to be invoked clicking a button to display a file diff.
   *
   * @param fpath - modified file path
   * @param bool - boolean indicating whether a displaying a diff is supported for this file path
   * @returns callback
   */
  private _onDiffClickFactory(fpath: string, bool: boolean) {
    const self = this;
    if (bool) {
      return onShowDiff;
    }
    return onClick;

    /**
     * Callback invoked upon clicking a button to display a file diff.
     *
     * @private
     * @param event - event object
     */
    function onClick(event: React.MouseEvent<HTMLLIElement, MouseEvent>) {
      // Prevent the commit component from being collapsed:
      event.stopPropagation();
    }

    /**
     * Callback invoked upon clicking a button to display a file diff.
     *
     * @private
     * @param event - event object
     */
    async function onShowDiff(
      event: React.MouseEvent<HTMLLIElement, MouseEvent>
    ) {
      // Prevent the commit component from being collapsed:
      event.stopPropagation();

      try {
        await openDiffView(
          fpath,
          self.props.model,
          {
            previousRef: {
              gitRef: self.props.commit.pre_commit
            },
            currentRef: {
              gitRef: self.props.commit.commit
            }
          },
          self.props.renderMime,
          bool
        );
      } catch (err) {
        console.error(`Failed to open diff view for ${fpath}.\n${err}`);
      }
    }
  }
}
