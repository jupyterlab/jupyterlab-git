import * as React from 'react';

import { classes } from 'typestyle';

import {
  WarningLabel,
  MessageInput,
  Button,
  ResetDeleteButton,
  CancelButton,
  ResetDeleteDisabledButton
} from '../components_style/SinglePastCommitInfoStyle';

import { Git } from '../git';

export interface IResetDeleteProps {
  action: 'reset' | 'delete';
  commitId: string;
  path: string;
  onCancel: Function;
  refresh: Function;
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

  handleResetDelete = () => {
    let gitApi = new Git();
    if (this.props.action === 'reset') {
      gitApi
        .resetToCommit(this.state.message, this.props.path, this.props.commitId)
        .then(response => {
          this.props.refresh();
        });
    } else {
      gitApi
        .deleteCommit(this.state.message, this.props.path, this.props.commitId)
        .then(response => {
          this.props.refresh();
        });
    }
    this.props.onCancel();
  };

  render() {
    return (
      <div>
        <div className={WarningLabel}>
          {this.props.action === 'delete'
            ? "These changes will be gone forever. Commit if you're sure?"
            : "All changes after this will be gone forever. Commit if you're sure?"}
        </div>
        <input
          type="text"
          className={MessageInput}
          onChange={event => this.updateMessage(event.currentTarget.value)}
          placeholder="Add a commit message to make changes"
        />
        <button
          className={classes(Button, CancelButton)}
          onClick={this.onCancel}
        >
          Cancel
        </button>
        <button
          className={
            this.state.resetDeleteDisabled
              ? classes(Button, ResetDeleteDisabledButton)
              : classes(Button, ResetDeleteButton)
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
