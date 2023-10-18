import { showDialog } from '@jupyterlab/apputils';
import { nullTranslator } from '@jupyterlab/translation';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest';
import * as React from 'react';
import { BranchMenu, IBranchMenuProps } from '../../components/BranchMenu';
import * as git from '../../git';
import { GitExtension } from '../../model';
import {
  DEFAULT_REPOSITORY_PATH,
  defaultMockedResponses,
  mockedRequestAPI
} from '../utils';

jest.mock('../../git');
jest.mock('@jupyterlab/apputils');

const BRANCHES = [
  {
    is_current_branch: true,
    is_remote_branch: false,
    name: 'main',
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
        responses: {
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
        }
      }) as any
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
      trans: trans,
      ...props
    };
  }

  describe('constructor', () => {
    it('should set the default menu filter to an empty string', () => {
      render(<BranchMenu {...createProps()} />);
      expect(
        screen.getByRole('textbox', { name: 'Filter branch menu' })
      ).toHaveValue('');
    });
  });

  describe('render', () => {
    it('should display placeholder text for the menu filter', () => {
      render(<BranchMenu {...createProps()} />);
      expect(
        screen.getByRole('textbox', { name: 'Filter branch menu' })
      ).toHaveAttribute('placeholder', 'Filter');
    });

    it('should set a `title` attribute on the input element to filter a branch menu', () => {
      render(<BranchMenu {...createProps()} />);
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'title',
        'Filter branch menu'
      );
    });

    it('should display a button to clear the menu filter once a filter is provided', async () => {
      render(<BranchMenu {...createProps()} />);
      await userEvent.type(screen.getByRole('textbox'), 'foo');
      expect(screen.getAllByTitle('Clear the current filter').length).toEqual(
        1
      );
    });

    it('should display a button to create a new branch', () => {
      render(<BranchMenu {...createProps()} />);
      expect(screen.getByRole('button', { name: 'New Branch' })).toBeDefined();
    });

    it('should set a `title` attribute on the button to create a new branch', () => {
      render(<BranchMenu {...createProps()} />);
      expect(
        screen.getByRole('button', { name: 'New Branch' })
      ).toHaveAttribute('title', 'Create a new branch');
    });

    it('should display a list of branches', () => {
      render(<BranchMenu {...createProps()} />);

      const branches = BRANCHES;
      expect(screen.getAllByRole('listitem').length).toEqual(branches.length);

      // Should contain the branch names...
      for (let i = 0; i < branches.length; i++) {
        expect(
          screen.getByText(branches[i].name, { exact: true })
        ).toBeDefined();
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
        name: 'main',
        upstream: '',
        top_commit: '',
        tag: ''
      },
      {
        is_current_branch: false,
        is_remote_branch: true,
        name: 'main',
        upstream: '',
        top_commit: '',
        tag: ''
      }
    ].forEach(branch => {
      const display = !(branch.is_current_branch || branch.is_remote_branch);
      it(`should${
        display ? ' ' : 'not '
      }display delete and merge buttons for ${JSON.stringify(branch)}`, () => {
        render(
          <BranchMenu
            {...createProps({
              currentBranch: 'current',
              branches: [branch]
            })}
          />
        );

        expect(
          screen.getByRole('listitem').querySelectorAll('button').length
        ).toEqual(display ? 2 : 0);
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
          isChecked: null,
          value: undefined
        }) as any;
      });

      const spy = jest.spyOn(GitExtension.prototype, 'deleteBranch');
      const branchName = 'main';

      render(
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

      await userEvent.click(
        screen.getByRole('button', { name: 'Delete this branch locally' })
      );

      // Need to wait that the dialog is resolve so 'deleteBranch' is called before
      // this test ends.
      await waitOnDialog;

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(branchName);
      spy.mockRestore();
    });

    it('should call merge branch when clicked on the merge button', async () => {
      const branchName = 'main';
      const fakeExecutioner = jest.fn();

      render(
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

      await userEvent.click(
        screen.getByRole('button', {
          name: 'Merge this branch into the current one'
        })
      );

      expect(fakeExecutioner).toHaveBeenCalledTimes(1);
      expect(fakeExecutioner).toHaveBeenCalledWith('git:merge', {
        branch: branchName
      });
    });

    it('should show a dialog to create a new branch when the flag indicating whether to show the dialog is `true`', async () => {
      render(<BranchMenu {...createProps({ branching: true })} />);

      await userEvent.click(screen.getByRole('button', { name: 'New Branch' }));

      expect(screen.getByRole('dialog')).toBeDefined();
    });
  });

  describe('switch branch', () => {
    it('should not switch to a specified branch upon clicking its corresponding element when branching is disabled', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');

      render(<BranchMenu {...createProps()} />);

      await userEvent.click(
        screen.getByRole('listitem', {
          name: `Switch to branch: ${BRANCHES[1].name}`
        })
      );

      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });

    it('should switch to a specified branch upon clicking its corresponding element when branching is enabled', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');

      render(<BranchMenu {...createProps({ branching: true })} />);
      await userEvent.click(
        screen.getByRole('listitem', {
          name: `Switch to branch: ${BRANCHES[1].name}`
        })
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        branchname: BRANCHES[1].name
      });

      spy.mockRestore();
    });
  });

  describe('create branch', () => {
    it('should not allow creating a new branch when branching is disabled', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');

      render(<BranchMenu {...createProps()} />);

      await userEvent.click(screen.getByRole('button', { name: 'New Branch' }));

      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });

    it('should display a dialog to create a new branch when branching is enabled and the new branch button is clicked', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkout');

      render(<BranchMenu {...createProps({ branching: true })} />);

      await userEvent.click(screen.getByRole('button', { name: 'New Branch' }));

      expect(screen.getByRole('dialog')).toBeDefined();
      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });
  });
});
