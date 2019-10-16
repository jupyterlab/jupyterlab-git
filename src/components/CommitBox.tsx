import { ISettingRegistry } from '@jupyterlab/coreutils';

import * as React from 'react';

import { classes } from 'typestyle';

import {
  stagedCommitButtonStyle,
  stagedCommitButtonReadyStyle,
  stagedCommitButtonDisabledStyle,
  stagedCommitMessageStyle,
  stagedCommitStyle,
  textInputStyle
} from '../style/BranchHeaderStyle';

export interface ICommitBoxProps {
  unstagedFiles: any;
  stagedFiles: any;
  commitAllUnstagedFiles: Function;
  commitAllStagedFiles: Function;
  topRepoPath: string;
  refresh: Function;
  settings: ISettingRegistry.ISettings;
}

export interface ICommitBoxState {
  value: string;
}

export class CommitBox extends React.Component<
  ICommitBoxProps,
  ICommitBoxState
> {
  constructor(props: ICommitBoxProps) {
    super(props);
    this.state = {
      value: ''
    };
  }

  doCommit(message: string, path: string, refresh: Function) {
    if (this.props.settings.composite['simpleStaging']) {
      this.props.commitAllUnstagedFiles(message, path, refresh);
    } else {
      this.props.commitAllStagedFiles(message, path, refresh);
    }
  }

  get fileCount() {
    return this.props.settings.composite['simpleStaging']
      ? this.props.unstagedFiles.length
      : this.props.stagedFiles.length;
  }

  /** Prevent enter key triggered 'submit' action during commit message input */
  onKeyPress(event: any): void {
    if (event.which === 13) {
      event.preventDefault();
      this.setState({ value: this.state.value + '\n' });
    }
  }

  /** Initalize commit message input box */
  initializeInput = (): void => {
    this.setState({
      value: ''
    });
  };

  /** Handle input inside commit message box */
  handleChange = (event: any): void => {
    if (event.target.value) {
      this.setState({
        value: event.target.value
      });
    } else {
      this.setState({
        value: event.target.value
      });
    }
  };

  /** Update state of commit message input box */
  updateCommitBoxState(disable: boolean, numberOfFiles: number) {
    if (disable) {
      if (numberOfFiles === 0) {
        return classes(
          stagedCommitButtonStyle,
          stagedCommitButtonDisabledStyle
        );
      } else {
        return classes(stagedCommitButtonStyle, stagedCommitButtonReadyStyle);
      }
    } else {
      return stagedCommitButtonStyle;
    }
  }

  render() {
    return (
      <form
        className={stagedCommitStyle}
        onKeyPress={event => this.onKeyPress(event)}
      >
        <textarea
          className={classes(textInputStyle, stagedCommitMessageStyle)}
          disabled={this.fileCount === 0}
          placeholder={
            this.fileCount === 0
              ? 'Stage your changes before commit'
              : 'Input message to commit staged changes'
          }
          value={this.fileCount === 0 ? '' : this.state.value}
          onChange={this.handleChange}
        />
        <input
          className={this.updateCommitBoxState(
            this.fileCount === 0 || !this.state.value,
            this.fileCount
          )}
          type="button"
          title="Commit"
          disabled={this.fileCount === 0 || !this.state.value}
          onClick={() => {
            this.doCommit(
              this.state.value,
              this.props.topRepoPath,
              this.props.refresh
            );

            return this.initializeInput();
          }}
        />
      </form>
    );
  }
}
