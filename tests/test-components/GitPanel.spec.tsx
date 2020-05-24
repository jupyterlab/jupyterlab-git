import * as apputils from '@jupyterlab/apputils';
import 'jest';
import { GitExtension as GitModel } from '../../src/model';
import * as git from '../../src/git';
import { GitPanel, IGitSessionNodeProps } from '../../src/components/GitPanel';

jest.mock('../../src/git');
jest.mock('@jupyterlab/apputils');

function MockRequest(url: string, method: string, request: any) {
  let response: Response;
  let obj: any;
  switch (url) {
    case '/git/branch':
      obj = {
        code: 0,
        branches: [],
        current_branch: null
      };
      response = new Response(JSON.stringify(obj));
      break;
    case '/git/commit':
      response = new Response();
      break;
    case '/git/log':
      obj = {
        code: 0,
        commits: []
      };
      response = new Response(JSON.stringify(obj));
      break;
    case '/git/server_root':
      obj = {
        server_root: '/foo'
      };
      response = new Response(JSON.stringify(obj));
      break;
    case '/git/show_top_level':
      obj = {
        code: 0,
        top_repo_path: (request as any)['current_path']
      };
      response = new Response(JSON.stringify(obj));
      break;
    case '/git/status':
      obj = {
        code: 0,
        files: []
      };
      response = new Response(JSON.stringify(obj));
      break;
    default:
      obj = {
        message: `No mock implementation for ${url}.`
      };
      response = new Response(JSON.stringify(obj), { status: 404 });
  }
  return Promise.resolve(response);
}

/**
 * Returns a bare minimum "settings" object for use within the Git panel.
 *
 * @private
 * @returns mock settings
 */
function MockSettings() {
  return {
    changed: {
      connect: () => true,
      disconnect: () => true
    },
    composite: {}
  };
}

describe('GitPanel', () => {
  describe('#commitStagedFiles()', () => {
    const props: IGitSessionNodeProps = {
      model: null,
      renderMime: null,
      settings: null,
      filebrowser: null
    };

    beforeEach(async () => {
      jest.restoreAllMocks();

      const mock = git as jest.Mocked<typeof git>;
      mock.httpGitRequest.mockImplementation(MockRequest);

      const app = {
        commands: {
          hasCommand: jest.fn().mockReturnValue(true)
        }
      };
      props.model = new GitModel(app as any);
      props.model.pathRepository = '/path/to/repo';

      // @ts-ignore
      props.settings = MockSettings();

      await props.model.ready;
    });

    it('should commit when commit message is provided', async () => {
      const spy = jest.spyOn(GitModel.prototype, 'commit');

      // Mock identity look up
      const identity = jest
        .spyOn(GitModel.prototype, 'config')
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              options: {
                'user.name': 'John Snow',
                'user.email': 'john.snow@winteris.com'
              }
            }),
            { status: 201 }
          )
        );

      const panel = new GitPanel(props);
      await panel.commitStagedFiles('Initial commit');
      expect(identity).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('Initial commit');
    });

    it('should not commit without a commit message', async () => {
      const spy = jest.spyOn(GitModel.prototype, 'commit');
      const panel = new GitPanel(props);
      await panel.commitStagedFiles('');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should prompt for user identity if user.name is not set', async () => {
      const spy = jest.spyOn(GitModel.prototype, 'commit');

      // Mock identity look up
      const identity = jest
        .spyOn(GitModel.prototype, 'config')
        .mockImplementation(options => {
          let response: Response = null;
          if (options === undefined) {
            response = new Response(
              JSON.stringify({
                options: {
                  'user.email': 'john.snow@winteris.com'
                }
              }),
              { status: 201 }
            );
          } else {
            response = new Response('', { status: 201 });
          }
          return Promise.resolve(response);
        });
      const mock = apputils as jest.Mocked<typeof apputils>;
      mock.showDialog.mockResolvedValue({
        button: {
          accept: true,
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
      const spy = jest.spyOn(GitModel.prototype, 'commit');

      // Mock identity look up
      const identity = jest
        .spyOn(GitModel.prototype, 'config')
        .mockImplementation(options => {
          let response: Response = null;
          if (options === undefined) {
            response = new Response(
              JSON.stringify({
                options: {
                  'user.name': 'John Snow'
                }
              }),
              { status: 201 }
            );
          } else {
            response = new Response('', { status: 201 });
          }
          return Promise.resolve(response);
        });
      const mock = apputils as jest.Mocked<typeof apputils>;
      mock.showDialog.mockResolvedValue({
        button: {
          accept: true,
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
      const spy = jest.spyOn(GitModel.prototype, 'commit');

      // Mock identity look up
      const identity = jest
        .spyOn(GitModel.prototype, 'config')
        .mockImplementation(options => {
          let response: Response = null;
          if (options === undefined) {
            response = new Response(
              JSON.stringify({
                options: {}
              }),
              { status: 201 }
            );
          } else {
            response = new Response('', { status: 201 });
          }
          return Promise.resolve(response);
        });
      const mock = apputils as jest.Mocked<typeof apputils>;
      mock.showDialog.mockResolvedValue({
        button: {
          accept: false,
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
      await panel.commitStagedFiles('Initial commit');
      expect(identity).toHaveBeenCalledTimes(1);
      expect(identity).toHaveBeenCalledWith();
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
