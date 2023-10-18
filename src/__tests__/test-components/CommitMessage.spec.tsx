/* eslint-disable @typescript-eslint/no-empty-function */
import { nullTranslator } from '@jupyterlab/translation';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import 'jest';
import * as React from 'react';
import {
  CommitMessage,
  ICommitMessageProps
} from '../../components/CommitMessage';

describe('CommitMessage', () => {
  const trans = nullTranslator.load('jupyterlab_git');

  const defaultProps: ICommitMessageProps = {
    setSummary: () => {},
    setDescription: () => {},
    summary: '',
    description: '',
    trans: trans
  };

  it('should set a `title` attribute on the input element to provide a commit message summary', () => {
    const props = defaultProps;
    render(<CommitMessage {...props} />);

    expect(screen.getAllByRole('textbox')[0].parentElement).toHaveAttribute(
      'title'
    );
  });

  it('should display placeholder text for the commit message description', () => {
    const props = defaultProps;
    render(<CommitMessage {...props} />);

    expect(screen.getAllByRole('textbox')[1]).toHaveAttribute(
      'placeholder',
      'Description (optional)'
    );
  });

  it('should set a `title` attribute on the input element to provide a commit message description', () => {
    const props = defaultProps;
    render(<CommitMessage {...props} />);

    expect(screen.getAllByRole('textbox')[1].parentElement).toHaveAttribute(
      'title'
    );
  });

  it('should disable summary input if disabled is true', () => {
    const props = { ...defaultProps, disabled: true };
    render(<CommitMessage {...props} />);

    expect(screen.getAllByRole('textbox')[0]).toHaveAttribute('disabled');
  });

  it('should disable description input if disabled is true', () => {
    const props = { ...defaultProps, disabled: true };
    render(<CommitMessage {...props} />);

    expect(screen.getAllByRole('textbox')[1]).toHaveAttribute('disabled');
  });
});
