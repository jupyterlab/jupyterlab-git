import { nullTranslator } from '@jupyterlab/translation';
import { Signal } from '@lumino/signaling';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest';
import * as React from 'react';
import {
  BranchItem,
  IRemoteActionItemProps,
  IToolbarItemProps,
  PullItem,
  PushItem,
  RefreshItem,
  RepositoryItem
} from '../../components/Toolbar';
import * as git from '../../git';
import { GitExtension } from '../../model';
import { badgeClass } from '../../style/Toolbar';
import { CommandIDs, Git } from '../../tokens';
import type { GitWidget } from '../../widgets/GitWidget';
import {
  DEFAULT_REPOSITORY_PATH,
  defaultMockedResponses,
  mockedRequestAPI
} from '../utils';

jest.mock('../../git');

const REMOTES: Git.IGitRemote[] = [
  {
    name: 'test',
    url: 'https://test.com'
  },
  {
    name: 'origin',
    url: 'https://origin.com'
  }
];

const DEFAULT_BRANCHES: Git.IBranch[] = [
  {
    is_current_branch: true,
    is_remote_branch: false,
    name: 'main',
    upstream: 'origin/main',
    top_commit: '',
    tag: ''
  },
  {
    is_current_branch: false,
    is_remote_branch: true,
    name: 'origin/main',
    upstream: '',
    top_commit: '',
    tag: ''
  }
];

interface IModelOptions {
  branches?: Git.IBranch[];
  submodules?: Git.ISubmodule[];
  remotes?: Git.IGitRemote[];
  status?: { ahead?: number; behind?: number; state?: Git.State };
  // Repository path to set on the model; `null` leaves the model without a repository
  repository?: string | null;
}

async function createModel(options: IModelOptions = {}): Promise<GitExtension> {
  const branches = options.branches ?? DEFAULT_BRANCHES;
  const currentBranch = branches.find(b => b.is_current_branch) ?? null;
  const submodules = options.submodules ?? [];
  const remotes = options.remotes ?? REMOTES;
  const ahead = options.status?.ahead ?? 0;
  const behind = options.status?.behind ?? 0;
  const state = options.status?.state ?? Git.State.DEFAULT;

  const mock = git as jest.Mocked<typeof git>;
  mock.requestAPI.mockImplementation(
    mockedRequestAPI({
      responses: {
        ...defaultMockedResponses,
        branch: {
          body: () => ({ code: 0, branches, current_branch: currentBranch })
        },
        submodules: {
          body: () => ({ code: 0, submodules })
        },
        'remote/show': {
          body: () => ({ code: 0, remotes: [...remotes] })
        },
        'remote/add': {
          body: () => ({ code: 0 })
        },
        'remote/origin': {
          body: () => ({ code: 0 })
        },
        status: {
          body: () => ({
            code: 0,
            files: [],
            ahead,
            behind,
            state,
            branch: 'main',
            remote: 'origin/main'
          })
        }
      }
    }) as any
  );

  const model = new GitExtension();
  if (options.repository !== null) {
    model.pathRepository = options.repository ?? DEFAULT_REPOSITORY_PATH;
    await model.ready;
    // `model.ready` does not await branch/submodule/remote data.
    await model.refreshBranch();
    await model.listSubmodules();
    await model.refreshRemotes();
  }
  return model;
}

interface IPanelMock {
  panel: GitWidget;
  toggleSubmoduleMenu: jest.Mock;
}

function createPanelMock(): IPanelMock {
  const toggleSubmoduleMenu = jest.fn();
  const panel: any = {
    submoduleMenuShown: false,
    toggleSubmoduleMenu
  };
  panel.submoduleMenuShownChanged = new Signal<unknown, boolean>(panel);
  return { panel: panel as GitWidget, toggleSubmoduleMenu };
}

