import { nullTranslator } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { shallow } from 'enzyme';
import 'jest';
import * as React from 'react';
import { CommitBox } from '../../src/components/CommitBox';
import { CommandIDs } from '../../src/tokens';

describe('CommitBox', () => {
  const defaultCommands = new CommandRegistry();
  defaultCommands.addKeyBinding({
    keys: ['Accel Enter'],
    command: CommandIDs.gitSubmitCommand,
    selector: '.jp-git-CommitBox'
  });

  const trans = nullTranslator.load('jupyterlab-git');

  describe('#constructor()', () => {
    it('should return a new instance', () => {
      const box = new CommitBox({
        onCommit: async () => {},
        hasFiles: false,
        commands: defaultCommands,
        trans: trans,
        label: 'Commit'
      });
      expect(box).toBeInstanceOf(CommitBox);
    });

    it('should set the default commit message summary to an empty string', () => {
      const box = new CommitBox({
        onCommit: async () => {},
        hasFiles: false,
        commands: defaultCommands,
        trans: trans,
        label: 'Commit'
      });
      expect(box.state.summary).toEqual('');
    });

    it('should set the default commit message description to an empty string', () => {
      const box = new CommitBox({
        onCommit: async () => {},
        hasFiles: false,
        commands: defaultCommands,
        trans: trans,
        label: 'Commit'
      });
      expect(box.state.description).toEqual('');
    });
  });

  describe('#render()', () => {
    it('should display placeholder text for the commit message summary', () => {
      const props = {
        onCommit: async () => {},
        hasFiles: false,
        commands: defaultCommands,
        trans: trans,
        label: 'Commit'
      };
      const component = shallow(<CommitBox {...props} />);
      const node = component.find('input[type="text"]').first();
      expect(node.prop('placeholder')).toEqual(
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
        onCommit: async () => {},
        hasFiles: false,
        commands: adjustedCommands,
        trans: trans,
        label: 'Commit'
      };
      const component = shallow(<CommitBox {...props} />);
      const node = component.find('input[type="text"]').first();
      expect(node.prop('placeholder')).toEqual(
        'Summary (Shift+Enter to commit)'
      );
    });

    it('should set a `title` attribute on the input element to provide a commit message summary', () => {
      const props = {
        onCommit: async () => {},
        hasFiles: false,
        commands: defaultCommands,
        trans: trans,
        label: 'Commit'
      };
      const component = shallow(<CommitBox {...props} />);
      const node = component.find('input[type="text"]').first();
      expect(node.prop('title').length > 0).toEqual(true);
    });

    it('should display placeholder text for the commit message description', () => {
      const props = {
        onCommit: async () => {},
        hasFiles: false,
        commands: defaultCommands,
        trans: trans,
        label: 'Commit'
      };
      const component = shallow(<CommitBox {...props} />);
      const node = component.find('TextareaAutosize').first();
      expect(node.prop('placeholder')).toEqual('Description (optional)');
    });

    it('should set a `title` attribute on the input element to provide a commit message description', () => {
      const props = {
        onCommit: async () => {},
        hasFiles: false,
        commands: defaultCommands,
        trans: trans,
        label: 'Commit'
      };
      const component = shallow(<CommitBox {...props} />);
      const node = component.find('TextareaAutosize').first();
      expect(node.prop('title').length > 0).toEqual(true);
    });

    it('should display a button to commit changes', () => {
      const props = {
        onCommit: async () => {},
        hasFiles: false,
        commands: defaultCommands,
        trans: trans,
        label: 'Commit'
      };
      const component = shallow(<CommitBox {...props} />);
      const node = component.find('input[type="button"]').first();
      expect(node.prop('value')).toEqual('Commit');
    });

    it('should set a `title` attribute on the button to commit changes', () => {
      const props = {
        onCommit: async () => {},
        hasFiles: false,
        commands: defaultCommands,
        trans: trans,
        label: 'Commit'
      };
      const component = shallow(<CommitBox {...props} />);
      const node = component.find('input[type="button"]').first();
      expect(node.prop('title').length > 0).toEqual(true);
    });

    it('should apply a class to disable the commit button when no files have changes to commit', () => {
      const props = {
        onCommit: async () => {},
        hasFiles: false,
        commands: defaultCommands,
        trans: trans,
        label: 'Commit'
      };
      const component = shallow(<CommitBox {...props} />);
      const node = component.find('input[type="button"]').first();
      const prop = node.prop('disabled');
      expect(prop).toEqual(true);
    });

    it('should apply a class to disable the commit button when files have changes to commit, but the user has not entered a commit message summary', () => {
      const props = {
        onCommit: async () => {},
        hasFiles: true,
        commands: defaultCommands,
        trans: trans,
        label: 'Commit'
      };
      const component = shallow(<CommitBox {...props} />);
      const node = component.find('input[type="button"]').first();
      const prop = node.prop('disabled');
      expect(prop).toEqual(true);
    });

    it('should not apply a class to disable the commit button when files have changes to commit and the user has entered a commit message summary', () => {
      const props = {
        onCommit: async () => {},
        hasFiles: true,
        commands: defaultCommands,
        trans: trans,
        label: 'Commit'
      };
      const component = shallow(<CommitBox {...props} />);
      component.setState({
        summary: 'beep boop'
      });

      const node = component.find('input[type="button"]').first();
      const prop = node.prop('disabled');
      expect(prop).toEqual(false);
    });
  });
});
