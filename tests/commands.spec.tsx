import { JupyterFrontEnd } from '@jupyterlab/application';
import { showDialog } from '@jupyterlab/apputils';
import { nullTranslator } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import 'jest';
import { CommandArguments, addCommands } from '../src/commandsAndMenu';
import * as git from '../src/git';
import { GitExtension } from '../src/model';
import { ContextCommandIDs, CommandIDs, Git } from '../src/tokens';
import {
  defaultMockedResponses,
  DEFAULT_REPOSITORY_PATH,
  IMockedResponses,
  mockedRequestAPI
} from './utils';

jest.mock('../src/git');
jest.mock('@jupyterlab/apputils');

describe('git-commands', () => {
  const mockGit = git as jest.Mocked<typeof git>;
  let commands: CommandRegistry;
  let model: GitExtension;
  let mockResponses: IMockedResponses;

  beforeEach(async () => {
    jest.restoreAllMocks();

    mockResponses = {
      ...defaultMockedResponses
    };

    mockGit.requestAPI.mockImplementation(mockedRequestAPI(mockResponses));

    commands = new CommandRegistry();
    const app = {
      commands,
      shell: null as any
    };

    model = new GitExtension(app as any);
    addCommands(app as JupyterFrontEnd, model, null, null, nullTranslator);
  });

  describe('git:add-remote', () => {
    it('should admit user and name arguments', async () => {
      const name = 'ref';
      const url = 'https://www.mygitserver.com/me/myrepo.git';
      const path = DEFAULT_REPOSITORY_PATH;

      mockGit.requestAPI.mockImplementation(
        mockedRequestAPI({
          ...mockResponses,
          'remote/add': {
            body: () => {
              return { code: 0, command: `git remote add ${name} ${url}` };
            }
          }
        })
      );

      model.pathRepository = path;
      await model.ready;

      await commands.execute(CommandIDs.gitAddRemote, { url, name });

      expect(mockGit.requestAPI).toBeCalledWith(`${path}/remote/add`, 'POST', {
        url,
        name
      });
    });

    it('has optional argument name', async () => {
      const name = 'origin';
      const url = 'https://www.mygitserver.com/me/myrepo.git';
      const path = DEFAULT_REPOSITORY_PATH;

      mockGit.requestAPI.mockImplementation(
        mockedRequestAPI({
          ...mockResponses,
          'remote/add': {
            body: () => {
              return { code: 0, command: `git remote add ${name} ${url}` };
            }
          }
        })
      );

      model.pathRepository = path;
      await model.ready;

      await commands.execute(CommandIDs.gitAddRemote, { url });

      expect(mockGit.requestAPI).toBeCalledWith(`${path}/remote/add`, 'POST', {
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
              actions: [],
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
          model.pathRepository = DEFAULT_REPOSITORY_PATH;
          await model.ready;

          await commands.execute(ContextCommandIDs.gitFileDiscard, {
            files: [
              {
                x,
                y: ' ',
                from: 'from',
                to: path,
                status: status as Git.Status,
                is_binary: false
              }
            ]
          } as CommandArguments.IGitContextAction as any);

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
