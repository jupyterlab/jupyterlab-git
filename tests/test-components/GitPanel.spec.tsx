import * as apputils from '@jupyterlab/apputils';
import { nullTranslator } from '@jupyterlab/translation';
import { JSONObject } from '@lumino/coreutils';
import { shallow } from 'enzyme';
import 'jest';
import React from 'react';
import { CommitBox } from '../../src/components/CommitBox';
import { GitPanel, IGitPanelProps } from '../../src/components/GitPanel';
import * as git from '../../src/git';
import { Logger } from '../../src/logger';
import { GitExtension as GitModel } from '../../src/model';
import {
  defaultMockedResponses,
  DEFAULT_REPOSITORY_PATH,
  IMockedResponses,
  mockedRequestAPI
} from '../utils';

jest.mock('../../src/git');
jest.mock('@jupyterlab/apputils');

const mockedResponses: IMockedResponses = {
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
function MockSettings(commitAndPush = true) {
  return {
    changed: {
      connect: () => true,
      disconnect: () => true
    },
    composite: {
      commitAndPush
    }
  };
}

describe('GitPanel', () => {
  const trans = nullTranslator.load('jupyterlab-git');

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

  describe('#commitStagedFiles()', () => {
    let spy: jest.SpyInstance<Promise<void>>;

    beforeEach(() => {
      spy = jest.spyOn(GitModel.prototype, 'commit').mockResolvedValue();
    });

    it('should commit when commit message is provided', async () => {
      // Mock identity look up
      const identity = jest
        .spyOn(GitModel.prototype, 'config')
        .mockResolvedValue({
          options: {
            'user.name': 'John Snow',
            'user.email': 'john.snow@winteris.com'
          }
        });

      const panel = new GitPanel(props);
      await panel.commitStagedFiles('Initial commit');
      expect(identity).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('Initial commit');
    });

    it('should not commit without a commit message', async () => {
      const panel = new GitPanel(props);
      await panel.commitStagedFiles('');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should prompt for user identity if user.name is not set', async () => {
      // Mock identity look up
      const identity = jest
        .spyOn(GitModel.prototype, 'config')
        .mockImplementation(options => {
          let response: JSONObject = null;
          if (options === undefined) {
            response = {
              options: {
                'user.email': 'john.snow@winteris.com'
              }
            };
          }
          return Promise.resolve(response);
        });
      const mock = apputils as jest.Mocked<typeof apputils>;
      mock.showDialog.mockResolvedValue({
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
        value: {
          name: 'John Snow',
          email: 'john.snow@winteris.com'
        }
      });

      const panel = new GitPanel(props);
      await panel.commitStagedFiles('Initial commit');
      expect(identity).toHaveBeenCalledTimes(2);
      expect(identity.mock.calls[0]).toHaveLength(0);
      expect(identity.mock.calls[1]).toEqual([
        {
          'user.name': 'John Snow',
          'user.email': 'john.snow@winteris.com'
        }
      ]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('Initial commit');
    });

    it('should prompt for user identity if user.email is not set', async () => {
      // Mock identity look up
      const identity = jest
        .spyOn(GitModel.prototype, 'config')
        .mockImplementation(options => {
          let response: JSONObject = null;
          if (options === undefined) {
            response = {
              options: {
                'user.name': 'John Snow'
              }
            };
          }
          return Promise.resolve(response);
        });
      const mock = apputils as jest.Mocked<typeof apputils>;
      mock.showDialog.mockResolvedValue({
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
        value: {
          name: 'John Snow',
          email: 'john.snow@winteris.com'
        }
      });

      const panel = new GitPanel(props);
      await panel.commitStagedFiles('Initial commit');
      expect(identity).toHaveBeenCalledTimes(2);
      expect(identity.mock.calls[0]).toHaveLength(0);
      expect(identity.mock.calls[1]).toEqual([
        {
          'user.name': 'John Snow',
          'user.email': 'john.snow@winteris.com'
        }
      ]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('Initial commit');
    });

    it('should not commit if no user identity is set and the user rejects the dialog', async () => {
      // Mock identity look up
      const identity = jest
        .spyOn(GitModel.prototype, 'config')
        .mockImplementation(options => {
          let response: JSONObject = null;
          if (options === undefined) {
            response = {
              options: {}
            };
          }
          return Promise.resolve(response);
        });
      const mock = apputils as jest.Mocked<typeof apputils>;
      mock.showDialog.mockResolvedValue({
        button: {
          accept: false,
          actions: [],
          caption: '',
          className: '',
          displayType: 'default',
          iconClass: '',
          iconLabel: '',
          label: ''
        },
        value: null
      });

      const panel = new GitPanel(props);
      try {
        await panel.commitStagedFiles('Initial commit');
      } catch (error) {
        expect(error.message).toEqual(
          'Failed to set your identity. User refused to set identity.'
        );
      }
      expect(identity).toHaveBeenCalledTimes(1);
      expect(identity).toHaveBeenCalledWith();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('#render()', () => {
    beforeEach(() => {
      props.commands = {
        keyBindings: { find: jest.fn() }
      } as any;
      props.model = {
        branches: [],
        headChanged: {
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
