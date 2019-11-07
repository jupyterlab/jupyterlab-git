import * as React from 'react';
import { classes } from 'typestyle';
import {
  stagedCommitButtonDisabledStyle,
  stagedCommitButtonReadyStyle,
  stagedCommitButtonStyle,
  stagedCommitMessageStyle,
  stagedCommitStyle,
  textInputStyle
} from '../style/BranchHeaderStyle';

export interface ICommitBoxProps {
  hasFiles: boolean;
  commitFunc: (message: string) => Promise<void>;
}

export interface ICommitBoxState {
  /**
   * Commit message
   */
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
    this.setState({
      value: event.target.value
    });
  };

  /** Update state of commit message input box */
  checkReadyForSubmit = (hasStagedFiles: boolean) => {
    if (hasStagedFiles) {
      if (this.state.value.length === 0) {
        return classes(stagedCommitButtonStyle, stagedCommitButtonReadyStyle);
      } else {
        return stagedCommitButtonStyle;
      }
    } else {
      return classes(stagedCommitButtonStyle, stagedCommitButtonDisabledStyle);
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
          disabled={!this.props.hasFiles}
          placeholder={
            this.props.hasFiles
              ? 'Input message to commit staged changes'
              : 'Stage your changes before commit'
          }
          value={this.state.value}
          onChange={this.handleChange}
        />
        <input
          className={this.checkReadyForSubmit(this.props.hasFiles)}
          type="button"
          title="Commit"
          disabled={!(this.props.hasFiles && this.state.value)}
          onClick={() => {
            this.props.commitFunc(this.state.value);
            this.initializeInput();
          }}
        />
      </form>
    );
  }
}
