import { mount, render, shallow } from 'enzyme';
import 'jest';
import * as React from 'react';
import { BranchMenu } from '../../src/components/BranchMenu';
import * as git from '../../src/git';
import { Logger } from '../../src/logger';
import { GitExtension } from '../../src/model';
import { listItemClass } from '../../src/style/BranchMenu';
import { mockedRequestAPI, defaultMockedResponses } from '../utils';

jest.mock('../../src/git');

const BRANCHES = [
  {
    is_current_branch: true,
    is_remote_branch: false,
    name: 'master',
    upstream: '',
    top_commit: '',
    tag: ''
  },
  {
    is_current_branch: true,
    is_remote_branch: false,
    name: 'feature-1',
    upstream: '',
    top_commit: '',
    tag: ''
  },
  {
    is_current_branch: true,
    is_remote_branch: false,
    name: 'feature-2',
    upstream: '',
    top_commit: '',
    tag: ''
  },
  {
    is_current_branch: true,
    is_remote_branch: false,
    name: 'patch-007',
    upstream: '',
    top_commit: '',
    tag: ''
  }
];

async function createModel() {
  const model = new GitExtension('/server/root');

  jest.spyOn(model, 'branches', 'get').mockReturnValue(BRANCHES);
  jest.spyOn(model, 'currentBranch', 'get').mockReturnValue(BRANCHES[0]);
  model.pathRepository = '/path/to/repo';

  await model.ready;
  return model;
}

describe('BranchMenu', () => {
  let model: GitExtension;

  beforeEach(async () => {
    jest.restoreAllMocks();

    const mock = git as jest.Mocked<typeof git>;
    mock.requestAPI.mockImplementation(
      mockedRequestAPI({
        ...defaultMockedResponses,
        checkout: {
          body: () => {
            return {
              code: 0
            };
          }
        }
      })
    );

    model = await createModel();
  });

  describe('constructor', () => {
    it('should return a new instance', () => {
      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const menu = new BranchMenu(props);
      expect(menu).toBeInstanceOf(BranchMenu);
    });

    it('should set the default menu filter to an empty string', () => {
      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const menu = new BranchMenu(props);
      expect(menu.state.filter).toEqual('');
    });

    it('should set the default flag indicating whether to show a dialog to create a new branch to `false`', () => {
      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const menu = new BranchMenu(props);
      expect(menu.state.branchDialog).toEqual(false);
    });
  });

  describe('render', () => {
    it('should display placeholder text for the menu filter', () => {
      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const component = shallow(<BranchMenu {...props} />);
      const node = component.find('input[type="text"]').first();
      expect(node.prop('placeholder')).toEqual('Filter');
    });

    it('should set a `title` attribute on the input element to filter a branch menu', () => {
      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const component = shallow(<BranchMenu {...props} />);
      const node = component.find('input[type="text"]').first();
      expect(node.prop('title').length > 0).toEqual(true);
    });

    it('should display a button to clear the menu filter once a filter is provided', () => {
      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const component = shallow(<BranchMenu {...props} />);
      component.setState({
        filter: 'foo'
      });
      const nodes = component.find('ClearIcon');
      expect(nodes.length).toEqual(1);
    });

    it('should set a `title` on the button to clear the menu filter', () => {
      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const component = shallow(<BranchMenu {...props} />);
      component.setState({
        filter: 'foo'
      });
      const html = component
        .find('ClearIcon')
        .first()
        .html();
      expect(html.includes('<title>')).toEqual(true);
    });

    it('should display a button to create a new branch', () => {
      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const component = shallow(<BranchMenu {...props} />);
      const node = component.find('input[type="button"]').first();
      expect(node.prop('value')).toEqual('New Branch');
    });

    it('should set a `title` attribute on the button to create a new branch', () => {
      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const component = shallow(<BranchMenu {...props} />);
      const node = component.find('input[type="button"]').first();
      expect(node.prop('title').length > 0).toEqual(true);
    });

    it('should display a list of branches', () => {
      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const component = render(<BranchMenu {...props} />);
      const nodes = component.find(`.${listItemClass}`);

      const branches = model.branches;
      expect(nodes.length).toEqual(branches.length);

      // Should contain the branch names...
      for (let i = 0; i < branches.length; i++) {
        expect(
          nodes[i].lastChild.data
        ).toEqual(branches[i].name);
      }
    });

    it('should set a `title` attribute for each displayed branch', () => {
      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const component = render(<BranchMenu {...props} />);
      const nodes = component.find(`.${listItemClass}`);

      const branches = model.branches;
      expect(nodes.length).toEqual(branches.length);

      for (let i = 0; i < branches.length; i++) {
        expect(nodes[i].attribs['title'].length).toBeGreaterThan(0);
      }
    });

    it('should not, by default, show a dialog to create a new branch', () => {
      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const component = shallow(<BranchMenu {...props} />);
      const node = component.find('NewBranchDialog').first();
      expect(node.prop('open')).toEqual(false);
    });

    it('should show a dialog to create a new branch when the flag indicating whether to show the dialog is `true`', () => {
      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const component = shallow(<BranchMenu {...props} />);
      component.setState({
        branchDialog: true
      });
      const node = component.find('NewBranchDialog').first();
      expect(node.prop('open')).toEqual(true);
    });
  });

  describe('switch branch', () => {
    it('should not switch to a specified branch upon clicking its corresponding element when branching is disabled', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');

      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const component = mount(<BranchMenu {...props} />);
      const nodes = component.find(`.${listItemClass}[title*="${BRANCHES[1].name}"]`);
      nodes.at(0).simulate('click');

      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });

    it('should switch to a specified branch upon clicking its corresponding element when branching is enabled', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');

      const props = {
        model: model,
        branching: true,
        logger: new Logger(),
      };
      const component = mount(<BranchMenu {...props} />);
      const nodes = component.find(`.${listItemClass}[title*="${BRANCHES[1].name}"]`);
      nodes.at(0).simulate('click');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        branchname: BRANCHES[1].name
      });

      spy.mockRestore();
    });
  });

  describe('create branch', () => {
    it('should not allow creating a new branch when branching is disabled', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');

      const props = {
        model: model,
        branching: false,
        logger: new Logger(),
      };
      const component = shallow(<BranchMenu {...props} />);

      const node = component.find('input[type="button"]').first();
      node.simulate('click');

      expect(component.state('branchDialog')).toEqual(false);
      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });

    it('should display a dialog to create a new branch when branching is enabled and the new branch button is clicked', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');

      const props = {
        model: model,
        branching: true,
        logger: new Logger(),
      };
      const component = shallow(<BranchMenu {...props} />);

      const node = component.find('input[type="button"]').first();
      node.simulate('click');

      expect(component.state('branchDialog')).toEqual(true);
      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });
  });
});
