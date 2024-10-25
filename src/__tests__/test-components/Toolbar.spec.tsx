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
import { CommandIDs } from '../../tokens';
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
      currentBranch: 'main',
      branches: [
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
      ],
      tagsList: model.tagsList,
      pastCommits: [],
      repository: model.pathRepository!,
      model: model,
      branching: false,
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

  describe('constructor', () => {
    it('should set the default flag indicating whether to show a branch menu to `false`', () => {
      render(<Toolbar {...createProps()} />);

      expect(screen.queryByText('Branches')).toBeNull();
    });
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
      render(<Toolbar {...createProps({ nCommitsBehind: 1 })} />);

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

    it('should display a badge on push icon if behind', async () => {
      render(<Toolbar {...createProps({ nCommitsAhead: 1 })} />);

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

    it('should display a button to toggle a repository menu', () => {
      render(<Toolbar {...createProps()} />);

      expect(screen.getByText('Current Repository')).toBeDefined();
    });

    it('should display a button to toggle a branch menu', () => {
      render(<Toolbar {...createProps()} />);

      expect(screen.getByText('Current Branch')).toBeDefined();
    });

    it('should set the `title` attribute on the button to toggle a branch menu', () => {
      const currentBranch = 'main';
      render(<Toolbar {...createProps({ currentBranch })} />);

      expect(
        screen.getByRole('button', { name: /^Current Branch/ })
      ).toHaveAttribute('title', 'Manage branches and tags');
    });
  });

  describe('branch menu', () => {
    it('should not, by default, display a branch menu', () => {
      render(<Toolbar {...createProps()} />);

      expect(screen.queryByText('Branches')).toBeNull();
    });

    it('should display a branch menu when the button to display a branch menu is clicked', async () => {
      render(<Toolbar {...createProps()} />);

      await userEvent.click(
        screen.getByRole('button', { name: /^Current Branch/ })
      );

      expect(screen.getByText('Branches')).toBeDefined();
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
