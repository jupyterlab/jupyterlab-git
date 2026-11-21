import { CommandRegistry } from '@lumino/commands';
import { Signal } from '@lumino/signaling';
import { Notification, showDialog } from '@jupyterlab/apputils';
import { TranslationBundle, nullTranslator } from '@jupyterlab/translation';
import { gitCloneCommandPlugin } from '../cloneCommand';
import { CommandIDs } from '../tokens';
import { GitCloneForm } from '../widgets/GitCloneForm';

jest.mock('@jupyterlab/apputils', () => {
  const actual = jest.requireActual('@jupyterlab/apputils');
  return {
    ...actual,
    showDialog: jest.fn(),
    Notification: {
      ...actual.Notification,
      emit: jest.fn().mockReturnValue('notification-id'),
      update: jest.fn()
    }
  };
});

const trans = { __: (s: string) => s } as TranslationBundle;

describe('GitCloneForm wording', () => {
  it('clearly labels the download checkbox as a snapshot without Git history', () => {
    const form = new GitCloneForm(trans);
    const downloadCheckbox = form.node.querySelector(
      '#download'
    ) as HTMLInputElement;
    const label = downloadCheckbox.parentElement as HTMLLabelElement;

    expect(label.textContent).toContain('without Git history');
    expect(label.title).toContain('.git');
  });
});

describe('gitCloneCommandPlugin notifications', () => {
  const mockShowDialog = showDialog as jest.MockedFunction<typeof showDialog>;
  const mockEmit = Notification.emit as jest.MockedFunction<
    typeof Notification.emit
  >;
  const mockUpdate = Notification.update as jest.MockedFunction<
    typeof Notification.update
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setupCommand() {
    const commands = new CommandRegistry();
    const app = {
      commands,
      contextMenu: { addItem: jest.fn(), menu: { commands } },
      serviceManager: {
        contents: {
          localPath: (path: string) => path
        }
      }
    } as any;
    const gitModel = {
      pathRepository: null,
      repositoryChanged: new Signal({}),
      clone: jest.fn().mockResolvedValue({ code: 0, message: '' })
    } as any;
    const fileBrowser = {
      model: {
        path: 'course',
        refresh: jest.fn().mockResolvedValue(undefined)
      },
      selectedItems: jest.fn().mockReturnValue([])
    } as any;
    const toolbarRegistry = {
      addFactory: jest.fn()
    } as any;

    gitCloneCommandPlugin.activate(
      app,
      gitModel,
      fileBrowser,
      toolbarRegistry,
      null,
      nullTranslator
    );
    return { commands, gitModel, fileBrowser };
  }

  it('shows cloning notifications when versioning is true', async () => {
    const { commands, gitModel, fileBrowser } = setupCommand();
    const repoUrl = encodeURIComponent(
      'https://github.com/edinburgh-bto/2026-DExB2/'
    );

    mockShowDialog.mockResolvedValueOnce({
      button: { accept: true } as any,
      isChecked: null,
      value: {
        url: repoUrl,
        versioning: true,
        submodules: true
      }
    });

    await commands.execute(CommandIDs.gitClone);

    expect(gitModel.clone).toHaveBeenCalledWith(
      'course',
      repoUrl,
      undefined,
      true,
      true
    );
    expect(mockEmit).toHaveBeenCalledWith(
      'Cloning…',
      'in-progress',
      expect.any(Object)
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Successfully cloned',
        type: 'success'
      })
    );
    expect(fileBrowser.model.refresh).toHaveBeenCalled();
  });

  it('shows downloading notifications when versioning is false', async () => {
    const { commands, gitModel, fileBrowser } = setupCommand();
    const repoUrl = encodeURIComponent(
      'https://github.com/edinburgh-bto/2026-DExB2/'
    );

    mockShowDialog.mockResolvedValueOnce({
      button: { accept: true } as any,
      isChecked: null,
      value: {
        url: repoUrl,
        versioning: false,
        submodules: true
      }
    });

    await commands.execute(CommandIDs.gitClone);

    expect(gitModel.clone).toHaveBeenCalledWith(
      'course',
      repoUrl,
      undefined,
      false,
      true
    );
    expect(mockEmit).toHaveBeenCalledWith(
      'Downloading…',
      'in-progress',
      expect.any(Object)
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Successfully downloaded',
        type: 'success'
      })
    );
    expect(fileBrowser.model.refresh).toHaveBeenCalled();
  });

  it('shows download failure notification when versioning is false and clone fails', async () => {
    const { commands, gitModel } = setupCommand();
    const repoUrl = encodeURIComponent('https://github.com/example/repo.git');
    const cloneError = new Error('network error');
    gitModel.clone.mockRejectedValueOnce(cloneError);
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    mockShowDialog.mockResolvedValueOnce({
      button: { accept: true } as any,
      isChecked: null,
      value: {
        url: repoUrl,
        versioning: false,
        submodules: false
      }
    });

    await expect(commands.execute(CommandIDs.gitClone)).rejects.toThrow(
      'network error'
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to download',
        type: 'error'
      })
    );
    consoleSpy.mockRestore();
  });
});
