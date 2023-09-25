import * as apputils from '@jupyterlab/apputils';
import { nullTranslator } from '@jupyterlab/translation';
import { JSONObject } from '@lumino/coreutils';
import { shallow } from 'enzyme';
import 'jest';
import React from 'react';
import { CommitBox } from '../../components/CommitBox';
import { GitPanel, IGitPanelProps } from '../../components/GitPanel';
import * as git from '../../git';
import { Logger } from '../../logger';
import { GitExtension as GitModel } from '../../model';
import {
  defaultMockedResponses,
  DEFAULT_REPOSITORY_PATH,
  IMockedResponse,
  mockedRequestAPI
} from '../utils';

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
function MockSettings(commitAndPush = true, promptUserIdentity = false) {
  return {
    changed: {
      connect: () => true,
      disconnect: () => true
    },
    composite: {
      commitAndPush,
      promptUserIdentity
    }
  };
}

describe('GitPanel', () => {
  const trans = nullTranslator.load('jupyterlab_git');

  const props: IGitPanelProps = {
    model: null,
    commands: null,
    logger: new Logger(),
    settings: null,
    filebrowser: {
      path: '/dummy/path'
    } as any,
    trans: trans
  };

  beforeEach(async () => {
    jest.restoreAllMocks();

    const mock = git as jest.Mocked<typeof git>;
    mock.requestAPI.mockImplementation(mockedRequestAPI(mockedResponses));

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
    let panel: GitPanel;
    let commitSpy: jest.SpyInstance<Promise<void>>;
    let configSpy: jest.SpyInstance<Promise<void | JSONObject>>;

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
      },
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
          options === undefined
            ? response // When getting config options
            : null // When setting config options
        );
      };
    };

    beforeEach(() => {
      commitSpy = jest.spyOn(GitModel.prototype, 'commit').mockResolvedValue();
      configSpy = jest.spyOn(GitModel.prototype, 'config');

      const panelWrapper = shallow<GitPanel>(<GitPanel {...props} />);
      panel = panelWrapper.instance();
    });

    it('should commit when commit message is provided', async () => {
      configSpy.mockResolvedValue({ options: commitUser });
      panel.setState({ commitSummary, commitDescription });
      await panel.commitFiles();
      expect(configSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledWith(
        commitSummary + '\n\n' + commitDescription + '\n',
        false,
        null
      );

      // Only erase commit message upon success
      expect(panel.state.commitSummary).toEqual('');
      expect(panel.state.commitDescription).toEqual('');
    });

    it('should not commit without a commit message', async () => {
      await panel.commitFiles();
      expect(configSpy).not.toHaveBeenCalled();
      expect(commitSpy).not.toHaveBeenCalled();
    });

    it('should prompt for user identity if explicitly configured', async () => {
      configSpy.mockResolvedValue({ options: commitUser });

      props.settings = MockSettings(false, true) as any;
      const panelWrapper = shallow<GitPanel>(<GitPanel {...props} />);
      panel = panelWrapper.instance();

      mockUtils.showDialog.mockResolvedValue(dialogValue);

      panel.setState({ commitSummary });

      await panel.commitFiles();
      expect(configSpy).toHaveBeenCalledTimes(1);
      expect(configSpy.mock.calls[0]).toHaveLength(0);

      const author = `${commitUser['user.name']} <${commitUser['user.email']}>`;
      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledWith(commitSummary, false, author);
    });

    it('should prompt for user identity if user.name is not set', async () => {
      configSpy.mockImplementation(mockConfigImplementation('user.email'));
      mockUtils.showDialog.mockResolvedValue(dialogValue);

      panel.setState({ commitSummary });

      await panel.commitFiles();
      expect(configSpy).toHaveBeenCalledTimes(2);
      expect(configSpy.mock.calls[0]).toHaveLength(0);
      expect(configSpy.mock.calls[1]).toEqual([commitUser]);
      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledWith(commitSummary, false, null);
    });

    it('should prompt for user identity if user.email is not set', async () => {
      configSpy.mockImplementation(mockConfigImplementation('user.name'));
      mockUtils.showDialog.mockResolvedValue(dialogValue);

      panel.setState({ commitSummary });
      await panel.commitFiles();
      expect(configSpy).toHaveBeenCalledTimes(2);
      expect(configSpy.mock.calls[0]).toHaveLength(0);
      expect(configSpy.mock.calls[1]).toEqual([commitUser]);
      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(commitSpy).toHaveBeenCalledWith(commitSummary, false, null);
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

      panel.setState({ commitSummary, commitDescription });
      try {
        await panel.commitFiles();
      } catch (error) {
        expect(error.message).toEqual(
          'Failed to set your identity. User refused to set identity.'
        );
      }
      expect(configSpy).toHaveBeenCalledTimes(1);
      expect(configSpy).toHaveBeenCalledWith();
      expect(commitSpy).not.toHaveBeenCalled();

      // Should not erase commit message
      expect(panel.state.commitSummary).toEqual(commitSummary);
      expect(panel.state.commitDescription).toEqual(commitDescription);
    });
  });

  describe('#render()', () => {
    beforeEach(() => {
      props.commands = {
        keyBindings: { find: jest.fn() }
      } as any;
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

      const panel = shallow(<GitPanel {...props} />);
      panel.setState({
        repository: '/path'
      });
      expect(panel.find(CommitBox).prop('label')).toEqual('Commit and Push');
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

      const panel = shallow(<GitPanel {...props} />);
      panel.setState({
        repository: '/path'
      });
      expect(panel.find(CommitBox).prop('label')).toEqual('Commit');
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
      props.settings = MockSettings(false) as any;

      const panel = shallow(<GitPanel {...props} />);
      panel.setState({
        repository: '/path'
      });
      expect(panel.find(CommitBox).prop('label')).toEqual('Commit');
    });
  });
});
