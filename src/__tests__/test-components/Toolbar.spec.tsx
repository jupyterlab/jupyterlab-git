import { nullTranslator } from '@jupyterlab/translation';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest';
import * as React from 'react';
import { IToolbarProps, Toolbar } from '../../components/Toolbar';
import * as git from '../../git';
import { GitExtension } from '../../model';
import { badgeClass } from '../../style/Toolbar';
import { CommandIDs, Git } from '../../tokens';
import {
  DEFAULT_REPOSITORY_PATH,
  defaultMockedResponses,
  mockedRequestAPI
} from '../utils';

jest.mock('../../git');

const REMOTES = [
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

interface IModelOverrides {
  branches?: Git.IBranch[];
  submodules?: Git.ISubmodule[];
}

async function createModel(
  overrides: IModelOverrides = {}
): Promise<GitExtension> {
  const model = new GitExtension();
  model.pathRepository = DEFAULT_REPOSITORY_PATH;

  await model.ready;

  // The toolbar reads `model.branches`, `model.currentBranch`, `model.status.*`
  // and `model.submodules` directly. The status comes from the polled API
  // response (controlled by `statusMockResponse`), but `branches` /
  // `currentBranch` / `submodules` are populated by methods on the model.
  // Inject test fixtures by type-asserting onto the private fields.
  const _model = model as any;
  _model._branches = overrides.branches ?? DEFAULT_BRANCHES;
  _model._currentBranch =
    (overrides.branches ?? DEFAULT_BRANCHES).find(b => b.is_current_branch) ??
    null;
  if (overrides.submodules) {
    _model._submodules = overrides.submodules;
  }
  return model;
}

function statusMockResponse(ahead = 0, behind = 0, state = Git.State.DEFAULT) {
  return {
    body: () => ({
      code: 0,
      files: [],
      ahead,
      behind,
      state,
      branch: 'main',
      remote: 'origin/main'
    })
  };
}

describe('Toolbar', () => {
  let model: GitExtension;
  const trans = nullTranslator.load('jupyterlab_git');

  function createProps(props?: Partial<IToolbarProps>): IToolbarProps {
    return {
      model: model,
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
    mock.requestAPI.mockImplementation(
      mockedRequestAPI({
        responses: {
          ...defaultMockedResponses,
          'remote/show': {
            body: () => {
              return { code: 0, remotes: REMOTES };
            }
          }
        }
      }) as any
    );

    model = await createModel();
  });

  describe('render', () => {
    it('should display a button to pull the latest changes', async () => {
      render(<Toolbar {...createProps()} />);

      await waitFor(() => {
        expect(
          screen.getAllByRole('button', { name: 'Pull latest changes' })
        ).toBeDefined();
      });

      expect(
        screen
          .getByRole('button', { name: 'Pull latest changes' })
          .parentElement?.querySelector(`.${badgeClass} > .MuiBadge-badge`)
      ).toHaveClass('MuiBadge-invisible');
    });

    it('should display a badge on pull icon if behind', async () => {
      const mock = git as jest.Mocked<typeof git>;
      mock.requestAPI.mockImplementation(
        mockedRequestAPI({
          responses: {
            ...defaultMockedResponses,
            status: statusMockResponse(0, 1),
            'remote/show': {
              body: () => ({ code: 0, remotes: REMOTES })
            }
          }
        }) as any
      );
      model = await createModel();
      render(<Toolbar {...createProps()} />);

      await waitFor(() => {
        expect(
          screen
            .getByRole('button', { name: /^Pull latest changes/ })
            .parentElement?.querySelector(`.${badgeClass} > .MuiBadge-badge`)
        ).not.toHaveClass('MuiBadge-invisible');
      });
    });

    it('should display a button to push the latest changes', async () => {
      render(<Toolbar {...createProps()} />);

      await waitFor(() => {
        expect(
          screen.getAllByRole('button', { name: 'Push committed changes' })
        ).toBeDefined();
      });

      expect(
        screen
          .getByRole('button', { name: 'Push committed changes' })
          .parentElement?.querySelector(`.${badgeClass} > .MuiBadge-badge`)
      ).toHaveClass('MuiBadge-invisible');
    });

    it('should display a badge on push icon if ahead', async () => {
      const mock = git as jest.Mocked<typeof git>;
      mock.requestAPI.mockImplementation(
        mockedRequestAPI({
          responses: {
            ...defaultMockedResponses,
            status: statusMockResponse(1, 0),
            'remote/show': {
              body: () => ({ code: 0, remotes: REMOTES })
            }
          }
        }) as any
      );
      model = await createModel();
      render(<Toolbar {...createProps()} />);

      await waitFor(() => {
        expect(
          screen
            .getByRole('button', { name: /^Push committed changes/ })
            .parentElement?.querySelector(`.${badgeClass} > .MuiBadge-badge`)
        ).not.toHaveClass('MuiBadge-invisible');
      });
    });

    it('should display a button to refresh the current repository', () => {
      render(<Toolbar {...createProps()} />);

      expect(
        screen.getAllByRole('button', {
          name: 'Refresh the repository to detect local and remote changes'
        })
      ).toBeDefined();
    });

    it('should display a non-interactive repository label when there are no submodules', () => {
      render(<Toolbar {...createProps()} />);

      // `DEFAULT_REPOSITORY_PATH` resolves to `path/to/repo`, so the basename
      // displayed in the toolbar is `repo`. With no submodules, this is a
      // plain label rather than a button.
      expect(screen.getByText('repo')).toBeDefined();
      expect(screen.queryByRole('button', { name: 'repo' })).toBeNull();
    });

    it('should display a repository menu button when submodules are present', async () => {
      model = await createModel({
        submodules: [{ name: 'sub', path: 'sub' } as any]
      });
      render(<Toolbar {...createProps()} />);

      // The repo name is now inside a button (because the dropdown for
      // switching submodules is meaningful).
      expect(screen.getByRole('button', { name: 'repo' })).toBeDefined();
    });

    it('should display the current branch as a static label', () => {
      render(<Toolbar {...createProps()} />);

      // The branch name is just text — no `button` role, no click handler.
      expect(screen.getByText('main')).toBeDefined();
      expect(screen.queryByRole('button', { name: /branches/i })).toBeNull();
    });
  });

  describe('push/pull changes with remote', () => {
    it('should pull changes when the button to pull the latest changes is clicked', async () => {
      const mockedExecute = jest.fn();
      render(
        <Toolbar
          {...createProps({
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

    it('should push changes when the button to push the latest changes is clicked', async () => {
      const mockedExecute = jest.fn();
      render(
        <Toolbar
          {...createProps({
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
  });

  describe('push/pull changes without remote', () => {
    beforeEach(async () => {
      jest.restoreAllMocks();

      const mock = git as jest.Mocked<typeof git>;
      mock.requestAPI.mockImplementation(
        mockedRequestAPI({
          responses: {
            ...defaultMockedResponses,
            'remote/show': {
              body: () => {
                return { code: -1, remotes: [] };
              }
            }
          }
        }) as any
      );

      model = await createModel();
    });

    it('should not pull changes when the pull button is clicked but there is no remote branch', async () => {
      const mockedExecute = jest.fn();
      render(
        <Toolbar
          {...createProps({
            commands: {
              execute: mockedExecute
            } as any
          })}
        />
      );

      await userEvent.click(
        screen.getAllByRole('button', {
          name: 'No remote repository defined'
        })[0]
      );

      expect(mockedExecute).toHaveBeenCalledTimes(0);
    });

    it('should not push changes when the push button is clicked but there is no remote branch', async () => {
      const mockedExecute = jest.fn();
      render(
        <Toolbar
          {...createProps({
            commands: {
              execute: mockedExecute
            } as any
          })}
        />
      );
      await userEvent.click(
        screen.getAllByRole('button', {
          name: 'No remote repository defined'
        })[1]
      );
      expect(mockedExecute).toHaveBeenCalledTimes(0);
    });
  });

  describe('refresh repository', () => {
    it('should refresh the repository when the button to refresh the repository is clicked', async () => {
      const spy = jest.spyOn(model, 'refresh');
      render(<Toolbar {...createProps()} />);
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
});
