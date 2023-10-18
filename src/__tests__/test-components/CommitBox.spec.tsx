/* eslint-disable @typescript-eslint/no-empty-function */
import { nullTranslator } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import 'jest';
import * as React from 'react';
import { CommitBox, ICommitBoxProps } from '../../components/CommitBox';
import { WarningBox } from '../../components/WarningBox';
import { CommandIDs } from '../../tokens';

describe('CommitBox', () => {
  const defaultCommands = new CommandRegistry();
  defaultCommands.addKeyBinding({
    keys: ['Accel Enter'],
    command: CommandIDs.gitSubmitCommand,
    selector: '.jp-git-CommitBox'
  });

  const trans = nullTranslator.load('jupyterlab_git');

  const defaultProps: ICommitBoxProps = {
    onCommit: async () => {},
    setSummary: () => {},
    setDescription: () => {},
    setAmend: () => {},
    summary: '',
    description: '',
    amend: false,
    hasFiles: false,
    commands: defaultCommands,
    trans: trans,
    label: 'Commit'
  };

  describe('#constructor()', () => {
    it('should return a new instance', () => {
      const box = new CommitBox(defaultProps);
      expect(box).toBeInstanceOf(CommitBox);
    });
  });

  describe('#render()', () => {
    it('should display placeholder text for the commit message summary', () => {
      const props = defaultProps;
      render(<CommitBox {...props} />);

      expect(screen.getAllByRole('textbox')[0]).toHaveAttribute(
        'placeholder',
        'Summary (Ctrl+Enter to commit)'
      );
    });

    it('should adjust placeholder text for the commit message summary when keybinding changes', () => {
      const adjustedCommands = new CommandRegistry();
      adjustedCommands.addKeyBinding({
        keys: ['Shift Enter'],
        command: CommandIDs.gitSubmitCommand,
        selector: '.jp-git-CommitBox'
      });
      const props = {
        ...defaultProps,
        commands: adjustedCommands
      };

      render(<CommitBox {...props} />);

      expect(screen.getAllByRole('textbox')[0]).toHaveAttribute(
        'placeholder',
        'Summary (Shift+Enter to commit)'
      );
    });

    it('should display a button to commit changes', () => {
      const props = defaultProps;
      render(<CommitBox {...props} />);

      expect(screen.getAllByRole('button')[0]).toHaveTextContent('Commit');
    });

    it('should set a `title` attribute on the button to commit changes', () => {
      const props = defaultProps;
      render(<CommitBox {...props} />);

      expect(screen.getAllByRole('button')[0]).toHaveAttribute('title');
    });

    it('should apply a class to disable the commit button when no files have changes to commit', () => {
      const props = defaultProps;
      render(<CommitBox {...props} />);

      expect(screen.getAllByRole('button')[0]).toHaveAttribute('disabled');
    });

    it('should apply a class to disable the commit button when files have changes to commit, but the user has not entered a commit message summary', () => {
      const props = {
        ...defaultProps,
        hasFiles: true
      };
      render(<CommitBox {...props} />);

      expect(screen.getAllByRole('button')[0]).toHaveAttribute('disabled');
    });

    it('should not apply a class to disable the commit button when files have changes to commit and the user has entered a commit message summary', () => {
      const props = {
        ...defaultProps,
        summary: 'beep boop',
        hasFiles: true
      };

      render(<CommitBox {...props} />);

      expect(screen.getAllByRole('button')[0]).not.toHaveAttribute('disabled');
    });

    it('should apply a class to disable the commit input fields in amend mode', () => {
      const props = {
        ...defaultProps,
        summary: 'beep boop',
        amend: true
      };

      render(<CommitBox {...props} />);
      expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('should not apply a class to disable the commit button in amend mode', () => {
      const props = {
        ...defaultProps,
        hasFiles: true,
        amend: true
      };
      render(<CommitBox {...props} />);

      expect(screen.getAllByRole('button')[0]).not.toHaveAttribute('disabled');
    });

    it('should render a warning box when there are dirty staged files', () => {
      const props = {
        ...defaultProps,
        warning: (
          <WarningBox title="Warning" content="Warning content."></WarningBox>
        )
      };
      render(<CommitBox {...props} />);

      expect(screen.getByText('Warning content.')).toBeDefined();
    });
  });
});
