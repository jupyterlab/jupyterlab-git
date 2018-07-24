import * as React from "react";

import {
  textInputStyle,
  stagedCommitButtonStyle,
  stagedCommitButtonDisabledStyle,
  stagedCommitStyle,
  stagedCommitMessageStyle
} from "../components_style/BranchHeaderStyle";

import { classes } from "typestyle";

export interface ICommitBoxProps {
  createNewBranch: Function;
}

export interface ICommitBoxState {
  value: string;
}

export class NewBranchBox extends React.Component<
  ICommitBoxProps,
  ICommitBoxState
> {
  constructor(props) {
    super(props);
    this.state = {
      value: ""
    };
  }

  /** Prevent enter key triggered 'submit' action during input */
  onKeyPress(event): void {
    if (event.which === 13) {
      event.preventDefault();
      this.setState({ value: this.state.value + "\n" });
    }
  }

  /** Handle input inside commit message box */
  handleChange = (event: any): void => {
    this.setState({
      value: event.target.value
    });
  };

  /** Update state of input box */
  checkReadyForSubmit() {
    return this.state.value.length === 0
      ? classes(stagedCommitButtonStyle, stagedCommitButtonDisabledStyle)
      : classes(stagedCommitButtonStyle, stagedCommitButtonStyle);
  }

  render() {
    return (
      <form
        className={stagedCommitStyle}
        onKeyPress={event => this.onKeyPress(event)}
      >
        <textarea
          className={classes(textInputStyle, stagedCommitMessageStyle)}
          placeholder={"Name your new branch"}
          value={this.state.value}
          onChange={this.handleChange}
        />
        <input
          className={this.checkReadyForSubmit()}
          type="button"
          title="Create New"
          disabled={this.state.value.length === 0}
          onClick={() => this.props.createNewBranch(this.state.value)}
        />
      </form>
    );
  }
}
