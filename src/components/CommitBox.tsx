import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import {
  commitFormClass,
  commitSummaryClass,
  commitDescriptionClass,
  commitButtonClass
} from '../style/CommitBox';

/**
 * Interface describing component properties.
 */
export interface ICommitBoxProps {
  /**
   * Boolean indicating whether files currently exist which have changes to commit.
   */
  hasFiles: boolean;

  /**
   * Callback to invoke in order to commit changes.
   *
   * @param msg - commit message
   * @returns a promise which commits changes
   */
  onCommit: (msg: string) => Promise<void>;
}

/**
 * Interface describing component state.
 */
export interface ICommitBoxState {
  /**
   * Commit message summary.
   */
  summary: string;

  /**
   * Commit message description.
   */
  description: string;
}

/**
 * React component for entering a commit message.
 */
export class CommitBox extends React.Component<
  ICommitBoxProps,
  ICommitBoxState
> {
  /**
   * Returns a React component for entering a commit message.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: ICommitBoxProps) {
    super(props);
    this.state = {
      summary: '',
      description: ''
    };
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    const disabled = !(this.props.hasFiles && this.state.summary);
    return (
      <form className={commitFormClass}>
        <input
          className={commitSummaryClass}
          type="text"
          placeholder="Summary (required)"
          title="Enter a commit message summary (a single line, preferably less than 50 characters)"
          value={this.state.summary}
          onChange={this._onSummaryChange}
          onKeyPress={this._onSummaryKeyPress}
        />
        <TextareaAutosize
          className={commitDescriptionClass}
          minRows={5}
          placeholder="Description"
          title="Enter a commit message description"
          value={this.state.description}
          onChange={this._onDescriptionChange}
        />
        <input
          className={commitButtonClass}
          type="button"
          title="Commit"
          value="Commit"
          disabled={disabled}
          onClick={this._onCommitClick}
        />
      </form>
    );
  }

  /**
   * Callback invoked upon clicking a commit message submit button.
   *
   * @param event - event object
   */
  private _onCommitClick = (): void => {
    const msg = this.state.summary + '\n\n' + this.state.description + '\n';
    this.props.onCommit(msg);

    // NOTE: we assume here that committing changes always works and we can safely clear component state
    this._reset();
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
   * Callback invoked upon a `'keypress'` event when entering a commit message summary.
   *
   * ## Notes
   *
   * -   Prevents triggering a `'submit'` action when hitting the `ENTER` key while entering a commit message summary.
   *
   * @param event - event object
   */
  private _onSummaryKeyPress(event: any): void {
    if (event.which === 13) {
      event.preventDefault();
    }
  }

  /**
   * Resets component state (e.g., in order to re-initialize the commit message input box).
   */
  private _reset(): void {
    this.setState({
      summary: '',
      description: ''
    });
  }
}
