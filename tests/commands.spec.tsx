import 'jest';
import * as git from '../src/git';
import { GitExtension } from '../src/model';
import { IGitExtension } from '../src/tokens';

import { CommandIDs, addCommands } from '../src/gitMenuCommands';
import { CommandRegistry } from '@lumino/commands';
import { JupyterFrontEnd } from '@jupyterlab/application';

jest.mock('../src/git');

describe('git-commands', () => {
  const mockGit = git as jest.Mocked<typeof git>;
  const fakeRoot = '/path/to/server';
  let commands: CommandRegistry;
  let model: IGitExtension;
  let mockResponses: {
    [url: string]: {
      body?: (request: Object) => string;
      status?: number;
    };
  };

  beforeEach(async () => {
    jest.restoreAllMocks();

    mockResponses = {
      '/git/branch': {
        body: request =>
          JSON.stringify({
            code: 0,
            branches: [],
            current_branch: null
          })
      },
      '/git/show_top_level': {
        body: request =>
          JSON.stringify({
            code: 0,
            top_repo_path: (request as any)['current_path']
          })
      },
      '/git/server_root': {
        body: () =>
          JSON.stringify({
            server_root: fakeRoot
          })
      },
      '/git/status': {
        body: () =>
          JSON.stringify({
            code: 0,
            files: []
          })
      }
    };

    mockGit.httpGitRequest.mockImplementation((url, method, request) => {
      let response: Response;
      if (url in mockResponses) {
        response = new Response(
          mockResponses[url].body
            ? mockResponses[url].body(request)
            : undefined,
          {
            status: mockResponses[url].status
          }
        );
      } else {
        response = new Response(
          `{"message": "No mock implementation for ${url}."}`,
          { status: 404 }
        );
      }
      return Promise.resolve(response);
    });

    commands = new CommandRegistry();
    const app = {
      commands,
      shell: null as any
    };
    model = new GitExtension(app as any);
    addCommands(app as JupyterFrontEnd, model, null, null);
  });

  describe('git:add-remote', () => {
    it('should admit user and name arguments', async () => {
      const name = 'ref';
      const url = 'https://www.mygitserver.com/me/myrepo.git';
      const path = '/path/to/repo';

      mockResponses = {
        ...mockResponses,
        '/git/remote/add': {
          body: () => `{"code": 0, "command": "git remote add ${name} ${url}"}`
        }
      };

      model.pathRepository = path;
      await model.ready;

      await commands.execute(CommandIDs.gitAddRemote, { url, name });

      expect(mockGit.httpGitRequest).toBeCalledWith('/git/remote/add', 'POST', {
        top_repo_path: path,
        url,
        name
      });
    });

    it('has optional argument name', async () => {
      const name = 'origin';
      const url = 'https://www.mygitserver.com/me/myrepo.git';
      const path = '/path/to/repo';

      mockResponses = {
        ...mockResponses,
        '/git/remote/add': {
          body: () => `{"code": 0, "command": "git remote add ${name} ${url}"}`
        }
      };

      model.pathRepository = path;
      await model.ready;

      await commands.execute(CommandIDs.gitAddRemote, { url });

      expect(mockGit.httpGitRequest).toBeCalledWith('/git/remote/add', 'POST', {
        top_repo_path: path,
        url
      });
    });
  });
});
