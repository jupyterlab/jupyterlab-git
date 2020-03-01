import * as React from 'react';
import { classes } from 'typestyle';
import TextareaAutosize from 'react-textarea-autosize';
import { showErrorMessage } from '@jupyterlab/apputils';
import {
  button,
  cancelButton,
  messageInput,
  resetDeleteButton,
  warningLabel
} from '../style/SinglePastCommitInfoStyle';
import { commitDescriptionClass } from '../style/CommitBox';
import { Git, IGitExtension } from '../tokens';

/**
 * Interface describing component properties.
 */
export interface IResetRevertCommitProps {
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
   * Callback invoked upon performing an action to "close" the component.
   */
  onClose: () => void;
}

/**
 * Interface describing component state.
 */
export interface IResetRevertCommitState {
  /**
   * Commit message.
   */
  message: string;

  /**
   * Boolean indicating whether component buttons should be disabled.
   */
  disabled: boolean;
}

/**
 * React component for reseting or reverting a single commit.
 */
export class ResetRevertCommit extends React.Component<
  IResetRevertCommitProps,
  IResetRevertCommitState
> {
  /**
   * Returns a React component for reseting or reverting a single commit.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: IResetRevertCommitProps) {
    super(props);
    this.state = {
      message: '',
      disabled: false
    };
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <div>
        <div className={warningLabel}>
          {this.props.action === 'revert'
            ? "These changes will be reverted. Only commit if you're sure you're okay losing these changes."
            : 'All changes after this commit will be gone forever (hard reset). Are you sure?'}
        </div>
        {this.props.action === 'revert' ? (
          <TextareaAutosize
            disabled={this.state.disabled}
            className={classes(commitDescriptionClass, messageInput)}
            minRows={3}
            title="Enter a commit message"
            onChange={this._onMessageChange}
            placeholder={this._defaultMessage()}
          />
        ) : null}
        <button
          disabled={this.state.disabled}
          className={classes(button, cancelButton)}
          title="Cancel changes"
          onClick={this._onCancelClick}
        >
          Cancel
        </button>
        <button
          disabled={this.state.disabled}
          className={classes(button, resetDeleteButton)}
          title="Submit changes"
          onClick={this._onSubmitClick}
        >
          {this.props.action === 'revert'
            ? 'Revert this commit'
            : 'Discard changes after this commit'}
        </button>
      </div>
    );
  }

  /**
   * Callback invoked upon updating a commit message.
   *
   * @param event - event object
   */
  private _onMessageChange = (event: any): void => {
    this.setState({
      message: event.target.value
    });
  };

  /**
   * Callback invoked upon clicking a "cancel" button.
   *
   * @param event - event object
   */
  private _onCancelClick = (): void => {
    this.setState({
      message: '',
      disabled: true
    });
    this.props.onClose();
  };

  /**
   * Callback invoked upon clicking a button to reset or delete a commit.
   *
   * @param event - event object
   */
  private _onSubmitClick = async (): Promise<void> => {
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
          this.state.message || this._defaultMessage(),
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
   * Returns a default commit message for reverting a commit.
   *
   * @returns default commit message
   */
  private _defaultMessage(): string {
    const summary = this.props.commit.commit_msg.split('\n')[0];
    return `Revert "${summary}"\n\nThis reverts commit ${
      this.props.commit.commit
    }`;
  }
}
