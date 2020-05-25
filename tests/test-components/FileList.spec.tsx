import { showDialog } from '@jupyterlab/apputils';
import { CommandRegistry } from '@lumino/commands';
import 'jest';
import { GitExtension } from '../../src/model';
import { FileList } from '../../src/components/FileList';

import { httpGitRequest } from '../../src/git';

jest.mock('../../src/git');
jest.mock('@jupyterlab/apputils');
jest.mock('@lumino/commands');

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
  const model = new GitExtension();
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

    [' ', 'M', 'A'].forEach(x => {
      it(`should reset${x !== 'A' ? ' and checkout' : ''}`, async () => {
        const mockDialog = showDialog as jest.MockedFunction<typeof showDialog>;
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
        spyReset.mockResolvedValueOnce(undefined);

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
          status: 'staged',
          is_binary: false
        });
        expect(spyReset).toHaveBeenCalledWith(path);
        if (x !== 'A') {
          expect(spyCheckout).toHaveBeenCalledWith({ filename: path });
        } else {
          expect(spyCheckout).not.toHaveBeenCalled();
        }

        spyReset.mockRestore();
        spyCheckout.mockRestore();
      });
    });
  });
});
