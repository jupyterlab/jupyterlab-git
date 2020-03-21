import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { classes } from 'typestyle';
import { showErrorMessage } from '@jupyterlab/apputils';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import ClearIcon from '@material-ui/icons/Clear';
import { Git, IGitExtension } from '../tokens';
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
      disabled: false
    };
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    const shortCommit = this.props.commit.commit.slice(0, 7);
    return (
      <Dialog
        classes={{
          paper: resetRevertDialogClass
        }}
        open={this.props.open}
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
   * Callback invoked upon closing the dialog.
   *
   * @param event - event object
   */
  private _onClose = (event: any): void => {
    event.stopPropagation();
    this.setState({
      summary: '',
      description: '',
      disabled: true
    });
    this.props.onClose();
  };

  /**
   * Callback invoked upon clicking a button to reset or revert a commit.
   *
   * @param event - event object
   */
  private _onSubmit = async (): Promise<void> => {
    const shortCommit = this.props.commit.commit.slice(0, 7);
    this.setState({
      disabled: true
    });
    if (this.props.action === 'reset') {
      try {
        await this.props.model.resetToCommit(this.props.commit.commit);
      } catch (err) {
        showErrorMessage(
          'Error Removing Changes',
          `Failed to discard changes after ${shortCommit}: ${err}`
        );
      }
    } else {
      try {
        await this.props.model.revertCommit(
          this._commitMessage(),
          this.props.commit.commit
        );
      } catch (err) {
        showErrorMessage(
          'Error Reverting Changes',
          `Failed to revert ${shortCommit}: ${err}`
        );
      }
    }
    this.props.onClose();
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
}
