import { refreshIcon } from '@jupyterlab/ui-components';
import * as commands from '@lumino/commands';
import { shallow } from 'enzyme';
import 'jest';
import * as React from 'react';
import { ActionButton } from '../../src/components/ActionButton';
import { Toolbar } from '../../src/components/Toolbar';
import * as git from '../../src/git';
import { CommandIDs } from '../../src/gitMenuCommands';
import { GitExtension } from '../../src/model';
import { pullIcon, pushIcon } from '../../src/style/icons';
import {
  toolbarButtonClass,
  toolbarMenuButtonClass
} from '../../src/style/Toolbar';

jest.mock('@lumino/commands');
jest.mock('../../src/git');

async function createModel(commands?: commands.CommandRegistry) {
  const app = {
    commands,
    shell: null as any
  };
  const model = new GitExtension(app as any);

  jest.spyOn(model, 'currentBranch', 'get').mockReturnValue({
    is_current_branch: true,
    is_remote_branch: false,
    name: 'master',
    upstream: '',
    top_commit: '',
    tag: ''
  });
  model.pathRepository = '/path/to/repo';

  await model.ready;
  return model;
}

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

describe('Toolbar', () => {
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
        branching: false,
        refresh: async () => {}
      };
      const el = new Toolbar(props);
      expect(el).toBeInstanceOf(Toolbar);
    });

    it('should set the default flag indicating whether to show a branch menu to `false`', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const el = new Toolbar(props);
      expect(el.state.branchMenu).toEqual(false);
    });

    it('should set the default flag indicating whether to show a repository menu to `false`', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const el = new Toolbar(props);
      expect(el.state.repoMenu).toEqual(false);
    });
  });

  describe('render', () => {
    let model: GitExtension;

    beforeEach(async () => {
      const mock = git as jest.Mocked<typeof git>;
      mock.httpGitRequest.mockImplementation(request);

      model = await createModel();
    });

    it('should display a button to pull the latest changes', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const nodes = node
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === pullIcon);
      expect(nodes.length).toEqual(1);
    });

    it('should set the `title` attribute on the button to pull the latest changes', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const button = node
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === pullIcon)
        .first();

      expect(button.prop('title')).toEqual('Pull latest changes');
    });

    it('should display a button to push the latest changes', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const nodes = node
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === pushIcon);
      expect(nodes.length).toEqual(1);
    });

    it('should set the `title` attribute on the button to push the latest changes', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const button = node
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === pushIcon)
        .first();

      expect(button.prop('title')).toEqual('Push committed changes');
    });

    it('should display a button to refresh the current repository', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const nodes = node
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === refreshIcon);

      expect(nodes.length).toEqual(1);
    });

    it('should set the `title` attribute on the button to refresh the current repository', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const button = node.find(ActionButton).last();

      expect(button.prop('title')).toEqual(
        'Refresh the repository to detect local and remote changes'
      );
    });

    it('should display a button to toggle a repository menu', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const button = node.find(`.${toolbarMenuButtonClass}`).first();

      const text = button.text();
      expect(text.includes('Current Repository')).toEqual(true);
    });

    it('should set the `title` attribute on the button to toggle a repository menu', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const button = node.find(`.${toolbarMenuButtonClass}`).first();

      const bool = button.prop('title').includes('Current repository: ');
      expect(bool).toEqual(true);
    });

    it('should display a button to toggle a branch menu', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const button = node.find(`.${toolbarMenuButtonClass}`).at(1);

      const text = button.text();
      expect(text.includes('Current Branch')).toEqual(true);
    });

    it('should set the `title` attribute on the button to toggle a branch menu', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const button = node.find(`.${toolbarMenuButtonClass}`).at(1);

      expect(button.prop('title')).toEqual(
        `Change the current branch: ${model.currentBranch.name}`
      );
    });
  });

  describe('branch menu', () => {
    let model: GitExtension;

    beforeEach(async () => {
      const mock = git as jest.Mocked<typeof git>;
      mock.httpGitRequest.mockImplementation(request);

      model = await createModel();
    });

    it('should not, by default, display a branch menu', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const nodes = node.find('BranchMenu');

      expect(nodes.length).toEqual(0);
    });

    it('should display a branch menu when the button to display a branch menu is clicked', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const button = node.find(`.${toolbarMenuButtonClass}`).at(1);

      button.simulate('click');
      expect(node.find('BranchMenu').length).toEqual(1);
    });
  });

  describe('pull changes', () => {
    let model: GitExtension;
    let mockedExecute: any;

    beforeEach(async () => {
      const mockedCommands = commands as jest.Mocked<typeof commands>;
      mockedExecute = jest.fn();
      mockedCommands.CommandRegistry.mockImplementation(() => {
        return {
          execute: mockedExecute
        } as any;
      });
      const registry = new commands.CommandRegistry();

      const mock = git as jest.Mocked<typeof git>;
      mock.httpGitRequest.mockImplementation(request);

      model = await createModel(registry);
    });

    it('should pull changes when the button to pull the latest changes is clicked', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const button = node.find(`.${toolbarButtonClass}`).first();

      button.simulate('click');
      expect(mockedExecute).toHaveBeenCalledTimes(1);
      expect(mockedExecute).toHaveBeenCalledWith(CommandIDs.gitPull);
    });
  });

  describe('push changes', () => {
    let model: GitExtension;
    let mockedExecute: any;

    beforeEach(async () => {
      const mockedCommands = commands as jest.Mocked<typeof commands>;
      mockedExecute = jest.fn();
      mockedCommands.CommandRegistry.mockImplementation(() => {
        return {
          execute: mockedExecute
        } as any;
      });
      const registry = new commands.CommandRegistry();

      const mock = git as jest.Mocked<typeof git>;
      mock.httpGitRequest.mockImplementation(request);

      model = await createModel(registry);
    });

    it('should push changes when the button to push the latest changes is clicked', () => {
      const props = {
        model: model,
        branching: false,
        refresh: async () => {}
      };
      const node = shallow(<Toolbar {...props} />);
      const button = node.find(`.${toolbarButtonClass}`).at(1);

      button.simulate('click');
      expect(mockedExecute).toHaveBeenCalledTimes(1);
      expect(mockedExecute).toHaveBeenCalledWith(CommandIDs.gitPush);
    });
  });

  describe('refresh repository', () => {
    let model: GitExtension;

    beforeEach(async () => {
      const mock = git as jest.Mocked<typeof git>;
      mock.httpGitRequest.mockImplementation(request);

      model = await createModel();
    });

    it('should refresh the repository when the button to refresh the repository is clicked', () => {
      const spy = jest.fn(async () => {});

      const props = {
        model: model,
        branching: false,
        refresh: spy
      };
      const node = shallow(<Toolbar {...props} />);
      const button = node.find(`.${toolbarButtonClass}`).last();

      button.simulate('click');
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });
  });
});
