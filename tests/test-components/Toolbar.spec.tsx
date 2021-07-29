import { nullTranslator } from '@jupyterlab/translation';
import { refreshIcon } from '@jupyterlab/ui-components';
import { shallow } from 'enzyme';
import 'jest';
import * as React from 'react';
import { ActionButton } from '../../src/components/ActionButton';
import { IToolbarProps, Toolbar } from '../../src/components/Toolbar';
import * as git from '../../src/git';
import { Logger } from '../../src/logger';
import { GitExtension } from '../../src/model';
import { pullIcon, pushIcon } from '../../src/style/icons';
import { toolbarMenuButtonClass } from '../../src/style/Toolbar';
import { DEFAULT_REPOSITORY_PATH, mockedRequestAPI } from '../utils';
import { CommandIDs } from '../../src/tokens';

jest.mock('../../src/git');

async function createModel() {
  const model = new GitExtension();
  model.pathRepository = DEFAULT_REPOSITORY_PATH;

  await model.ready;
  return model;
}

describe('Toolbar', () => {
  let model: GitExtension;
  const trans = nullTranslator.load('jupyterlab_git');

  function createProps(props?: Partial<IToolbarProps>): IToolbarProps {
    return {
      currentBranch: 'master',
      branches: [
        {
          is_current_branch: true,
          is_remote_branch: false,
          name: 'master',
          upstream: 'origin/master',
          top_commit: '',
          tag: ''
        },
        {
          is_current_branch: false,
          is_remote_branch: true,
          name: 'origin/master',
          upstream: '',
          top_commit: '',
          tag: ''
        }
      ],
      repository: model.pathRepository,
      model: model,
      branching: false,
      logger: new Logger(),
      nCommitsAhead: 0,
      nCommitsBehind: 0,
      commands: {
        execute: jest.fn()
      } as any,
      trans: trans,
      ...props
    };
  }

  beforeEach(async () => {
    jest.restoreAllMocks();

    const mock = git as jest.Mocked<typeof git>;
    mock.requestAPI.mockImplementation(mockedRequestAPI());

    model = await createModel();
  });

  describe('constructor', () => {
    it('should return a new instance', () => {
      const el = shallow(<Toolbar {...createProps()} />);
      expect(el.instance()).toBeInstanceOf(Toolbar);
    });

    it('should set the default flag indicating whether to show a branch menu to `false`', () => {
      const el = shallow<Toolbar>(<Toolbar {...createProps()} />);
      expect(el.state().branchMenu).toEqual(false);
    });
  });

  describe('render', () => {
    it('should display a button to pull the latest changes', () => {
      const toolbar = shallow<Toolbar>(<Toolbar {...createProps()} />);
      const nodes = toolbar
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === pullIcon);
      expect(nodes.length).toEqual(1);

      expect(
        toolbar.find('[data-test-id="pull-badge"]').prop('invisible')
      ).toEqual(true);
    });

    it('should set the `title` attribute on the button to pull the latest changes', () => {
      const toolbar = shallow<Toolbar>(<Toolbar {...createProps()} />);
      const button = toolbar
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === pullIcon);

      expect(button.prop('title')).toEqual('Pull latest changes');
    });

    it('should display a badge on pull icon if behind', () => {
      const toolbar = shallow<Toolbar>(
        <Toolbar {...createProps({ nCommitsBehind: 1 })} />
      );

      expect(
        toolbar.find('[data-test-id="pull-badge"]').prop('invisible')
      ).toEqual(false);
    });

    it('should display a button to push the latest changes', () => {
      const toolbar = shallow<Toolbar>(<Toolbar {...createProps()} />);
      const nodes = toolbar
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === pushIcon);
      expect(nodes.length).toEqual(1);

      expect(
        toolbar.find('[data-test-id="push-badge"]').prop('invisible')
      ).toEqual(true);
    });

    it('should set the `title` attribute on the button to push the latest changes', () => {
      const toolbar = shallow<Toolbar>(<Toolbar {...createProps()} />);
      const button = toolbar
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === pushIcon)
        .first();

      expect(button.prop('title')).toEqual('Push committed changes');
    });

    it('should display a badge on pull icon if behind', () => {
      const toolbar = shallow<Toolbar>(
        <Toolbar {...createProps({ nCommitsAhead: 1 })} />
      );

      expect(
        toolbar.find('[data-test-id="push-badge"]').prop('invisible')
      ).toEqual(false);
    });

    it('should display a button to refresh the current repository', () => {
      const toolbar = shallow<Toolbar>(<Toolbar {...createProps()} />);
      const nodes = toolbar
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === refreshIcon);

      expect(nodes.length).toEqual(1);
    });

    it('should set the `title` attribute on the button to refresh the current repository', () => {
      const toolbar = shallow<Toolbar>(<Toolbar {...createProps()} />);
      const button = toolbar
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === refreshIcon)
        .first();

      expect(button.prop('title')).toEqual(
        'Refresh the repository to detect local and remote changes'
      );
    });

    it('should display a button to toggle a repository menu', () => {
      const toolbar = shallow<Toolbar>(<Toolbar {...createProps()} />);
      const button = toolbar.find(`.${toolbarMenuButtonClass}`).first();

      const text = button.text();
      expect(text.includes('Current Repository')).toEqual(true);
    });

    it('should set the `title` attribute on the button to toggle a repository menu', () => {
      const toolbar = shallow<Toolbar>(<Toolbar {...createProps()} />);
      const button = toolbar.find(`.${toolbarMenuButtonClass}`).first();

      const bool = button.prop('title').includes('Current repository: ');
      expect(bool).toEqual(true);
    });

    it('should display a button to toggle a branch menu', () => {
      const toolbar = shallow<Toolbar>(<Toolbar {...createProps()} />);
      const button = toolbar.find(`.${toolbarMenuButtonClass}`).at(1);

      const text = button.text();
      expect(text.includes('Current Branch')).toEqual(true);
    });

    it('should set the `title` attribute on the button to toggle a branch menu', () => {
      const currentBranch = 'master';
      const toolbar = shallow<Toolbar>(
        <Toolbar {...createProps({ currentBranch })} />
      );
      const button = toolbar.find(`.${toolbarMenuButtonClass}`).at(1);

      expect(button.prop('title')).toEqual('Manage branches and tags');
    });
  });

  describe('branch menu', () => {
    it('should not, by default, display a branch menu', () => {
      const toolbar = shallow<Toolbar>(<Toolbar {...createProps()} />);
      const nodes = toolbar.find('BranchMenu');

      expect(nodes.length).toEqual(0);
    });

    it('should display a branch menu when the button to display a branch menu is clicked', () => {
      const toolbar = shallow<Toolbar>(<Toolbar {...createProps()} />);
      const button = toolbar.find(`.${toolbarMenuButtonClass}`).at(1);

      button.simulate('click');
      expect(toolbar.find('BranchMenu').length).toEqual(1);
    });
  });

  describe('pull changes', () => {
    it('should pull changes when the button to pull the latest changes is clicked', () => {
      const mockedExecute = jest.fn();
      const toolbar = shallow<Toolbar>(
        <Toolbar
          {...createProps({
            commands: {
              execute: mockedExecute
            } as any
          })}
        />
      );
      const button = toolbar
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === pullIcon)
        .first();

      button.simulate('click');
      expect(mockedExecute).toHaveBeenCalledTimes(1);
      expect(mockedExecute).toHaveBeenCalledWith(CommandIDs.gitPull);
    });

    it('should not pull changes when the pull button is clicked but there is no remote branch', () => {
      const mockedExecute = jest.fn();
      const toolbar = shallow<Toolbar>(
        <Toolbar
          {...createProps({
            branches: [
              {
                is_current_branch: true,
                is_remote_branch: false,
                name: 'master',
                upstream: '',
                top_commit: '',
                tag: ''
              }
            ],
            commands: {
              execute: mockedExecute
            } as any
          })}
        />
      );
      const button = toolbar
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === pullIcon)
        .first();

      button.simulate('click');
      expect(mockedExecute).toHaveBeenCalledTimes(0);
    });
  });

  describe('push changes', () => {
    it('should push changes when the button to push the latest changes is clicked', () => {
      const mockedExecute = jest.fn();
      const toolbar = shallow<Toolbar>(
        <Toolbar
          {...createProps({
            commands: {
              execute: mockedExecute
            } as any
          })}
        />
      );
      const button = toolbar
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === pushIcon)
        .first();

      button.simulate('click');
      expect(mockedExecute).toHaveBeenCalledTimes(1);
      expect(mockedExecute).toHaveBeenCalledWith(CommandIDs.gitPush);
    });

    it('should not push changes when the push button is clicked but there is no remote branch', () => {
      const mockedExecute = jest.fn();
      const toolbar = shallow<Toolbar>(
        <Toolbar
          {...createProps({
            branches: [
              {
                is_current_branch: true,
                is_remote_branch: false,
                name: 'master',
                upstream: '',
                top_commit: '',
                tag: ''
              }
            ],
            commands: {
              execute: mockedExecute
            } as any
          })}
        />
      );
      const button = toolbar
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === pushIcon)
        .first();

      button.simulate('click');
      expect(mockedExecute).toHaveBeenCalledTimes(0);
    });
  });

  describe('refresh repository', () => {
    it('should refresh the repository when the button to refresh the repository is clicked', () => {
      const spy = jest.spyOn(model, 'refresh');
      const toolbar = shallow<Toolbar>(<Toolbar {...createProps()} />);
      const button = toolbar
        .find(ActionButton)
        .findWhere(n => n.prop('icon') === refreshIcon)
        .first();

      button.simulate('click');
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockReset();
      spy.mockRestore();
    });
  });
});
