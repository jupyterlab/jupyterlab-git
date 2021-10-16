import { mount, render, shallow } from 'enzyme';
import { showDialog } from '@jupyterlab/apputils';
import 'jest';
import * as React from 'react';
import { ActionButton } from '../../src/components/ActionButton';
import { BranchMenu, IBranchMenuProps } from '../../src/components/BranchMenu';
import * as git from '../../src/git';
import { Logger } from '../../src/logger';
import { GitExtension } from '../../src/model';
import { listItemClass, nameClass } from '../../src/style/BranchMenu';
import {
  mockedRequestAPI,
  defaultMockedResponses,
  DEFAULT_REPOSITORY_PATH
} from '../utils';
import ClearIcon from '@material-ui/icons/Clear';
import { nullTranslator } from '@jupyterlab/translation';

jest.mock('../../src/git');
jest.mock('@jupyterlab/apputils');

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
    is_current_branch: false,
    is_remote_branch: false,
    name: 'feature-1',
    upstream: '',
    top_commit: '',
    tag: ''
  },
  {
    is_current_branch: false,
    is_remote_branch: false,
    name: 'feature-2',
    upstream: '',
    top_commit: '',
    tag: ''
  },
  {
    is_current_branch: false,
    is_remote_branch: true,
    name: 'patch-007',
    upstream: 'origin/patch-007',
    top_commit: '',
    tag: ''
  }
];

async function createModel() {
  const model = new GitExtension();
  model.pathRepository = DEFAULT_REPOSITORY_PATH;

  await model.ready;
  return model;
}

