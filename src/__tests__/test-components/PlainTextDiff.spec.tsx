import 'jest';
import { EditorLanguageRegistry } from '@jupyterlab/codemirror';
import { Toolbar } from '@jupyterlab/ui-components';
import { DiffModel } from '../../components/diff/model';
import {
  createPlainTextDiff,
  PlainTextDiff
} from '../../components/diff/PlainTextDiff';
import { Git } from '../../tokens';

jest.mock('../../git');

describe('PlainTextDiff', () => {
  it('should render file diff', async () => {
    // Given
    const model = new DiffModel({
      challenger: {
        content: () => Promise.resolve('challenger'),
        label: 'WORKING',
        source: Git.Diff.SpecialRef.WORKING
      },
      reference: {
        content: () => Promise.resolve('reference'),
        label: '83baee',
        source: '83baee'
      },
      filename: 'to/File.py',
      repositoryPath: 'path'
    });

    // When
    const widget = new PlainTextDiff({ model });
    await widget.ready;

    // Then
    let resolveTest: (value?: any) => void;
    const terminateTest = new Promise(resolve => {
      resolveTest = resolve;
    });
    setTimeout(() => {
      expect(widget.node.querySelectorAll('.jp-git-diff-error')).toHaveLength(
        0
      );
      resolveTest();
    }, 0);
    await terminateTest;
  });

  it('should render error in if API response is failed', async () => {
    // Given
    const model = new DiffModel({
      challenger: {
        content: () => Promise.reject('TEST_ERROR_MESSAGE'),
        label: 'WORKING',
        source: Git.Diff.SpecialRef.WORKING
      },
      reference: {
        content: () => Promise.resolve('reference'),
        label: '83baee',
        source: '83baee'
      },
      filename: 'to/File.py',
      repositoryPath: 'path'
    });

    // When
    const widget = new PlainTextDiff({ model });
    await widget.ready;

    // Then
    let resolveTest: (value?: any) => void;
    const terminateTest = new Promise(resolve => {
      resolveTest = resolve;
    });
    setTimeout(() => {
      expect(
        widget.node.querySelector('.jp-git-diff-error')!.innerHTML
      ).toContain('TEST_ERROR_MESSAGE');
      resolveTest();
    }, 0);
    await terminateTest;
  });

  it('should add edit toolbar item for working tree diffs', async () => {
    // Given
    const model = new DiffModel({
      challenger: {
        content: () => Promise.resolve('challenger'),
        label: 'WORKING',
        source: Git.Diff.SpecialRef.WORKING
      },
      reference: {
        content: () => Promise.resolve('reference'),
        label: 'HEAD',
        source: 'HEAD'
      },
      filename: 'to/File.py',
      repositoryPath: 'path'
    });
    const toolbar = new Toolbar();

    // When
    const widget = await createPlainTextDiff({
      model,
      toolbar,
      languageRegistry: new EditorLanguageRegistry(),
      contentsManager: {
        save: jest.fn()
      } as any
    });

    // Then
    expect(Array.from(toolbar.names())).toContain('edit');
    widget.dispose();
  });

  it('should not add edit toolbar item for non-working diffs', async () => {
    // Given
    const model = new DiffModel({
      challenger: {
        content: () => Promise.resolve('challenger'),
        label: 'INDEX',
        source: Git.Diff.SpecialRef.INDEX
      },
      reference: {
        content: () => Promise.resolve('reference'),
        label: 'HEAD',
        source: 'HEAD'
      },
      filename: 'to/File.py',
      repositoryPath: 'path'
    });
    const toolbar = new Toolbar();

    // When
    const widget = await createPlainTextDiff({
      model,
      toolbar,
      languageRegistry: new EditorLanguageRegistry(),
      contentsManager: {
        save: jest.fn()
      } as any
    });

    // Then
    expect(Array.from(toolbar.names())).not.toContain('edit');
    widget.dispose();
  });

  it('should save edited working content to underlying file', async () => {
    // Given
    const model = new DiffModel({
      challenger: {
        content: () => Promise.resolve('challenger'),
        label: 'WORKING',
        source: Git.Diff.SpecialRef.WORKING
      },
      reference: {
        content: () => Promise.resolve('reference'),
        label: 'HEAD',
        source: 'HEAD'
      },
      filename: 'to/File.py',
      repositoryPath: 'path'
    });
    const save = jest.fn(() => Promise.resolve({}));
    const widget = await createPlainTextDiff({
      model,
      languageRegistry: new EditorLanguageRegistry(),
      contentsManager: { save } as any
    });
    const refresh = jest
      .spyOn(widget, 'refresh')
      .mockImplementation(async () => undefined);

    (widget as any)._mergeView = {
      right: {
        remoteEditorWidget: {
          doc: {
            toString: () => 'edited content'
          }
        }
      }
    };
    (widget as any)._lastSavedContent = 'challenger';

    // When
    (widget as any)._saveEditedContent();
    await new Promise(resolve => setTimeout(resolve, 0));

    // Then
    expect(save).toHaveBeenCalledWith('path/to/File.py', {
      type: 'file',
      format: 'text',
      content: 'edited content'
    });
    expect(refresh).toHaveBeenCalled();
    refresh.mockRestore();
    widget.dispose();
  });

  it('should debounce save from shared model changes in edit mode', async () => {
    // Given
    const model = new DiffModel({
      challenger: {
        content: () => Promise.resolve('challenger'),
        label: 'WORKING',
        source: Git.Diff.SpecialRef.WORKING
      },
      reference: {
        content: () => Promise.resolve('reference'),
        label: 'HEAD',
        source: 'HEAD'
      },
      filename: 'to/File.py',
      repositoryPath: 'path'
    });
    const save = jest.fn(() => Promise.resolve({}));
    const widget = await createPlainTextDiff({
      model,
      languageRegistry: new EditorLanguageRegistry(),
      contentsManager: { save } as any
    });
    const refresh = jest
      .spyOn(widget, 'refresh')
      .mockImplementation(async () => undefined);
    const setOption = jest.fn();
    const hostAddEventListener = jest.fn();
    const hostRemoveEventListener = jest.fn();
    const connect = jest.fn();
    const disconnect = jest.fn();
    let onSharedModelChanged: (() => void) | null = null;
    connect.mockImplementation((cb: unknown) => {
      onSharedModelChanged = cb as () => void;
    });
    const sharedModel = {
      getSource: () => 'edited from shared model',
      changed: {
        connect,
        disconnect
      }
    };

    (widget as any)._mergeView = {
      right: {
        remoteEditorWidget: {
          editor: {
            setOption,
            host: {
              addEventListener: hostAddEventListener,
              removeEventListener: hostRemoveEventListener
            },
            model: {
              sharedModel
            }
          },
          doc: {
            toString: () => 'edited from doc'
          }
        }
      }
    };
    (widget as any)._lastSavedContent = 'challenger';

    jest.useFakeTimers();

    // When
    (widget as any)._setEditMode(true);
    if (onSharedModelChanged) {
      onSharedModelChanged();
    }
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    await Promise.resolve();

    // Then
    expect(setOption).toHaveBeenCalledWith('readOnly', false);
    expect(connect).toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith('path/to/File.py', {
      type: 'file',
      format: 'text',
      content: 'edited from shared model'
    });

    refresh.mockRestore();
    jest.useRealTimers();
    widget.dispose();
  });

  it('should refresh safely when merge view is unavailable', async () => {
    // Given
    const model = new DiffModel({
      challenger: {
        content: () => Promise.resolve('new challenger'),
        label: 'WORKING',
        source: Git.Diff.SpecialRef.WORKING
      },
      reference: {
        content: () => Promise.resolve('new reference'),
        label: 'HEAD',
        source: 'HEAD'
      },
      filename: 'to/File.py',
      repositoryPath: 'path'
    });
    const widget = await createPlainTextDiff({
      model,
      languageRegistry: new EditorLanguageRegistry(),
      contentsManager: { save: jest.fn() } as any
    });
    const createDiffView = jest
      .spyOn(widget as any, 'createDiffView')
      .mockImplementation(async () => undefined);

    (widget as any)._mergeView = null;

    // When
    await widget.refresh();

    // Then
    expect(createDiffView).toHaveBeenCalledWith(
      'new challenger',
      'new reference',
      null
    );
    createDiffView.mockRestore();
    widget.dispose();
  });

  it('should restore editor selection on refresh', async () => {
    // Given
    const model = new DiffModel({
      challenger: {
        content: () => Promise.resolve('new challenger'),
        label: 'WORKING',
        source: Git.Diff.SpecialRef.WORKING
      },
      reference: {
        content: () => Promise.resolve('new reference'),
        label: 'HEAD',
        source: 'HEAD'
      },
      filename: 'to/File.py',
      repositoryPath: 'path'
    });
    const widget = await createPlainTextDiff({
      model,
      languageRegistry: new EditorLanguageRegistry(),
      contentsManager: { save: jest.fn() } as any
    });
    const previousSelection = {
      start: { line: 1, column: 2 },
      end: { line: 1, column: 2 }
    };
    const setSelection = jest.fn();
    const revealSelection = jest.fn();
    const focus = jest.fn();

    (widget as any)._mergeView = {
      right: {
        remoteEditorWidget: {
          editor: {
            getSelection: () => previousSelection,
            hasFocus: () => true,
            setSelection,
            revealSelection,
            focus
          },
          doc: {
            toString: () => 'new challenger'
          },
          cm: {
            scrollDOM: {
              scrollTop: 12,
              scrollLeft: 4
            }
          }
        }
      },
      dispose: jest.fn()
    };
    (widget as any)._lastSavedContent = 'new challenger';

    const createDiffView = jest
      .spyOn(widget as any, 'createDiffView')
      .mockImplementation(async () => {
        (widget as any)._mergeView = {
          right: {
            remoteEditorWidget: {
              editor: {
                setSelection,
                revealSelection,
                focus
              },
              doc: {
                toString: () => 'new challenger'
              },
              cm: {
                scrollDOM: {
                  scrollTop: 0,
                  scrollLeft: 0
                }
              }
            }
          }
        };
      });

    // When
    await widget.refresh();
    await new Promise(resolve =>
      window.requestAnimationFrame(() => resolve(0))
    );

    // Then
    expect(setSelection).toHaveBeenCalledWith(previousSelection);
    expect(revealSelection).toHaveBeenCalledWith(previousSelection);
    expect(focus).toHaveBeenCalled();
    createDiffView.mockRestore();
    widget.dispose();
  });

  it('should save pending edited content on dispose', async () => {
    // Given
    const model = new DiffModel({
      challenger: {
        content: () => Promise.resolve('challenger'),
        label: 'WORKING',
        source: Git.Diff.SpecialRef.WORKING
      },
      reference: {
        content: () => Promise.resolve('reference'),
        label: 'HEAD',
        source: 'HEAD'
      },
      filename: 'to/File.py',
      repositoryPath: 'path'
    });
    const save = jest.fn(() => Promise.resolve({}));
    const widget = await createPlainTextDiff({
      model,
      languageRegistry: new EditorLanguageRegistry(),
      contentsManager: { save } as any
    });

    (widget as any)._mergeView = {
      right: {
        remoteEditorWidget: {
          doc: {
            toString: () => 'edited content on close'
          }
        }
      }
    };
    (widget as any)._lastSavedContent = 'challenger';

    // When
    widget.dispose();
    await new Promise(resolve => setTimeout(resolve, 0));

    // Then
    expect(save).toHaveBeenCalledWith('path/to/File.py', {
      type: 'file',
      format: 'text',
      content: 'edited content on close'
    });
  });
});
