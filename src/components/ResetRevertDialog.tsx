import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { classes } from 'typestyle';
import { showErrorMessage } from '@jupyterlab/apputils';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import ClearIcon from '@material-ui/icons/Clear';
import { sleep } from '../utils';
import { Git, IGitExtension, ILogMessage } from '../tokens';
import {
  actionsWrapperClass,
  commitFormClass,
  commitSummaryClass,
  commitDescriptionClass,
  buttonClass,
  cancelButtonClass,
  closeButtonClass,
  contentWrapperClass,
  resetRevertDialogClass,
  submitButtonClass,
  titleClass,
  titleWrapperClass
} from '../style/ResetRevertDialog';
import { SuspendModal } from './SuspendModal';
import { Alert } from './Alert';

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
   * Boolean indicating whether to show the dialog.
   */
  open: boolean;

  /**
   * Boolean indicating whether to enable UI suspension.
   */
  suspend: boolean;

  /**
   * Callback invoked upon closing the dialog.
   */
  onClose: () => void;
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

  /**
   * Boolean indicating whether UI interaction should be suspended (e.g., due to pending command).
   */
  suspend: boolean;

  /**
   * Boolean indicating whether to show an alert.
   */
  alert: boolean;

  /**
   * Log message.
   */
  log: ILogMessage;
}

/**
 * React component for rendering a dialog for reseting or reverting a single commit.
 */
export class ResetRevertDialog extends React.Component<
  IResetRevertDialogProps,
  IResetRevertDialogState
> {
  /**
   * Returns a React component for reseting or reverting a single commit.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: IResetRevertDialogProps) {
    super(props);
    this.state = {
      summary: '',
      description: '',
      disabled: false,
      suspend: false,
      alert: false,
      log: {
        severity: 'info',
        message: ''
      }
    };
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <React.Fragment>
        {this._renderDialog()}
        {this._renderFeedback()}
      </React.Fragment>
    );
  }

  /**
   * Renders a dialog.
   *
   * @returns React element
   */
  private _renderDialog(): React.ReactElement {
    const shortCommit = this.props.commit.commit.slice(0, 7);
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
            {this.props.action === 'revert'
              ? 'Revert Changes'
              : 'Reset Changes'}
          </p>
          <button className={closeButtonClass}>
            <ClearIcon
              titleAccess="Close this dialog"
              fontSize="small"
              onClick={this._onClose}
            />
          </button>
        </div>
        <div className={contentWrapperClass}>
          <p>
            {this.props.action === 'revert'
              ? "These changes will be reverted. Only commit if you're sure you're okay losing these changes."
              : `All changes after commit ${shortCommit} will be gone forever (hard reset). Are you sure?`}
          </p>
          {this.props.action === 'revert' ? (
            <div className={commitFormClass}>
              <input
                className={commitSummaryClass}
                type="text"
                placeholder={this._defaultSummary()}
                title="Enter a commit message summary (a single line, preferably less than 50 characters)"
                value={this.state.summary}
                onChange={this._onSummaryChange}
              />
              <TextareaAutosize
                className={commitDescriptionClass}
                minRows={5}
                placeholder={this._defaultDescription()}
                title="Enter a commit message description"
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
            title="Cancel changes"
            value="Cancel"
            onClick={this._onClose}
          />
          <input
            disabled={this.state.disabled}
            className={classes(buttonClass, submitButtonClass)}
            type="button"
            title="Submit changes"
            value="Submit"
            onClick={this._onSubmit}
          />
        </DialogActions>
      </Dialog>
    );
  }

  /**
   * Renders a component to provide UI feedback.
   *
   * @returns React element
   */
  private _renderFeedback(): React.ReactElement {
    return (
      <React.Fragment>
        <SuspendModal
          open={this.props.suspend && this.state.suspend}
          onClick={this._onFeedbackModalClick}
        />
        <Alert
          open={this.state.alert}
          message={this.state.log.message}
          severity={this.state.log.severity}
          onClose={this._onFeedbackAlertClose}
        />
      </React.Fragment>
    );
  }

  /**
   * Sets the suspension state.
   *
   * @param bool - boolean indicating whether to suspend UI interaction
   */
  private _suspend(bool: boolean): void {
    if (this.props.suspend) {
      this.setState({
        suspend: bool
      });
    }
  }

  /**
   * Sets the current component log message.
   *
   * @param msg - log message
   */
  private _log(msg: ILogMessage): void {
    this.setState({
      alert: true,
      log: msg
    });
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
   * Callback invoked upon clicking a button to reset or revert a commit.
   *
   * @param event - event object
   */
  private _onSubmit = async (): Promise<void> => {
    const shortCommit = this.props.commit.commit.slice(0, 7);
    let err: Error;

    this.setState({
      disabled: true
    });
    if (this.props.action === 'reset') {
      this._log({
        severity: 'info',
        message: 'Discarding changes...'
      });
      this._suspend(true);
      try {
        await Promise.all([
          sleep(1000),
          this.props.model.resetToCommit(this.props.commit.commit)
        ]);
      } catch (error) {
        err = error;
      }
      this._suspend(false);
      if (err) {
        this._log({
          severity: 'error',
          message: 'Failed to discard changes.'
        });
        showErrorMessage(
          'Error Discarding Changes',
          `Failed to discard changes after ${shortCommit}: ${err}`
        );
      } else {
        this._log({
          severity: 'success',
          message: 'Successfully discarded changes.'
        });
      }
    } else {
      this._log({
        severity: 'info',
        message: 'Reverting changes...'
      });
      this._suspend(true);
      try {
        await Promise.all([
          sleep(1000),
          this.props.model.revertCommit(
            this._commitMessage(),
            this.props.commit.commit
          )
        ]);
      } catch (error) {
        err = error;
      }
      this._suspend(false);
      if (err) {
        this._log({
          severity: 'error',
          message: 'Failed to revert changes.'
        });
        showErrorMessage(
          'Error Reverting Changes',
          `Failed to revert ${shortCommit}: ${err}`
        );
      } else {
        this._log({
          severity: 'success',
          message: 'Successfully reverted changes.'
        });
      }
    }
    this._reset();
    this.props.onClose();
  };

  /**
   * Callback invoked upon clicking on the feedback modal.
   *
   * @param event - event object
   */
  private _onFeedbackModalClick = (): void => {
    this._suspend(false);
  };

  /**
   * Callback invoked upon closing a feedback alert.
   *
   * @param event - event object
   */
  private _onFeedbackAlertClose = (): void => {
    this.setState({
      alert: false
    });
  };

  /**
   * Returns a default commit summary for reverting a commit.
   *
   * @returns default commit summary
   */
  private _defaultSummary(): string {
    const summary = this.props.commit.commit_msg.split('\n')[0];
    return `Revert "${summary}"`;
  }

  /**
   * Returns a default commit description for reverting a commit.
   *
   * @returns default commit description
   */
  private _defaultDescription(): string {
    return `This reverts commit ${this.props.commit.commit}`;
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
