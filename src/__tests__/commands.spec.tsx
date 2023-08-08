import { JupyterFrontEnd } from '@jupyterlab/application';
import { showDialog } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { nullTranslator } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import 'jest';
import { CommandArguments, addCommands } from '../commandsAndMenu';
import * as git from '../git';
import { GitExtension } from '../model';
import { ContextCommandIDs, CommandIDs, Git } from '../tokens';
import {
  defaultMockedResponses,
  DEFAULT_REPOSITORY_PATH,
  IMockedResponse,
  mockedRequestAPI
} from './utils';

jest.mock('../git');
jest.mock('@jupyterlab/apputils');
jest.mock('@jupyterlab/filebrowser');

describe('git-commands', () => {
  const mockGit = git as jest.Mocked<typeof git>;
  let commands: CommandRegistry;
  let model: GitExtension;
  let mockResponses: {
    [endpoint: string]: IMockedResponse;
  };

  const mockedFileBrowserModel = {
    manager: {
      closeAll: jest
        .fn<Promise<void>, any[]>()
        .mockImplementation(() => Promise.resolve())
    }
  } as any as FileBrowserModel;

  beforeEach(async () => {
    jest.restoreAllMocks();

    mockResponses = {
      ...defaultMockedResponses
    };

    mockGit.requestAPI.mockImplementation(
      mockedRequestAPI({ responses: mockResponses })
    );

    commands = new CommandRegistry();
    const app = {
      commands,
      shell: null as any
    };

    model = new GitExtension(app as any);
    addCommands(
      app as JupyterFrontEnd,
      model,
      mockedFileBrowserModel,
      null,
      nullTranslator
    );
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
            isChecked: null,
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

          if (status === 'staged') {
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

  describe('git:reset-to-remote', () => {
    [true, false].forEach(checked => {
      it(
        checked
          ? 'should close all opened files when the checkbox is checked'
          : 'should not close all opened files when the checkbox is not checked',
        async () => {
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
            isChecked: null,
            value: {
              checked
            } as Git.ICheckboxFormValue
          });

          const spyCloseAll = jest.spyOn(
            mockedFileBrowserModel.manager,
            'closeAll'
          );
          spyCloseAll.mockResolvedValueOnce(undefined);

          mockGit.requestAPI.mockImplementation(
            mockedRequestAPI({
              responses: {
                ...mockResponses,
                reset_to_commit: {
                  body: () => {
                    return { code: 0 };
                  }
                }
              }
            })
          );

          const path = DEFAULT_REPOSITORY_PATH;
          model.pathRepository = path;
          await model.ready;

          await commands.execute(CommandIDs.gitResetToRemote);

          if (checked) {
            expect(spyCloseAll).toHaveBeenCalled();
          } else {
            expect(spyCloseAll).not.toHaveBeenCalled();
          }

          spyCloseAll.mockRestore();
        }
      );
    });
  });
});
