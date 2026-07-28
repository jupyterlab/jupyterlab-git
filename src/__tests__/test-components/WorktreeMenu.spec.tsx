import { showDialog } from '@jupyterlab/apputils';
import { nullTranslator } from '@jupyterlab/translation';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest';
import * as React from 'react';
import {
  WorktreeMenu,
  IWorktreeMenuProps
} from '../../components/WorktreeMenu';
import * as git from '../../git';
import { GitExtension } from '../../model';
import { CommandIDs, Git } from '../../tokens';
import {
  DEFAULT_REPOSITORY_PATH,
  defaultMockedResponses,
  mockedRequestAPI
} from '../utils';

jest.mock('../../git');
jest.mock('@jupyterlab/apputils');

const WORKTREES: Git.IWorktree[] = [
  {
    path: DEFAULT_REPOSITORY_PATH,
    head: 'abcdefghijklmnopqrstuvwxyz01234567890123',
    branch: 'main',
    detached: false,
    bare: false,
    locked: false,
    prunable: false,
    is_main: true,
    is_current: true
  },
  {
    path: DEFAULT_REPOSITORY_PATH + '/.worktrees/feature',
    head: 'abcdefghijklmnopqrstuvwxyz01234567890123',
    branch: 'feature',
    detached: false,
    bare: false,
    locked: false,
    prunable: false,
    is_main: false,
    is_current: false
  },
  {
    path: 'stale-wt',
    head: 'abcdefghijklmnopqrstuvwxyz01234567890123',
    branch: 'stale-branch',
    detached: false,
    bare: false,
    locked: false,
    prunable: true,
    is_main: false,
    is_current: false
  },
  {
    path: '../outside-wt',
    head: 'abcdefghijklmnopqrstuvwxyz01234567890123',
    branch: 'outside-branch',
    detached: false,
    bare: false,
    locked: false,
    prunable: false,
    is_main: false,
    is_current: false
  }
];

async function createModel() {
  const model = new GitExtension();
  model.pathRepository = DEFAULT_REPOSITORY_PATH;

  await model.ready;
  return model;
}

