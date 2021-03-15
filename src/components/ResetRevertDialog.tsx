import { TranslationBundle } from '@jupyterlab/translation';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import ClearIcon from '@material-ui/icons/Clear';
import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { classes } from 'typestyle';
import { Logger } from '../logger';
import {
  actionsWrapperClass,
  buttonClass,
  cancelButtonClass,
  closeButtonClass,
  commitDescriptionClass,
  commitFormClass,
  commitSummaryClass,
  contentWrapperClass,
  resetRevertDialogClass,
  submitButtonClass,
  titleClass,
  titleWrapperClass
} from '../style/ResetRevertDialog';
import { Git, IGitExtension, Level } from '../tokens';

/**
 * Interface describing component properties.
 */
export interface IResetRevertDialogProps {
  /**
   * Type of action to perform.
   */
  action: 'reset' | 'revert';

  /**
   * Commit data for a single commit.
   */
  commit: Git.ISingleCommitInfo;

  /**
   * Extension data model.
   */
  model: IGitExtension;

  /**
   * Extension logger
   */
  logger: Logger;

  /**
   * Boolean indicating whether to show the dialog.
   */
  open: boolean;

  /**
   * Callback invoked upon closing the dialog.
   */
  onClose: () => void;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

/**
 * Interface describing component state.
 */
export interface IResetRevertDialogState {
  /**
   * Commit message summary.
   */
  summary: string;

  /**
   * Commit message description.
   */
  description: string;

