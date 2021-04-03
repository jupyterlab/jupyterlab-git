import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import {
  commitButtonClass,
  commitDescriptionClass,
  commitFormClass,
  commitSummaryClass
} from '../style/CommitBox';
import { CommandIDs } from '../tokens';

/**
 * Interface describing component properties.
 */
export interface ICommitBoxProps {
  /**
   * Jupyter App commands registry
   */
  commands: CommandRegistry;

  /**
   * Boolean indicating whether files currently exist which have changes to commit.
   */
  hasFiles: boolean;

  /**
   * Commit button label
   */
  label: string;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;

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

  componentDidMount(): void {
    this.props.commands.commandExecuted.connect(this._handleCommand);
  }

  componentWillUnmount(): void {
    this.props.commands.commandExecuted.disconnect(this._handleCommand);
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    const disabled = !this._canCommit();
    const title = !this.props.hasFiles
      ? this.props.trans.__('Disabled: No files are staged for commit')
      : !this.state.summary
      ? this.props.trans.__('Disabled: No commit message summary')
      : this.props.label;

    const shortcutHint = CommandRegistry.formatKeystroke(
      this._getSubmitKeystroke()
    );
    const summaryPlaceholder = this.props.trans.__(
      'Summary (%1 to commit)',
      shortcutHint
    );
    return (
      <form className={[commitFormClass, 'jp-git-CommitBox'].join(' ')}>
        <input
          className={commitSummaryClass}
          type="text"
          placeholder={summaryPlaceholder}
          title={this.props.trans.__(
            'Enter a commit message summary (a single line, preferably less than 50 characters)'
          )}
          value={this.state.summary}
          onChange={this._onSummaryChange}
          onKeyPress={this._onSummaryKeyPress}
        />
        <TextareaAutosize
          className={commitDescriptionClass}
          minRows={5}
          placeholder={this.props.trans.__('Description (optional)')}
          title={this.props.trans.__('Enter a commit message description')}
          value={this.state.description}
          onChange={this._onDescriptionChange}
        />
        <input
          className={commitButtonClass}
          type="button"
          title={title}
          value={this.props.label}
          disabled={disabled}
          onClick={this._onCommitSubmit}
        />
      </form>
    );
  }

  /**
   * Whether a commit can be performed (files are staged and summary is not empty).
   */
  private _canCommit(): boolean {
    return !!(this.props.hasFiles && this.state.summary);
  }

  /**
   * Get keystroke configured to act as a submit action.
   */
  private _getSubmitKeystroke = (): string => {
    const binding = this.props.commands.keyBindings.find(
      binding => binding.command === CommandIDs.gitSubmitCommand
    );
    return binding.keys.join(' ');
  };

  /**
   * Callback invoked upon clicking a commit message submit button or otherwise submitting the form.
   */
  private _onCommitSubmit = (): void => {
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
  private _onSummaryKeyPress = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  /**
   * Callback invoked upon command execution activated when entering a commit message description.
   *
   * ## Notes
   *
   * -   Triggers the `'submit'` action on appropriate command (and if commit is possible)
   *
   */
  private _handleCommand = (
    _: CommandRegistry,
    commandArgs: CommandRegistry.ICommandExecutedArgs
  ): void => {
    if (commandArgs.id === CommandIDs.gitSubmitCommand && this._canCommit()) {
      this._onCommitSubmit();
    }
  };

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
