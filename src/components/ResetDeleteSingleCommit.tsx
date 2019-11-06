import * as React from 'react';
import { classes } from 'typestyle';
import {
  button,
  cancelButton,
  messageInput,
  resetDeleteButton,
  resetDeleteDisabledButton,
  warningLabel
} from '../style/SinglePastCommitInfoStyle';
import { IGitExtension } from '../tokens';

export interface IResetDeleteProps {
  action: 'reset' | 'delete';
  commitId: string;
  model: IGitExtension;
  onCancel: () => void;
}

export interface IResetDeleteState {
  message: string;
  resetDeleteDisabled: boolean;
}

export class ResetDeleteSingleCommit extends React.Component<
  IResetDeleteProps,
  IResetDeleteState
> {
  constructor(props: IResetDeleteProps) {
    super(props);
    this.state = {
      message: '',
      resetDeleteDisabled: true
    };
  }

  onCancel = () => {
    this.setState({
      message: '',
      resetDeleteDisabled: true
    });
    this.props.onCancel();
  };

  updateMessage = (value: string) => {
    this.setState({
      message: value,
      resetDeleteDisabled: value === ''
    });
  };

  handleResetDelete = async () => {
    if (this.props.action === 'reset') {
      await this.props.model.resetToCommit(this.props.commitId);
    } else {
      await this.props.model.deleteCommit(
        this.state.message,
        this.props.commitId
      );
    }
    this.props.onCancel();
  };

  render() {
    return (
      <div>
        <div className={warningLabel}>
          {this.props.action === 'delete'
            ? "These changes will be gone forever. Commit if you're sure?"
            : "All changes after this will be gone forever. Commit if you're sure?"}
        </div>
        <input
          type="text"
          className={messageInput}
          onChange={event => this.updateMessage(event.currentTarget.value)}
          placeholder="Add a commit message to make changes"
        />
        <button
          className={classes(button, cancelButton)}
          onClick={this.onCancel}
        >
          Cancel
        </button>
        <button
          className={
            this.state.resetDeleteDisabled
              ? classes(button, resetDeleteDisabledButton)
              : classes(button, resetDeleteButton)
          }
          disabled={this.state.resetDeleteDisabled}
          onClick={this.handleResetDelete}
        >
          {this.props.action === 'delete'
            ? 'Delete these changes'
            : 'Revert to this commit'}
        </button>
      </div>
    );
  }
}