  /**
   * Boolean indicating whether component buttons should be disabled.
   */
  disabled: boolean;
}

/**
 * React component for rendering a dialog for resetting or reverting a single commit.
 */
export class ResetRevertDialog extends React.Component<
  IResetRevertDialogProps,
  IResetRevertDialogState
> {
  /**
   * Returns a React component for resetting or reverting a single commit.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: IResetRevertDialogProps) {
    super(props);
    this.state = {
      summary: '',
      description: '',
      disabled: false
    };
  }

  /**
   * Renders a dialog.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    const shortCommit = this.props.commit.commit.slice(0, 7);
    const isRevert = this.props.action === 'revert';
    return (
      <Dialog
        classes={{
          paper: resetRevertDialogClass
        }}
        open={this.props.open}
        onClick={this._onClick}
        onClose={this._onClose}
      >
        <div className={titleWrapperClass}>
          <p className={titleClass}>
            {isRevert
              ? this.props.trans.__('Revert Changes')
              : this.props.trans.__('Reset Changes')}
          </p>
          <button className={closeButtonClass}>
            <ClearIcon
              titleAccess={this.props.trans.__('Close this dialog')}
              fontSize="small"
              onClick={this._onClose}
            />
          </button>
        </div>
        <div className={contentWrapperClass}>
          <p>
            {isRevert
              ? this.props.trans.__(
                  "These changes will be reverted. Only commit if you're sure you're okay losing these changes."
                )
              : this.props.trans.__(
                  'All changes after commit %1 will be gone forever (hard reset). Are you sure?',
                  shortCommit
                )}
          </p>
          {isRevert ? (
            <div className={commitFormClass}>
              <input
                className={commitSummaryClass}
                type="text"
                placeholder={this._defaultSummary()}
                title={this.props.trans.__(
                  'Enter a commit message summary (a single line, preferably less than 50 characters)'
                )}
                value={this.state.summary}
                onChange={this._onSummaryChange}
              />
              <TextareaAutosize
                className={commitDescriptionClass}
                minRows={5}
                placeholder={this._defaultDescription()}
                title={this.props.trans.__(
                  'Enter a commit message description'
                )}
                value={this.state.description}
                onChange={this._onDescriptionChange}
              />
            </div>
          ) : null}
        </div>
        <DialogActions className={actionsWrapperClass}>
          <input
            disabled={this.state.disabled}
            className={classes(buttonClass, cancelButtonClass)}
            type="button"
            title={this.props.trans.__('Cancel changes')}
            value="Cancel"
            onClick={this._onClose}
          />
          <input
            disabled={this.state.disabled}
            className={classes(buttonClass, submitButtonClass)}
            type="button"
            title={this.props.trans.__('Submit changes')}
            value="Submit"
            onClick={this._onSubmit}
          />
        </DialogActions>
      </Dialog>
    );
  }

  /**
   * Callback invoked upon updating a commit message summary.
   *
   * @param event - event object
   */
  private _onSummaryChange = (event: any): void => {
    this.setState({
      summary: event.target.value
    });
  };

  /**
   * Callback invoked upon updating a commit message description.
   *
   * @param event - event object
   */
  private _onDescriptionChange = (event: any): void => {
    this.setState({
      description: event.target.value
    });
  };

  /**
   * Callback invoked upon clicking on a dialog.
   *
   * @param event - event object
   */
  private _onClick = (event: any): void => {
    event.stopPropagation();
  };

  /**
   * Callback invoked upon closing the dialog.
   *
   * @param event - event object
   */
  private _onClose = (event: any): void => {
    event.stopPropagation();
    this.props.onClose();
    this._reset();
  };

  /**
   * Reset the current branch on the provided commit
   *
   * @param hash Git commit hash
   */
  private async _resetCommit(hash: string): Promise<void> {
    this.props.logger.log({
      level: Level.RUNNING,
      message: this.props.trans.__('Discarding changes...')
    });
    try {
      await this.props.model.resetToCommit(hash);
      this.props.logger.log({
        level: Level.SUCCESS,
        message: this.props.trans.__('Successfully discarded changes.')
      });
    } catch (error) {
      this.props.logger.log({
        level: Level.ERROR,
        message: this.props.trans.__('Failed to discard changes.'),
        error: new Error(
          `Failed to discard changes after ${hash.slice(0, 7)}: ${error}`
        )
      });
    }
  }

  /**
   * Revert the provided commit.
   *
   * @param hash Git commit hash
   */
  private async _revertCommit(hash: string): Promise<void> {
    this.props.logger.log({
      level: Level.RUNNING,
      message: this.props.trans.__('Reverting changes...')
    });
    try {
      await this.props.model.revertCommit(this._commitMessage(), hash);
      this.props.logger.log({
        level: Level.SUCCESS,
        message: this.props.trans.__('Successfully reverted changes.')
      });
    } catch (error) {
      this.props.logger.log({
        level: Level.ERROR,
        message: this.props.trans.__('Failed to revert changes.'),
        error: new Error(`Failed to revert ${hash.slice(0, 7)}: ${error}`)
      });
    }
  }

  /**
   * Callback invoked upon clicking a button to reset or revert a commit.
   *
   * @param event - event object
   */
  private _onSubmit = async (): Promise<void> => {
    this.setState({
      disabled: true
    });

    if (this.props.action === 'reset') {
      this._resetCommit(this.props.commit.commit);
    } else {
      this._revertCommit(this.props.commit.commit);
    }
    this._reset();
    this.props.onClose();
  };

  /**
   * Returns a default commit summary for reverting a commit.
   *
   * @returns default commit summary
   */
  private _defaultSummary(): string {
    const summary = this.props.commit.commit_msg.split('\n')[0];
    return this.props.trans.__("Revert '%1'", summary);
  }

  /**
   * Returns a default commit description for reverting a commit.
   *
   * @returns default commit description
   */
  private _defaultDescription(): string {
    return this.props.trans.__(
      'This reverts commit %1',
      this.props.commit.commit
    );
  }

  /**
   * Returns a commit message for reverting a commit.
   *
   * @returns commit message
   */
  private _commitMessage(): string {
    const summary = this.state.summary || this._defaultSummary();
    const desc = this.state.description || this._defaultDescription();
    return summary + '\n\n' + desc + '\n';
  }

  /**
   * Resets component state.
   */
  private _reset(): void {
    this.setState({
      summary: '',
      description: '',
      disabled: false
    });
  }
}
