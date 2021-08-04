import { TranslationBundle } from '@jupyterlab/translation';
import Input from '@material-ui/core/Input';
import * as React from 'react';
import {
  activeStyle,
  commitDescriptionClass,
  commitRoot,
  commitSummaryClass,
  disabledStyle
} from '../style/CommitBox';

/**
 * CommitMessage properties
 */
export interface ICommitMessageProps {
  /**
   * Commit message description.
   */
  description: string;

  /**
   * Commit message description placeholder.
   */
  descriptionPlaceholder?: string;

  /**
   * Whether the commit message can be edited or not.
   */
  disabled?: boolean;

  /**
   * Updates the commit message summary.
   *
   * @param summary - commit message summary
   */
  setSummary: (summary: string) => void;

  /**
   * Updates the commit message description.
   *
   * @param description - commit message description
   */
  setDescription: (description: string) => void;

  /**
   * Commit message summary.
   */
  summary: string;

  /**
   * Commit message summary placeholder.
   */
  summaryPlaceholder?: string;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

/**
 * Commit message component
 */
export function CommitMessage(props: ICommitMessageProps): JSX.Element {
  const summaryPlaceholder =
    props.summaryPlaceholder ?? props.trans.__('Summary');

  /**
   * Callback invoked upon updating a commit message description.
   *
   * @param event - event object
   */
  function onDescriptionChange(event: any): void {
    props.setDescription(event.target.value);
  }

  /**
   * Callback invoked upon updating a commit message summary.
   *
   * @param event - event object
   */
  function onSummaryChange(event: any): void {
    props.setSummary(event.target.value);
  }

  /**
   * Callback invoked upon a `'keypress'` event when entering a commit message summary.
   *
   * ## Notes
   *
   * -   Prevents triggering a `'submit'` action when hitting the `ENTER` key while entering a commit message summary.
   *
   * @param event - event object
   */
  function onSummaryKeyPress(event: React.KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }

  return (
    <React.Fragment>
      <Input
        className={commitSummaryClass}
        classes={{
          root: commitRoot,
          focused: activeStyle,
          disabled: disabledStyle
        }}
        type="text"
        placeholder={summaryPlaceholder}
        title={
          props.disabled
            ? props.trans.__(
                'Amending the commit will re-use the previous commit summary'
              )
            : props.trans.__(
                'Enter a commit message summary (a single line, preferably less than 50 characters)'
              )
        }
        value={props.summary}
        onChange={onSummaryChange}
        onKeyPress={onSummaryKeyPress}
        disabled={props.disabled ?? false}
        disableUnderline={true}
        fullWidth={true}
      />
      <Input
        className={commitDescriptionClass}
        classes={{
          root: commitRoot,
          focused: activeStyle,
          disabled: disabledStyle
        }}
        multiline
        minRows={5}
        maxRows={10}
        placeholder={
          props.descriptionPlaceholder ??
          props.trans.__('Description (optional)')
        }
        title={
          props.disabled
            ? props.trans.__(
                'Amending the commit will re-use the previous commit summary'
              )
            : props.trans.__('Enter a commit message description')
        }
        value={props.description}
        onChange={onDescriptionChange}
        disabled={props.disabled ?? false}
        disableUnderline={true}
        fullWidth={true}
      />
    </React.Fragment>
  );
}
