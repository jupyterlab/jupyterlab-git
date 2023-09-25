import { mount, shallow } from 'enzyme';
import 'jest';
import * as React from 'react';
import { TagMenu, ITagMenuProps } from '../../components/TagMenu';
import * as git from '../../git';
import { Logger } from '../../logger';
import { GitExtension } from '../../model';
import { IGitExtension } from '../../tokens';
import { listItemClass } from '../../style/BranchMenu';
import {
  mockedRequestAPI,
  defaultMockedResponses,
  DEFAULT_REPOSITORY_PATH
} from '../utils';
import ClearIcon from '@material-ui/icons/Clear';
import { nullTranslator } from '@jupyterlab/translation';

jest.mock('../../git');
jest.mock('@jupyterlab/apputils');

const TAGS = [
  {
    name: '1.0.0'
  },
  {
    name: 'feature-1'
  },
  {
    name: 'feature-2'
  },
  {
    name: 'patch-007'
  }
];

async function createModel() {
  const model = new GitExtension();
  model.pathRepository = DEFAULT_REPOSITORY_PATH;

  await model.ready;
  return model;
}

describe('TagMenu', () => {
  let model: GitExtension;
  const trans = nullTranslator.load('jupyterlab_git');

  beforeEach(async () => {
    jest.restoreAllMocks();

    const mock = git as jest.Mocked<typeof git>;
    mock.requestAPI.mockImplementation(
      mockedRequestAPI({
        responses: {
          ...defaultMockedResponses,
          'tags/delete': {
            body: () => {
              return { code: 0 };
            }
          },
          checkout: {
            body: () => {
              return {
                code: 0
              };
            }
          }
        }
      })
    );

    model = await createModel();
  });

  function createProps(props?: Partial<ITagMenuProps>): ITagMenuProps {
    return {
      branching: false,
      pastCommits: [],
      logger: new Logger(),
      model: model as IGitExtension,
      tagsList: TAGS.map(tag => tag.name),
      trans: trans,
      ...props
    };
  }

  describe('constructor', () => {
    it('should return a new instance', () => {
      const menu = shallow(<TagMenu {...createProps()} />);
      expect(menu.instance()).toBeInstanceOf(TagMenu);
    });

    it('should set the default menu filter to an empty string', () => {
      const menu = shallow(<TagMenu {...createProps()} />);
      expect(menu.state('filter')).toEqual('');
    });

    it('should set the default flag indicating whether to show a dialog to create a new tag to `false`', () => {
      const menu = shallow(<TagMenu {...createProps()} />);
      expect(menu.state('tagDialog')).toEqual(false);
    });
  });

  describe('render', () => {
    it('should display placeholder text for the menu filter', () => {
      const component = shallow(<TagMenu {...createProps()} />);
      const node = component.find('input[type="text"]').first();
      expect(node.prop('placeholder')).toEqual('Filter');
    });

    it('should set a `title` attribute on the input element to filter a tag menu', () => {
      const component = shallow(<TagMenu {...createProps()} />);
      const node = component.find('input[type="text"]').first();
      expect(node.prop('title').length > 0).toEqual(true);
    });

    it('should display a button to clear the menu filter once a filter is provided', () => {
      const component = shallow(<TagMenu {...createProps()} />);
      component.setState({
        filter: 'foo'
      });
      const nodes = component.find(ClearIcon);
      expect(nodes.length).toEqual(1);
    });

    it('should set a `title` on the button to clear the menu filter', () => {
      const component = shallow(<TagMenu {...createProps()} />);
      component.setState({
        filter: 'foo'
      });
      const html = component.find(ClearIcon).first().html();
      expect(html.includes('<title>')).toEqual(true);
    });

    it('should display a button to create a new tag', () => {
      const component = shallow(<TagMenu {...createProps()} />);
      const node = component.find('input[type="button"]').first();
      expect(node.prop('value')).toEqual('New Tag');
    });

    it('should set a `title` attribute on the button to create a new tag', () => {
      const component = shallow(<TagMenu {...createProps()} />);
      const node = component.find('input[type="button"]').first();
      expect(node.prop('title').length > 0).toEqual(true);
    });

    it('should not, by default, show a dialog to create a new tag', () => {
      const component = shallow(<TagMenu {...createProps()} />);
      const node = component.find('NewTagDialogBox').first();
      expect(node.prop('open')).toEqual(false);
    });

    it('should show a dialog to create a new tag when the flag indicating whether to show the dialog is `true`', () => {
      const component = shallow(<TagMenu {...createProps()} />);
      component.setState({
        tagDialog: true
      });
      const node = component.find('NewTagDialogBox').first();
      expect(node.prop('open')).toEqual(true);
    });
  });

  describe('switch tag', () => {
    it('should not switch to a specified tag upon clicking its corresponding element when branching is disabled', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkoutTag');

      const component = mount(<TagMenu {...createProps()} />);
      const nodes = component.find(
        `.${listItemClass}[title*="${TAGS[1].name}"]`
      );
      nodes.at(0).simulate('click');

      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });

    it('should switch to a specified tag upon clicking its corresponding element when branching is enabled', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkoutTag');

      const component = mount(
        <TagMenu {...createProps({ branching: true })} />
      );
      const nodes = component.find(
        `.${listItemClass}[title*="${TAGS[1].name}"]`
      );
      nodes.at(0).simulate('click');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(TAGS[1].name);

      spy.mockRestore();
    });
  });

  describe('create tag', () => {
    it('should not allow creating a new tag when branching is disabled', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'setTag');

      const component = shallow(<TagMenu {...createProps()} />);

      const node = component.find('input[type="button"]').first();
      node.simulate('click');

      expect(component.state('tagDialog')).toEqual(false);
      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });

    it('should display a dialog to create a new tag when branching is enabled and the new tag button is clicked', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'setTag');

      const component = shallow(
        <TagMenu {...createProps({ branching: true })} />
      );

      const node = component.find('input[type="button"]').first();
      node.simulate('click');

      expect(component.state('tagDialog')).toEqual(true);
      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });
  });
});