describe('Toolbar items', () => {
  let model: GitExtension;
  const trans = nullTranslator.load('jupyterlab_git');

  function createProps(props?: Partial<IToolbarItemProps>): IToolbarItemProps {
    return {
      model: model,
      trans: trans,
      ...props
    };
  }

  function createActionProps(
    props?: Partial<IRemoteActionItemProps>
  ): IRemoteActionItemProps {
    return {
      model: model,
      commands: {
        execute: jest.fn()
      } as any,
      trans: trans,
      ...props
    };
  }

  // The pull and push items share the remote state; render both to assert on it.
  function RemoteActions(): JSX.Element {
    return (
      <>
        <PullItem {...createActionProps()} />
        <PushItem {...createActionProps()} />
      </>
    );
  }

  beforeEach(async () => {
    jest.restoreAllMocks();
    model = await createModel();
  });

  describe('PullItem', () => {
    it('should display a button to pull the latest changes', async () => {
      render(<PullItem {...createActionProps()} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Pull latest changes' })
        ).toBeDefined();
      });

      expect(
        screen
          .getByRole('button', { name: 'Pull latest changes' })
          .parentElement?.querySelector(`.${badgeClass} > .MuiBadge-badge`)
      ).toHaveClass('MuiBadge-invisible');
    });

    it('should display a badge on pull icon if behind', async () => {
      model = await createModel({ status: { behind: 1 } });
      render(<PullItem {...createActionProps()} />);

      await waitFor(() => {
        expect(
          screen
            .getByRole('button', { name: /^Pull latest changes/ })
            .parentElement?.querySelector(`.${badgeClass} > .MuiBadge-badge`)
        ).not.toHaveClass('MuiBadge-invisible');
      });
    });

    it('should pull changes when the button to pull the latest changes is clicked', async () => {
      const mockedExecute = jest.fn();
      render(
        <PullItem
          {...createActionProps({
            commands: {
              execute: mockedExecute
            } as any
          })}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Pull latest changes' })
        ).toBeDefined();
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Pull latest changes' })
      );

      expect(mockedExecute).toHaveBeenCalledTimes(1);
      expect(mockedExecute).toHaveBeenCalledWith(CommandIDs.gitPull);
    });

    it('should not pull changes when the pull button is clicked but there is no remote branch', async () => {
      model = await createModel({ remotes: [] });
      const mockedExecute = jest.fn();
      render(
        <PullItem
          {...createActionProps({
            commands: {
              execute: mockedExecute
            } as any
          })}
        />
      );

      await userEvent.click(
        screen.getByRole('button', {
          name: 'No remote repository defined'
        })
      );

      expect(mockedExecute).toHaveBeenCalledTimes(0);
    });
  });

  describe('PushItem', () => {
    it('should display a button to push the latest changes', async () => {
      render(<PushItem {...createActionProps()} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Push committed changes' })
        ).toBeDefined();
      });

      expect(
        screen
          .getByRole('button', { name: 'Push committed changes' })
          .parentElement?.querySelector(`.${badgeClass} > .MuiBadge-badge`)
      ).toHaveClass('MuiBadge-invisible');
    });

    it('should display a badge on push icon if ahead', async () => {
      model = await createModel({ status: { ahead: 1 } });
      render(<PushItem {...createActionProps()} />);

      await waitFor(() => {
        expect(
          screen
            .getByRole('button', { name: /^Push committed changes/ })
            .parentElement?.querySelector(`.${badgeClass} > .MuiBadge-badge`)
        ).not.toHaveClass('MuiBadge-invisible');
      });
    });

    it('should push changes when the button to push the latest changes is clicked', async () => {
      const mockedExecute = jest.fn();
      render(
        <PushItem
          {...createActionProps({
            commands: {
              execute: mockedExecute
            } as any
          })}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Push committed changes' })
        ).toBeDefined();
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'Push committed changes' })
      );

      expect(mockedExecute).toHaveBeenCalledTimes(1);
      expect(mockedExecute).toHaveBeenCalledWith(CommandIDs.gitPush);
    });

    it('should not push changes when the push button is clicked but there is no remote branch', async () => {
      model = await createModel({ remotes: [] });
      const mockedExecute = jest.fn();
      render(
        <PushItem
          {...createActionProps({
            commands: {
              execute: mockedExecute
            } as any
          })}
        />
      );

      await userEvent.click(
        screen.getByRole('button', {
          name: 'No remote repository defined'
        })
      );

      expect(mockedExecute).toHaveBeenCalledTimes(0);
    });
  });

  describe('repository discovery', () => {
    it('should enable the pull and push buttons when the repository is discovered after mount', async () => {
      model = await createModel({ repository: null });
      render(<RemoteActions />);

      expect(screen.queryAllByRole('button')).toHaveLength(0);

      model.pathRepository = DEFAULT_REPOSITORY_PATH;
      await model.ready;

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Pull latest changes' })
        ).toBeEnabled();
        expect(
          screen.getByRole('button', { name: 'Push committed changes' })
        ).toBeEnabled();
      });
    });
  });

  describe('remotes management', () => {
    it('should enable the pull and push buttons when a remote is added', async () => {
      const remotes: Git.IGitRemote[] = [];
      model = await createModel({ remotes });
      render(<RemoteActions />);

      expect(
        await screen.findAllByRole('button', {
          name: 'No remote repository defined'
        })
      ).toHaveLength(2);

      remotes.push({ name: 'origin', url: 'https://origin.com' });
      await model.addRemote('https://origin.com', 'origin');

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Pull latest changes' })
        ).toBeEnabled();
        expect(
          screen.getByRole('button', { name: 'Push committed changes' })
        ).toBeEnabled();
      });
    });

    it('should disable the pull and push buttons when the last remote is removed', async () => {
      const remotes: Git.IGitRemote[] = [...REMOTES];
      model = await createModel({ remotes });
      render(<RemoteActions />);

      expect(
        await screen.findByRole('button', { name: 'Pull latest changes' })
      ).toBeEnabled();

      remotes.length = 0;
      await model.removeRemote('origin');

      await waitFor(() => {
        expect(
          screen.getAllByRole('button', {
            name: 'No remote repository defined'
          })
        ).toHaveLength(2);
      });
    });
  });

  describe('RefreshItem', () => {
    it('should display a button to refresh the current repository', () => {
      render(<RefreshItem {...createProps()} />);

      expect(
        screen.getByRole('button', {
          name: 'Refresh the repository to detect local and remote changes'
        })
      ).toBeDefined();
    });

    it('should refresh the repository when the button to refresh the repository is clicked', async () => {
      const spy = jest.spyOn(model, 'refresh');
      render(<RefreshItem {...createProps()} />);
      await userEvent.click(
        screen.getByRole('button', {
          name: 'Refresh the repository to detect local and remote changes'
        })
      );
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockReset();
      spy.mockRestore();
    });
  });

  describe('RepositoryItem', () => {
    it('should display a non-interactive repository label when there are no submodules', () => {
      const { panel } = createPanelMock();
      render(<RepositoryItem {...createProps()} panel={panel} />);

      // DEFAULT_REPOSITORY_PATH basename is 'repo'.
      expect(screen.getByText('repo')).toBeDefined();
      expect(screen.queryByRole('button', { name: 'repo' })).toBeNull();
    });

    it('should display a repository menu button when submodules are present', async () => {
      model = await createModel({
        submodules: [{ name: 'sub' }]
      });
      const { panel } = createPanelMock();
      render(<RepositoryItem {...createProps()} panel={panel} />);

      expect(screen.getByRole('button', { name: 'repo' })).toBeDefined();
    });

    it('should toggle the submodule menu when the repository menu button is clicked', async () => {
      model = await createModel({
        submodules: [{ name: 'sub' }]
      });
      const { panel, toggleSubmoduleMenu } = createPanelMock();
      render(<RepositoryItem {...createProps()} panel={panel} />);

      await userEvent.click(screen.getByRole('button', { name: 'repo' }));

      expect(toggleSubmoduleMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('BranchItem', () => {
    it('should display the current branch as a static label', () => {
      render(<BranchItem {...createProps()} />);

      expect(screen.getByText('main')).toBeDefined();
      expect(screen.queryByRole('button', { name: /branches/i })).toBeNull();
    });
  });
});
