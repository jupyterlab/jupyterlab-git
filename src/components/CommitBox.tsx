import * as React from 'react';

import {
  textInputStyle,
  stagedCommitStyle,
  stagedCommitMessageStyle
} from '../components_style/BranchHeaderStyle';

import { classes } from 'typestyle';

export interface ICommitBoxProps {
  checkReadyForSubmit: Function;
  stagedFiles: any;
  commitAllStagedFiles: Function;
  topRepoPath: string;
  refresh: Function;
}

export interface ICommitBoxState {
  value: string;
  disableSubmit: boolean;
}

export class CommitBox extends React.Component<
  ICommitBoxProps,
  ICommitBoxState
> {
  constructor(props : ICommitBoxProps) {
    super(props);
    this.state = {
      value: '',
      disableSubmit: true
    };
  }

  /** Prevent enter key triggered 'submit' action during commit message input */
  onKeyPress(event : any): void {
    if (event.which === 13) {
      event.preventDefault();
      this.setState({ value: this.state.value + '\n' });
    }
  }

  /** Initalize commit message input box */
  initializeInput = (): void => {
    this.setState({
      value: '',
      disableSubmit: true
    });
  };

  /** Handle input inside commit message box */
  handleChange = (event: any): void => {
    if (event.target.value && event.target.value !== '') {
      this.setState({
        value: event.target.value,
        disableSubmit: false
      });
    } else {
      this.setState({
        value: event.target.value,
        disableSubmit: true
      });
    }
  };

  render() {
    return (
      <form
        className={stagedCommitStyle}
        onKeyPress={event => this.onKeyPress(event)}
      >
        <textarea
          className={classes(textInputStyle, stagedCommitMessageStyle)}
          disabled={this.props.stagedFiles.length === 0}
          placeholder={
            this.props.stagedFiles.length === 0
              ? 'Stage your changes before commit'
              : 'Input message to commit staged changes'
          }
          value={this.state.value}
          onChange={this.handleChange}
        />
        <input
          className={this.props.checkReadyForSubmit(
            this.state.disableSubmit,
            this.props.stagedFiles.length
          )}
          type='button'
          title='Commit'
          disabled={this.state.disableSubmit}
          onClick={() => {
            this.props.commitAllStagedFiles(
              this.state.value,
              this.props.topRepoPath,
              this.props.refresh
            ),
              this.initializeInput();
          }}
        />
      </form>
    );
  }
}
