import * as React from 'react';
import { classes } from 'typestyle';
import {
  button,
  cancelButton,
  messageInput,
  resetDeleteButton,
  warningLabel
} from '../style/SinglePastCommitInfoStyle';
import TextareaAutosize from 'react-textarea-autosize';
import { Git, IGitExtension } from '../tokens';
import { showErrorMessage } from '@jupyterlab/apputils';

export interface IResetDeleteProps {
  action: 'reset' | 'delete';
  commit: Git.ISingleCommitInfo;
  model: IGitExtension;
  onCancel: () => void;
}

export interface IResetDeleteState {
  message: string;
}

export class ResetDeleteSingleCommit extends React.Component<
  IResetDeleteProps,
  IResetDeleteState
> {
  constructor(props: IResetDeleteProps) {
    super(props);
    this.state = {
      message: ''
    };
  }

  onCancel = () => {
    this.setState({
      message: ''
    });
    this.props.onCancel();
  };

  updateMessage = (value: string) => {
    this.setState({
      message: value
    });
  };

  handleResetDelete = async () => {
    try {
      if (this.props.action === 'reset') {
        await this.props.model.resetToCommit(this.props.commit.commit);
      } else {
        await this.props.model.deleteCommit(
          this.state.message || this._defaultRevertMessage(),
          this.props.commit.commit
        );
      }
    } catch (err) {
      const shortCommit = this.props.commit.commit.slice(0, 7);
      if (this.props.action === 'reset') {
        showErrorMessage(
          'Error Removing Changes',
          `Failed to discard changes after ${shortCommit}: ${err}`
        );
      } else {
        showErrorMessage(
          'Error Reverting Changes',
          `Failed to revert ${shortCommit}: ${err}`
        );
      }
    }
    this.props.onCancel();
  };

  render() {
    return (
      <div>
        <div className={warningLabel}>
          {this.props.action === 'delete'
            ? "These changes will be reverted. Commit if you're sure?"
            : 'All changes after this will be gone forever (hard reset). Are you sure?'}
        </div>
        {this.props.action === 'delete' ? (
          <TextareaAutosize
            className={classes('jp-git-diff-commit-description', messageInput)}
            minRows={3}
            title={'Enter commit message'}
            onChange={event => this.updateMessage(event.currentTarget.value)}
            placeholder={this._defaultRevertMessage()}
          />
        ) : null}
        <button
          className={classes(button, cancelButton)}
          onClick={this.onCancel}
        >
          Cancel
        </button>
        <button
          className={classes(button, resetDeleteButton)}
          onClick={this.handleResetDelete}
        >
          {this.props.action === 'delete'
            ? 'Revert this commit'
            : 'Remove changes after this commit'}
        </button>
      </div>
    );
  }

  _defaultRevertMessage() {
    const summary = this.props.commit.commit_msg.split('\n')[0];
    return `Revert "${summary}"\n\nThis reverts commit ${
      this.props.commit.commit
    }`;
  }
}
