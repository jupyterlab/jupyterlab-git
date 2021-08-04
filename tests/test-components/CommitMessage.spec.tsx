import { nullTranslator } from '@jupyterlab/translation';
import Input from '@material-ui/core/Input';
import { shallow } from 'enzyme';
import 'jest';
import * as React from 'react';
import {
  CommitMessage,
  ICommitMessageProps
} from '../../src/components/CommitMessage';

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
    const component = shallow(<CommitMessage {...props} />);
    const node = component.find(Input).first();
    expect(node.prop('title').length > 0).toEqual(true);
  });

  it('should display placeholder text for the commit message description', () => {
    const props = defaultProps;
    const component = shallow(<CommitMessage {...props} />);
    const node = component.find(Input).last();
    expect(node.prop('placeholder')).toEqual('Description (optional)');
  });

  it('should set a `title` attribute on the input element to provide a commit message description', () => {
    const props = defaultProps;
    const component = shallow(<CommitMessage {...props} />);
    const node = component.find(Input).last();
    expect(node.prop('title').length > 0).toEqual(true);
  });

  it('should disable summary input if disabled is true', () => {
    const props = { ...defaultProps, disabled: true };
    const component = shallow(<CommitMessage {...props} />);
    const node = component.find(Input).first();
    expect(node.prop('disabled')).toEqual(true);
  });

  it('should disable description input if disabled is true', () => {
    const props = { ...defaultProps, disabled: true };
    const component = shallow(<CommitMessage {...props} />);
    const node = component.find(Input).last();
    expect(node.prop('disabled')).toEqual(true);
  });
});
