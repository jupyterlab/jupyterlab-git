import * as React from 'react';
import 'jest';
import { shallow } from 'enzyme';
import { CommitBox } from '../../src/components/CommitBox';

describe('CommitBox', () => {
  describe('#constructor()', () => {
    it('should return a new instance', () => {
      const box = new CommitBox({
        onCommit: async () => {},
        hasFiles: false
      });
      expect(box).toBeInstanceOf(CommitBox);
    });

    it('should set default commit message values to empty strings', () => {
      const box = new CommitBox({
        onCommit: async () => {},
        hasFiles: false
      });
      expect(box.state.summary).toEqual('');
      expect(box.state.description).toEqual('');
    });
  });

  describe('#render()', () => {
    it('should display placeholder text for the commit message summary', () => {
      const props = {
        onCommit: async () => {},
        hasFiles: false
      };
      const component = shallow(<CommitBox {...props} />);
      const node = component.find('input[type="text"]').first();
      expect(node.prop('placeholder')).toEqual('Summary (required)');
    });

    it('should display placeholder text for the commit message description', () => {
      const props = {
        onCommit: async () => {},
        hasFiles: false
      };
      const component = shallow(<CommitBox {...props} />);
      const node = component.find('TextareaAutosize').first();
      expect(node.prop('placeholder')).toEqual('Description');
    });
  });
});