describe('WorktreeMenu', () => {
  let model: GitExtension;
  const trans = nullTranslator.load('jupyterlab_git');

  beforeEach(async () => {
    jest.restoreAllMocks();

    const mock = git as jest.Mocked<typeof git>;
    mock.requestAPI.mockImplementation(
      mockedRequestAPI({
        responses: {
          ...defaultMockedResponses
        }
      }) as any
    );

    model = await createModel();
  });

  function createProps(
    props?: Partial<IWorktreeMenuProps>
  ): IWorktreeMenuProps {
    return {
      commands: {
        execute: jest.fn()
      } as any,
      model: model,
      worktrees: WORKTREES,
      trans: trans,
      ...props
    };
  }

  describe('render', () => {
    it('should display a list of worktrees', () => {
      render(<WorktreeMenu {...createProps()} />);
      expect(screen.getAllByRole('listitem').length).toEqual(WORKTREES.length);
      expect(screen.getByText('main')).toBeDefined();
      expect(screen.getByText('feature')).toBeDefined();
    });

    it('should not display bare repository entries', () => {
      const bare: Git.IWorktree = {
        path: 'repo.git',
        head: null,
        branch: null,
        detached: false,
        bare: true,
        locked: false,
        prunable: false,
        is_main: true,
        is_current: false
      };
      render(
        <WorktreeMenu {...createProps({ worktrees: [bare, WORKTREES[1]] })} />
      );
      expect(screen.getAllByRole('listitem').length).toEqual(1);
    });

    it('should mark stale worktrees', () => {
      render(<WorktreeMenu {...createProps()} />);
      expect(screen.getByText('(stale)')).toBeDefined();
    });

    it('should display a remove button for linked worktrees only', () => {
      render(<WorktreeMenu {...createProps()} />);
      // All rows but the current/main one have a remove action
      expect(screen.getAllByTitle('Remove this worktree').length).toEqual(
        WORKTREES.length - 1
      );
    });
  });

  describe('open worktree', () => {
    it('should execute the open worktree command upon clicking a worktree', async () => {
      const fakeExecutioner = jest.fn();
      render(
        <WorktreeMenu
          {...createProps({
            commands: { execute: fakeExecutioner } as any
          })}
        />
      );

      await userEvent.click(
        screen.getByRole('listitem', {
          name: `Open worktree: ${WORKTREES[1].path}`
        })
      );

      expect(fakeExecutioner).toHaveBeenCalledWith(CommandIDs.gitOpenWorktree, {
        path: WORKTREES[1].path
      });
    });

    it('should not open the current worktree', async () => {
      const fakeExecutioner = jest.fn();
      render(
        <WorktreeMenu
          {...createProps({
            commands: { execute: fakeExecutioner } as any
          })}
        />
      );

      await userEvent.click(
        screen.getByRole('listitem', {
          name: `Current worktree: ${WORKTREES[0].path}`
        })
      );

      expect(fakeExecutioner).not.toHaveBeenCalled();
    });

    it('should not open a stale worktree', async () => {
      const fakeExecutioner = jest.fn();
      render(
        <WorktreeMenu
          {...createProps({
            commands: { execute: fakeExecutioner } as any
          })}
        />
      );

      await userEvent.click(
        screen.getByRole('listitem', {
          name: 'The folder of this worktree is missing; it can be removed'
        })
      );

      expect(fakeExecutioner).not.toHaveBeenCalled();
    });

    it('should not open a worktree outside of the server root', async () => {
      const fakeExecutioner = jest.fn();
      render(
        <WorktreeMenu
          {...createProps({
            commands: { execute: fakeExecutioner } as any
          })}
        />
      );

      await userEvent.click(
        screen.getByRole('listitem', {
          name: 'This worktree is outside of the Jupyter server root and cannot be opened'
        })
      );

      expect(fakeExecutioner).not.toHaveBeenCalled();
    });
  });

  describe('remove worktree', () => {
    function acceptDialog() {
      const mockDialog = showDialog as jest.MockedFunction<typeof showDialog>;
      mockDialog.mockResolvedValue({
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
      } as any);
      return mockDialog;
    }

    it('should remove the worktree upon accepting the confirmation dialog', async () => {
      acceptDialog();
      const spy = jest
        .spyOn(GitExtension.prototype, 'removeWorktree')
        .mockResolvedValue();

      render(<WorktreeMenu {...createProps()} />);

      await userEvent.click(screen.getAllByTitle('Remove this worktree')[0]);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(WORKTREES[1].path);
      spy.mockRestore();
    });

    it('should not remove the worktree when the confirmation dialog is cancelled', async () => {
      const mockDialog = showDialog as jest.MockedFunction<typeof showDialog>;
      mockDialog.mockResolvedValue({
        button: { accept: false },
        isChecked: null,
        value: undefined
      } as any);
      const spy = jest
        .spyOn(GitExtension.prototype, 'removeWorktree')
        .mockResolvedValue();

      render(<WorktreeMenu {...createProps()} />);

      await userEvent.click(screen.getAllByTitle('Remove this worktree')[0]);

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should force the removal upon accepting the force dialog for a dirty worktree', async () => {
      acceptDialog();
      const spy = jest
        .spyOn(GitExtension.prototype, 'removeWorktree')
        .mockRejectedValueOnce(
          new Error(
            "fatal: 'wt' contains modified or untracked files, use --force to delete it"
          )
        )
        .mockResolvedValueOnce();

      render(<WorktreeMenu {...createProps()} />);

      await userEvent.click(screen.getAllByTitle('Remove this worktree')[0]);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, WORKTREES[1].path);
      expect(spy).toHaveBeenNthCalledWith(2, WORKTREES[1].path, true);
      spy.mockRestore();
    });
  });
});
