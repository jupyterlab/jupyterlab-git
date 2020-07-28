import { showDialog } from '@jupyterlab/apputils';
import { CommandRegistry } from '@phosphor/commands';
import 'jest';
import { GitExtension } from '../../src/model';
import { FileList } from '../../src/components/FileList';

import { httpGitRequest } from '../../src/git';
import { Git } from '../../src/tokens';

jest.mock('../../src/git');
jest.mock('@jupyterlab/apputils');
jest.mock('@phosphor/commands');

function request(url: string, method: string, request: Object | null) {
  let response: Response;
  switch (url) {
    case '/git/branch':
      response = new Response(
        JSON.stringify({
          code: 0,
          branches: [],
          current_branch: null
        })
      );
      break;
    case '/git/server_root':
      response = new Response(
        JSON.stringify({
          server_root: '/foo'
        })
      );
      break;
    case '/git/show_top_level':
      response = new Response(
        JSON.stringify({
          code: 0,
          top_repo_path: (request as any)['current_path']
        })
      );
      break;
    case '/git/status':
      response = new Response(
        JSON.stringify({
          code: 0,
          files: []
        })
      );
      break;
    default:
      response = new Response(
        `{"message": "No mock implementation for ${url}."}`,
        { status: 404 }
      );
  }
  return Promise.resolve(response);
}

async function createModel() {
  const model = new GitExtension('/path/to/server');
  model.pathRepository = '/path/to/repo';
  const mockedCommands = jest.spyOn(model, 'commands', 'get');
  mockedCommands.mockImplementation(() => new CommandRegistry());

  await model.ready;
  return model;
}

describe('FileList', () => {
  describe('#discardChanges', () => {
    let model: GitExtension;
    beforeAll(async () => {
      (CommandRegistry as any).mockImplementation(() => {
        return {
          hasCommand: () => true
        };
      });

      const mockRequest = httpGitRequest as jest.MockedFunction<
        typeof httpGitRequest
      >;
      mockRequest.mockImplementation(request);

      model = await createModel();
    });

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

          const component = new FileList({
            model,
            files: [],
            renderMime: null,
            settings: null
          });
          await component.discardChanges({
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