describe('BranchMenu', () => {
  let model: GitExtension;
  const trans = nullTranslator.load('jupyterlab_git');

  beforeEach(async () => {
    jest.restoreAllMocks();

    const mock = git as jest.Mocked<typeof git>;
    mock.requestAPI.mockImplementation(
      mockedRequestAPI({
        ...defaultMockedResponses,
        'branch/delete': {
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
      })
    );

    model = await createModel();
  });

  function createProps(props?: Partial<IBranchMenuProps>): IBranchMenuProps {
    return {
      currentBranch: BRANCHES[0].name,
      branches: BRANCHES,
      model: model,
      branching: false,
      commands: {
        execute: jest.fn()
      } as any,
      logger: new Logger(),
      trans: trans,
      ...props
    };
  }

  describe('constructor', () => {
    it('should return a new instance', () => {
      const menu = shallow(<BranchMenu {...createProps()} />);
      expect(menu.instance()).toBeInstanceOf(BranchMenu);
    });

    it('should set the default menu filter to an empty string', () => {
      const menu = shallow(<BranchMenu {...createProps()} />);
      expect(menu.state('filter')).toEqual('');
    });

    it('should set the default flag indicating whether to show a dialog to create a new branch to `false`', () => {
      const menu = shallow(<BranchMenu {...createProps()} />);
      expect(menu.state('branchDialog')).toEqual(false);
    });
  });

  describe('render', () => {
    it('should display placeholder text for the menu filter', () => {
      const component = shallow(<BranchMenu {...createProps()} />);
      const node = component.find('input[type="text"]').first();
      expect(node.prop('placeholder')).toEqual('Filter');
    });

    it('should set a `title` attribute on the input element to filter a branch menu', () => {
      const component = shallow(<BranchMenu {...createProps()} />);
      const node = component.find('input[type="text"]').first();
      expect(node.prop('title').length > 0).toEqual(true);
    });

    it('should display a button to clear the menu filter once a filter is provided', () => {
      const component = shallow(<BranchMenu {...createProps()} />);
      component.setState({
        filter: 'foo'
      });
      const nodes = component.find(ClearIcon);
      expect(nodes.length).toEqual(1);
    });

    it('should set a `title` on the button to clear the menu filter', () => {
      const component = shallow(<BranchMenu {...createProps()} />);
      component.setState({
        filter: 'foo'
      });
      const html = component.find(ClearIcon).first().html();
      expect(html.includes('<title>')).toEqual(true);
    });

    it('should display a button to create a new branch', () => {
      const component = shallow(<BranchMenu {...createProps()} />);
      const node = component.find('input[type="button"]').first();
      expect(node.prop('value')).toEqual('New Branch');
    });

    it('should set a `title` attribute on the button to create a new branch', () => {
      const component = shallow(<BranchMenu {...createProps()} />);
      const node = component.find('input[type="button"]').first();
      expect(node.prop('title').length > 0).toEqual(true);
    });

    it('should display a list of branches', () => {
      const component = render(<BranchMenu {...createProps()} />);
      const nodes = component.find(`.${nameClass}`);

      const branches = BRANCHES;
      expect(nodes.length).toEqual(branches.length);

      // Should contain the branch names...
      for (let i = 0; i < branches.length; i++) {
        // @ts-ignore
        expect(nodes[i].lastChild.data).toEqual(branches[i].name);
      }
    });

    [
      {
        is_current_branch: true,
        is_remote_branch: false,
        name: 'current',
        upstream: '',
        top_commit: '',
        tag: ''
      },
      {
        is_current_branch: false,
        is_remote_branch: false,
        name: 'master',
        upstream: '',
        top_commit: '',
        tag: ''
      },
      {
        is_current_branch: false,
        is_remote_branch: true,
        name: 'master',
        upstream: '',
        top_commit: '',
        tag: ''
      }
    ].forEach(branch => {
      const display = !(branch.is_current_branch || branch.is_remote_branch);
      it(`should${
        display ? ' ' : 'not '
      }display delete and merge buttons for ${JSON.stringify(branch)}`, () => {
        const menu = mount(
          <BranchMenu
            {...createProps({
              currentBranch: 'current',
              branches: [branch]
            })}
          />
        );

        const item = menu.find(`.${listItemClass}`);

        expect(item.find(ActionButton).length).toEqual(display ? 2 : 0);
      });
    });

    it('should call delete branch when clicked on the delete button', async () => {
      const mockDialog = showDialog as jest.MockedFunction<typeof showDialog>;
      let resolveDialog: (value?: unknown) => void;
      const waitOnDialog = new Promise(resolve => {
        resolveDialog = resolve;
      });
      mockDialog.mockImplementation(() => {
        resolveDialog();
        return Promise.resolve({
          button: {
            accept: true,
            actions: [],
            caption: '',
            className: '',
            displayType: 'default',
            iconClass: '',
            iconLabel: '',
            label: ''
          },
          value: undefined
        });
      });

      const spy = jest.spyOn(GitExtension.prototype, 'deleteBranch');
      const branchName = 'master';

      const menu = mount(
        <BranchMenu
          {...createProps({
            currentBranch: 'current',
            branches: [
              {
                is_current_branch: false,
                is_remote_branch: false,
                name: branchName,
                upstream: '',
                top_commit: '',
                tag: ''
              }
            ]
          })}
        />
      );

      const item = menu.find(`.${listItemClass}`);
      const button = item.find(ActionButton);
      button.at(0).simulate('click');

      // Need to wait that the dialog is resolve so 'deleteBranch' is called before
      // this test ends.
      await waitOnDialog;

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(branchName);
      spy.mockRestore();
    });

    it('should call merge branch when clicked on the merge button', async () => {
      const branchName = 'master';
      const fakeExecutioner = jest.fn();

      const menu = mount(
        <BranchMenu
          {...createProps({
            currentBranch: 'current',
            branches: [
              {
                is_current_branch: false,
                is_remote_branch: false,
                name: branchName,
                upstream: '',
                top_commit: '',
                tag: ''
              }
            ],
            commands: {
              execute: fakeExecutioner
            } as any
          })}
        />
      );

      const item = menu.find(`.${listItemClass}`);
      const button = item.find(ActionButton);
      button.at(1).simulate('click');

      expect(fakeExecutioner).toHaveBeenCalledTimes(1);
      expect(fakeExecutioner).toHaveBeenCalledWith('git:merge', {branch: branchName});
    });

    it('should set a `title` attribute for each displayed branch', () => {
      const component = render(<BranchMenu {...createProps()} />);
      const nodes = component.find(`.${listItemClass}`);

      const branches = BRANCHES;
      expect(nodes.length).toEqual(branches.length);

      for (let i = 0; i < branches.length; i++) {
        // @ts-ignore
        expect(nodes[i].attribs['title'].length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should not, by default, show a dialog to create a new branch', () => {
      const component = shallow(<BranchMenu {...createProps()} />);
      const node = component.find('NewBranchDialog').first();
      expect(node.prop('open')).toEqual(false);
    });

    it('should show a dialog to create a new branch when the flag indicating whether to show the dialog is `true`', () => {
      const component = shallow(<BranchMenu {...createProps()} />);
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

      const component = mount(<BranchMenu {...createProps()} />);
      const nodes = component.find(
        `.${listItemClass}[title*="${BRANCHES[1].name}"]`
      );
      nodes.at(0).simulate('click');

      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });

    it('should switch to a specified branch upon clicking its corresponding element when branching is enabled', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');

      const component = mount(
        <BranchMenu {...createProps({ branching: true })} />
      );
      const nodes = component.find(
        `.${listItemClass}[title*="${BRANCHES[1].name}"]`
      );
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

      const component = shallow(<BranchMenu {...createProps()} />);

      const node = component.find('input[type="button"]').first();
      node.simulate('click');

      expect(component.state('branchDialog')).toEqual(false);
      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });

    it('should display a dialog to create a new branch when branching is enabled and the new branch button is clicked', () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');

      const component = shallow(
        <BranchMenu {...createProps({ branching: true })} />
      );

      const node = component.find('input[type="button"]').first();
      node.simulate('click');

      expect(component.state('branchDialog')).toEqual(true);
      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });
  });
});
