import * as React from 'react';
import 'jest';
import { shallow } from 'enzyme';
import { GitExtension } from '../../src/model';
import * as git from '../../src/git';
import { listItemClass } from '../../src/style/BranchMenu';
import { BranchMenu } from '../../src/components/BranchMenu';

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

function request(url: string, method: string, request: Object | null) {
  let response: Response;
  switch (url) {
    case '/git/branch':
      response = new Response(
        JSON.stringify({
          code: 0,
          branches: [],
          current_branch: null
        })
      );
      break;
    case '/git/checkout':
      response = new Response(
        JSON.stringify({
          code: 0
        })
      );
      break;
    case '/git/server_root':
      response = new Response(
        JSON.stringify({
          server_root: '/foo'
        })
      );
      break;
    case '/git/show_top_level':
      response = new Response(
        JSON.stringify({
          code: 0,
          top_repo_path: (request as any)['current_path']
        })
      );
      break;
    case '/git/status':
      response = new Response(
        JSON.stringify({
          code: 0,
          files: []
        })
      );
      break;
    default:
      response = new Response(
        `{"message": "No mock implementation for ${url}."}`,
        { status: 404 }
      );
  }
  return Promise.resolve(response);
}

async function createModel() {
  const model = new GitExtension();

  jest.spyOn(model, 'branches', 'get').mockReturnValue(BRANCHES);
  jest.spyOn(model, 'currentBranch', 'get').mockReturnValue(BRANCHES[0]);
  model.pathRepository = '/path/to/repo';

  await model.ready;
  return model;
}

describe('BranchMenu', () => {
  describe('constructor', () => {
    let model: GitExtension;

    beforeEach(async () => {
      const mock = git as jest.Mocked<typeof git>;
      mock.httpGitRequest.mockImplementation(request);

      model = await createModel();
    });

    it('should return a new instance', () => {
      const props = {
        model: model,
        branching: false
      };
      const menu = new BranchMenu(props);
      expect(menu).toBeInstanceOf(BranchMenu);
    });

    it('should set the default menu filter to an empty string', () => {
      const props = {
        model: model,
        branching: false
      };
      const menu = new BranchMenu(props);
      expect(menu.state.filter).toEqual('');
    });

    it('should set the default flag indicating whether to show a dialog to create a new branch to `false`', () => {
      const props = {
        model: model,
        branching: false
      };
      const menu = new BranchMenu(props);
      expect(menu.state.branchDialog).toEqual(false);
    });
  });

  describe('render', () => {
    let model: GitExtension;

    beforeEach(async () => {
      const mock = git as jest.Mocked<typeof git>;
      mock.httpGitRequest.mockImplementation(request);

      model = await createModel();
    });

    it('should display placeholder text for the menu filter', () => {
      const props = {
        model: model,
        branching: false
      };
      const component = shallow(<BranchMenu {...props} />);
      const node = component.find('input[type="text"]').first();
      expect(node.prop('placeholder')).toEqual('Filter');
    });

    it('should set a `title` attribute on the input element to filter a branch menu', () => {
      const props = {
        model: model,
        branching: false
      };
      const component = shallow(<BranchMenu {...props} />);
      const node = component.find('input[type="text"]').first();
      expect(node.prop('title').length > 0).toEqual(true);
    });

    it('should display a button to clear the menu filter once a filter is provided', () => {
      const props = {
        model: model,
        branching: false
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
        branching: false
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
        branching: false
      };
      const component = shallow(<BranchMenu {...props} />);
      const node = component.find('input[type="button"]').first();
      expect(node.prop('value')).toEqual('New Branch');
    });

    it('should set a `title` attribute on the button to create a new branch', () => {
      const props = {
        model: model,
        branching: false
      };
      const component = shallow(<BranchMenu {...props} />);
      const node = component.find('input[type="button"]').first();
      expect(node.prop('title').length > 0).toEqual(true);
    });

    it('should display a list of branches', () => {
      const props = {
        model: model,
        branching: false
      };
      const component = shallow(<BranchMenu {...props} />);
      const nodes = component.find(`.${listItemClass}`);

      const branches = model.branches;
      expect(nodes.length).toEqual(branches.length);

      // Should contain the branch names...
      for (let i = 0; i < branches.length; i++) {
        expect(
          nodes
            .at(i)
            .text()
            .includes(branches[i].name)
        ).toEqual(true);
      }
    });

    it('should set a `title` attribute for each displayed branch', () => {
      const props = {
        model: model,
        branching: false
      };
      const component = shallow(<BranchMenu {...props} />);
      const nodes = component.find(`.${listItemClass}`);

      const branches = model.branches;
      expect(nodes.length).toEqual(branches.length);

      for (let i = 0; i < branches.length; i++) {
        expect(nodes.at(i).prop('title').length > 0).toEqual(true);
      }
    });

    it('should not, by default, show a dialog to create a new branch', () => {
      const props = {
        model: model,
        branching: false
      };
      const component = shallow(<BranchMenu {...props} />);
      const node = component.find('NewBranchDialog').first();
      expect(node.prop('open')).toEqual(false);
    });

    it('should show a dialog to create a new branch when the flag indicating whether to show the dialog is `true`', () => {
      const props = {
        model: model,
        branching: false
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
    let model: GitExtension;

    beforeEach(async () => {
      const mock = git as jest.Mocked<typeof git>;
      mock.httpGitRequest.mockImplementation(request);

      model = await createModel();
    });

    it('should not switch to a specified branch upon clicking its corresponding element when branching is disabled', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');

      const props = {
        model: model,
        branching: false
      };
      const component = shallow(<BranchMenu {...props} />);
      const nodes = component.find(`.${listItemClass}`);

      const node = nodes.at(1);
      node.simulate('click');

      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });

    it('should not switch to a specified branch upon clicking its corresponding element when branching is enabled', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');

      const props = {
        model: model,
        branching: true
      };
      const component = shallow(<BranchMenu {...props} />);
      const nodes = component.find(`.${listItemClass}`);

      const node = nodes.at(1);
      node.simulate('click');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        branchname: BRANCHES[1].name
      });

      spy.mockRestore();
    });
  });

  describe('create branch', () => {
    let model: GitExtension;

    beforeEach(async () => {
      const mock = git as jest.Mocked<typeof git>;
      mock.httpGitRequest.mockImplementation(request);

      model = await createModel();
    });

    it('should not allow creating a new branch when branching is disabled', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');

      const props = {
        model: model,
        branching: false
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
        branching: true
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
