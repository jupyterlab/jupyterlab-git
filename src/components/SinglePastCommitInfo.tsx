import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import * as React from 'react';
import { LoggerContext } from '../logger';
import { GitExtension } from '../model';
import { discardIcon, rewindIcon } from '../style/icons';
import {
  actionButtonClass,
  commitBodyClass
} from '../style/SinglePastCommitInfo';
import { Git } from '../tokens';
import { ActionButton } from './ActionButton';
import { CommitDiff } from './CommitDiff';
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
   * Jupyter App commands registry
   */
  commands: CommandRegistry;

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
 * Interface describing component state.
 */
export interface ISinglePastCommitInfoState {
  /**
   * Commit information.
   */
  info: string;

  /**
   * Commit information.
   */
  commitBody: string;

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
   * Boolean indicating whether to display a dialog for resetting or reverting a commit.
   */
  resetRevertDialog: boolean;

  /**
   * Reset/revert dialog mode (i.e., whether the dialog should be for resetting to or reverting an individual commit).
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
      commitBody: '',
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
    try {
      const log = await this.props.model.detailedLog(this.props.commit.commit);

      this.setState({
        info: log.modified_file_note,
        commitBody: log.commit_body,
        numFiles: log.modified_files_count,
        insertions: log.number_of_insertions,
        deletions: log.number_of_deletions,
        modifiedFiles: log.modified_files,
        loadingState: 'success'
      });
    } catch (err) {
      console.error(
        `Error while getting detailed log for commit ${this.props.commit.commit} and path ${this.props.model.pathRepository}`,
        err
      );
      this.setState({ loadingState: 'error' });
      return;
    }
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    if (this.state.loadingState === 'loading') {
      return <div>…</div>;
    }
    if (this.state.loadingState === 'error') {
      return <div>{this.props.trans.__('Error loading commit data')}</div>;
    }
    return (
      <div>
        <p className={commitBodyClass}>{this.state.commitBody}</p>
        <CommitDiff
          actions={
            <>
              <ActionButton
                className={actionButtonClass}
                icon={discardIcon}
                title={this.props.trans.__(
                  'Revert changes introduced by this commit'
                )}
                onClick={this._onRevertClick}
              />
              <ActionButton
                className={actionButtonClass}
                icon={rewindIcon}
                title={this.props.trans.__(
                  'Discard changes introduced *after* this commit (hard reset)'
                )}
                onClick={this._onResetClick}
              />
              <LoggerContext.Consumer>
                {logger => (
                  <ResetRevertDialog
                    open={this.state.resetRevertDialog}
                    action={this.state.resetRevertAction}
                    model={this.props.model}
                    logger={logger}
                    commit={this.props.commit}
                    onClose={this._onResetRevertDialogClose}
                    trans={this.props.trans}
                  />
                )}
              </LoggerContext.Consumer>
            </>
          }
          numFiles={this.state.numFiles}
          insertions={this.state.insertions}
          deletions={this.state.deletions}
          files={this.state.modifiedFiles}
          onOpenDiff={this.props.onOpenDiff}
          trans={this.props.trans}
        ></CommitDiff>
      </div>
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
}
