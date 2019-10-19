import * as React from 'react';
import { classes } from 'typestyle';
import {
  buttonStyle,
  cancelNewBranchButtonStyle,
  newBranchBoxStyle,
  newBranchButtonStyle,
  newBranchInputAreaStyle
} from '../style/NewBranchBoxStyle';

export interface ICommitBoxProps {
  createNewBranch: (branchName: string) => Promise<void>;
  toggleNewBranchBox: () => void;
}

export interface ICommitBoxState {
  value: string;
}

export class NewBranchBox extends React.Component<
  ICommitBoxProps,
  ICommitBoxState
> {
  constructor(props: ICommitBoxProps) {
    super(props);
    this.state = {
      value: ''
    };
  }

  /** Prevent enter key triggered 'submit' action during input */
  onKeyPress(event: any): void {
    if (event.which === 13) {
      event.preventDefault();
      this.setState({ value: this.state.value + '\n' });
    }
  }

  /** Handle input inside commit message box */
  handleChange = (event: any): void => {
    this.setState({
      value: event.target.value
    });
  };

  render() {
    return (
      <div
        className={newBranchInputAreaStyle}
        onKeyPress={event => this.onKeyPress(event)}
      >
        <input
          className={newBranchBoxStyle}
          placeholder={'New branch'}
          value={this.state.value}
          onChange={this.handleChange}
          autoFocus
        />
        <input
          className={classes(buttonStyle, newBranchButtonStyle)}
          type="button"
          title="Create New"
          onClick={() => this.props.createNewBranch(this.state.value)}
        />
        <input
          className={classes(buttonStyle, cancelNewBranchButtonStyle)}
          type="button"
          title="Cancel"
          onClick={() => this.props.toggleNewBranchBox()}
        />
      </div>
    );
  }
}
