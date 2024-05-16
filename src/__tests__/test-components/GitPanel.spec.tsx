import * as apputils from '@jupyterlab/apputils';
import { nullTranslator } from '@jupyterlab/translation';
import { JSONObject } from '@lumino/coreutils';
import '@testing-library/jest-dom';
import { RenderResult, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest';
import React from 'react';
import { GitPanel, IGitPanelProps } from '../../components/GitPanel';
import * as git from '../../git';
import { GitExtension as GitModel } from '../../model';
import {
  defaultMockedResponses,
  DEFAULT_REPOSITORY_PATH,
  IMockedResponse,
  mockedRequestAPI
} from '../utils';
import { CommandRegistry } from '@lumino/commands';

jest.mock('../../git');
jest.mock('@jupyterlab/apputils');

const mockedResponses: {
  [endpoint: string]: IMockedResponse;
} = {
  ...defaultMockedResponses,
  commit: { body: () => null },
  log: {
    body: () => {
      return {
        code: 0,
        commits: []
      };
    }
  }
};

/**
 * Returns a bare minimum "settings" object for use within the Git panel.
 *
 * @private
 * @returns mock settings
 */
function MockSettings(
  commitAndPush = true,
  promptUserIdentity = false,
  simpleStaging = false
) {
  return {
    changed: {
      connect: () => true,
      disconnect: () => true
    },
    composite: {
      commitAndPush,
      promptUserIdentity,
      simpleStaging
    }
  };
}

describe('GitPanel', () => {
  const trans = nullTranslator.load('jupyterlab_git');

  const props: IGitPanelProps = {
    model: null as any,
    commands: new CommandRegistry(),
    settings: null as any,
    filebrowser: {
      path: '/dummy/path'
    } as any,
    trans: trans
  };

  beforeEach(async () => {
    jest.restoreAllMocks();

    const mock = git as jest.Mocked<typeof git>;
    mock.requestAPI.mockImplementation(
      mockedRequestAPI(mockedResponses) as any
    );

    props.model = new GitModel();
    props.model.pathRepository = DEFAULT_REPOSITORY_PATH;

    props.settings = MockSettings() as any;

    await props.model.ready;
  });

  describe('#constructor()', () => {
    it('should return a new instance', () => {
      const panel = new GitPanel(props);
      expect(panel).toBeInstanceOf(GitPanel);
    });

    it('should set the default commit message summary to an empty string', () => {
      const panel = new GitPanel(props);
      expect(panel.state.commitSummary).toEqual('');
    });

    it('should set the default commit message description to an empty string', () => {
      const panel = new GitPanel(props);
      expect(panel.state.commitDescription).toEqual('');
    });
  });

  describe('#commitFiles()', () => {
    let commitSpy: jest.SpyInstance<Promise<void>>;
    let configSpy: jest.SpyInstance<Promise<void | JSONObject>>;
    let renderResult: RenderResult;

    const commitSummary = 'Fix really stupid bug';
    const commitDescription = 'This will probably break everything :)';
    const commitUser = {
      'user.name': 'John Snow',
      'user.email': 'john.snow@winteris.com'
    };

    const mockUtils = apputils as jest.Mocked<typeof apputils>;
    const dialogValue: apputils.Dialog.IResult<any> = {
      button: {
        accept: true,
        actions: [],
        caption: '',
        className: '',
        displayType: 'default',
        iconClass: '',
        iconLabel: '',
        label: ''
      } as any,
      isChecked: null,
      value: {
        name: commitUser['user.name'],
        email: commitUser['user.email']
      }
    };

    /**
     * Mock identity look up (GitModel.config)
     */
    const mockConfigImplementation = (key: 'user.email' | 'user.name') => {
      return (options?: JSONObject): Promise<JSONObject> => {
        const response = {
          options: {
            [key]: commitUser[key]
          }
        };
        return Promise.resolve<JSONObject>(
          (options === undefined
            ? response // When getting config options
            : null) as any // When setting config options
        );
      };
    };

    beforeEach(() => {
      configSpy = props.model.config = jest.fn();
      commitSpy = props.model.commit = jest.fn();

      // @ts-expect-error set a private prop
      props.model._status = {
        branch: 'master',
        remote: 'origin/master',
        ahead: 0,
        behind: 0,
        files: [
          {
            x: 'M',
            y: ' ',
            to: 'packages/jupyterlab_toastify/README.md',
            from: 'packages/jupyterlab_toastify/README.md',
            is_binary: false,
            status: 'staged'
          }
        ],
        state: 0
      };

      // @ts-expect-error turn off set status
      props.model._setStatus = jest.fn(() => {
        props.model['_statusChanged'].emit(props.model['_status']);
      });

      renderResult = render(<GitPanel {...props} />);
    });

    it('should commit when commit message is provided', async () => {
      configSpy.mockResolvedValue({ options: commitUser });

      await userEvent.type(screen.getAllByRole('textbox')[0], commitSummary);
      await userEvent.type(
        screen.getAllByRole('textbox')[1],
        commitDescription
      );

      await userEvent.click(screen.getByRole('button', { name: 'Commit' }));
      // console.log(
      //   screen.getByRole('button', { name: 'Commit' }).parentElement!.innerHTML
      // );

      await waitFor(() => {
        expect(configSpy).toHaveBeenCalledTimes(1);
      });

      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledWith(
        commitSummary + '\n\n' + commitDescription + '\n',
        false,
        null
      );

      // Only erase commit message upon success
      expect(screen.getAllByRole('textbox')[0]).toHaveValue('');
      expect(screen.getAllByRole('textbox')[1]).toHaveValue('');
    });

    it('should not commit without a commit message', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Commit' }));
      expect(configSpy).not.toHaveBeenCalled();
      expect(commitSpy).not.toHaveBeenCalled();
    });

    it('should prompt for user identity if explicitly configured', async () => {
      configSpy.mockResolvedValue({ options: commitUser });

      props.settings = MockSettings(false, true) as any;
      renderResult.rerender(<GitPanel {...props} />);

      mockUtils.showDialog.mockResolvedValue(dialogValue);

      await userEvent.type(screen.getAllByRole('textbox')[0], commitSummary);
      await userEvent.click(
        screen.getAllByRole('button', { name: 'Commit' })[0]
      );

      expect(configSpy).toHaveBeenCalledTimes(1);
      expect(configSpy.mock.calls[0]).toHaveLength(0);

      const author = `${commitUser['user.name']} <${commitUser['user.email']}>`;
      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledWith(commitSummary, false, author);
    });

    it('should prompt for user identity if user.name is not set', async () => {
      configSpy.mockImplementation(mockConfigImplementation('user.email'));
      mockUtils.showDialog.mockResolvedValue(dialogValue);

      await userEvent.type(screen.getAllByRole('textbox')[0], commitSummary);
      await userEvent.click(screen.getByRole('button', { name: 'Commit' }));

      await waitFor(() => {
        expect(configSpy).toHaveBeenCalledTimes(2);
      });
      expect(configSpy.mock.calls[0]).toHaveLength(0);
      expect(configSpy.mock.calls[1]).toEqual([commitUser]);
      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledWith(commitSummary, false, null);
    });

    it('should prompt for user identity if user.email is not set', async () => {
      configSpy.mockImplementation(mockConfigImplementation('user.name'));
      mockUtils.showDialog.mockResolvedValue(dialogValue);

      await userEvent.type(screen.getAllByRole('textbox')[0], commitSummary);
      await userEvent.click(screen.getByRole('button', { name: 'Commit' }));

      await waitFor(() => {
        expect(configSpy).toHaveBeenCalledTimes(2);
      });
      expect(configSpy.mock.calls[0]).toHaveLength(0);
      expect(configSpy.mock.calls[1]).toEqual([commitUser]);
      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledWith(commitSummary, false, null);
    });

    it('should prompt for user identity if user.name is not set when pathRepository is empty string', async () => {
      props.model.pathRepository = '';
      renderResult.rerender(<GitPanel {...props} />);

      configSpy.mockImplementation(mockConfigImplementation('user.email'));
      mockUtils.showDialog.mockResolvedValue(dialogValue);

      await userEvent.type(screen.getAllByRole('textbox')[0], commitSummary);
      await userEvent.click(screen.getByRole('button', { name: 'Commit' }));

      await waitFor(() => {
        expect(configSpy).toHaveBeenCalledTimes(2);
      });
      expect(configSpy.mock.calls[0]).toHaveLength(0);
      expect(configSpy.mock.calls[1]).toEqual([commitUser]);
      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledWith(commitSummary, false, null);
    });

    it('should prompt for user identity if user.email is not set when pathRepository is empty string', async () => {
      props.model.pathRepository = '';
      renderResult.rerender(<GitPanel {...props} />);
      configSpy.mockImplementation(mockConfigImplementation('user.name'));
      mockUtils.showDialog.mockResolvedValue(dialogValue);

      await userEvent.type(screen.getAllByRole('textbox')[0], commitSummary);
      await userEvent.click(screen.getByRole('button', { name: 'Commit' }));

      await waitFor(() => {
        expect(configSpy).toHaveBeenCalledTimes(2);
      });
      expect(configSpy.mock.calls[0]).toHaveLength(0);
      expect(configSpy.mock.calls[1]).toEqual([commitUser]);
      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledWith(commitSummary, false, null);
    });

    it('should not commit if no user identity is set and the user rejects the dialog when pathRepository is empty string', async () => {
      props.model.pathRepository = '';
      renderResult.rerender(<GitPanel {...props} />);
      configSpy.mockResolvedValue({ options: {} });
      mockUtils.showDialog.mockResolvedValue({
        button: {
          ...dialogValue.button,
          accept: false
        },
        isChecked: null,
        value: null
      });

      await userEvent.type(screen.getAllByRole('textbox')[0], commitSummary);
      await userEvent.type(
        screen.getAllByRole('textbox')[1],
        commitDescription
      );
      await userEvent.click(screen.getByRole('button', { name: 'Commit' }));

      await waitFor(() => expect(configSpy).toHaveBeenCalledTimes(1));
      expect(configSpy).toHaveBeenCalledWith();
      expect(commitSpy).not.toHaveBeenCalled();

      // Should not erase commit message
      expect(screen.getAllByRole('textbox')[0]).toHaveValue(commitSummary);
      expect(screen.getAllByRole('textbox')[1]).toHaveValue(commitDescription);
    });

    it('should not commit if no user identity is set and the user rejects the dialog', async () => {
      configSpy.mockResolvedValue({ options: {} });
      mockUtils.showDialog.mockResolvedValue({
        button: {
          ...dialogValue.button,
          accept: false
        },
        isChecked: null,
        value: null
      });

      await userEvent.type(screen.getAllByRole('textbox')[0], commitSummary);
      await userEvent.type(
        screen.getAllByRole('textbox')[1],
        commitDescription
      );
      await userEvent.click(screen.getByRole('button', { name: 'Commit' }));

      await waitFor(() => expect(configSpy).toHaveBeenCalledTimes(1));
      expect(configSpy).toHaveBeenCalledWith();
      expect(commitSpy).not.toHaveBeenCalled();

      // Should not erase commit message
      expect(screen.getAllByRole('textbox')[0]).toHaveValue(commitSummary);
      expect(screen.getAllByRole('textbox')[1]).toHaveValue(commitDescription);
    });
  });

  describe('#render()', () => {
    beforeEach(() => {
      props.model = {
        branches: [],
        status: {},
        stashChanged: {
          connect: jest.fn()
        },
        branchesChanged: {
          connect: jest.fn()
        },
        headChanged: {
          connect: jest.fn()
        },
        tagsChanged: {
          connect: jest.fn()
        },
        markChanged: {
          connect: jest.fn()
        },
        repositoryChanged: {
          connect: jest.fn()
        },
        statusChanged: {
          connect: jest.fn()
        },
        selectedHistoryFileChanged: {
          connect: jest.fn()
        },
        notifyRemoteChanges: {
          connect: jest.fn()
        },
        dirtyFilesStatusChanged: {
          connect: jest.fn()
        },
        remoteChanged: {
          connect: jest.fn()
        }
      } as any;

      props.settings = MockSettings() as any;
    });

    it('should render Commit and Push if there is a remote branch', () => {
      (props.model as any).branches = [
        {
          is_remote_branch: true,
          is_current_branch: false,
          name: 'remote',
          tag: null,
          top_commit: 'hash',
          upstream: 'origin'
        }
      ];
      (props.model as any).pathRepository = '/path';

      render(<GitPanel {...props} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[buttons.length - 2]).toHaveTextContent('Commit and Push');
    });

    it('should render Commit if there is no remote branch', () => {
      (props.model as any).branches = [
        {
          is_remote_branch: false,
          is_current_branch: false,
          name: 'local',
          tag: null,
          top_commit: 'hash',
          upstream: null
        }
      ];
      (props.model as any).pathRepository = '/path';

      render(<GitPanel {...props} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[buttons.length - 2]).toHaveTextContent('Commit');
    });

    it('should render Commit if there is a remote branch but commitAndPush is false', () => {
      (props.model as any).branches = [
        {
          is_remote_branch: true,
          is_current_branch: false,
          name: 'remote',
          tag: null,
          top_commit: 'hash',
          upstream: 'origin'
        }
      ];
      (props.model as any).pathRepository = '/path';
      props.settings = MockSettings(false) as any;

      render(<GitPanel {...props} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[buttons.length - 2]).toHaveTextContent('Commit');
    });
  });
});
