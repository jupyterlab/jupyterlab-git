import { JupyterFrontEnd } from '@jupyterlab/application';
import { showDialog } from '@jupyterlab/apputils';
import { CommandRegistry } from '@lumino/commands';
import 'jest';
import { addCommands, CommandIDs } from '../src/commandsAndMenu';
import * as git from '../src/git';
import { GitExtension } from '../src/model';
import { Git } from '../src/tokens';

jest.mock('../src/git');
jest.mock('@jupyterlab/apputils');

describe('git-commands', () => {
  const mockGit = git as jest.Mocked<typeof git>;
  let commands: CommandRegistry;
  let model: GitExtension;
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
    addCommands(app as JupyterFrontEnd, model, null, null, null);
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

  describe('git:context-discard', () => {
    ['staged', 'partially-staged', 'unstaged', 'untracked'].forEach(status => {
      [' ', 'M', 'A'].forEach(x => {
        it(`status:${status} - x:${x} may reset and/or checkout`, async () => {
          const mockDialog = showDialog as jest.MockedFunction<
            typeof showDialog
          >;
          mockDialog.mockResolvedValue({
            button: {
              accept: true,
              caption: '',
              className: '',
              displayType: 'default',
              iconClass: '',
              iconLabel: '',
              label: ''
            },
            value: undefined
          });
          const spyReset = jest.spyOn(model, 'reset');
          spyReset.mockResolvedValueOnce(undefined);
          const spyCheckout = jest.spyOn(model, 'checkout');
          spyCheckout.mockResolvedValueOnce(undefined);

          const path = 'file/path.ext';
          model.pathRepository = '/path/to/repo';
          await model.ready;

          await commands.execute(CommandIDs.gitFileDiscard, {
            x,
            y: ' ',
            from: 'from',
            to: path,
            status: status as Git.Status,
            is_binary: false
          });

          if (status === 'staged' || status === 'partially-staged') {
            expect(spyReset).toHaveBeenCalledWith(path);
          } else if (status === 'unstaged') {
            expect(spyReset).not.toHaveBeenCalled();
            expect(spyCheckout).toHaveBeenCalledWith({ filename: path });
          } else if (status === 'partially-staged') {
            expect(spyReset).toHaveBeenCalledWith(path);
            if (x !== 'A') {
              expect(spyCheckout).toHaveBeenCalledWith({ filename: path });
            } else {
              expect(spyCheckout).not.toHaveBeenCalled();
            }
          }

          spyReset.mockRestore();
          spyCheckout.mockRestore();
        });
      });
    });
  });
});
