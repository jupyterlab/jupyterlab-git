import 'jest';
import { Notification } from '@jupyterlab/apputils';
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
  const createModel = (
    options: Partial<{
      challenger: string;
      challengerLabel: string;
      challengerSource: any;
      reference: string;
      referenceLabel: string;
      referenceSource: any;
    }> = {}
  ): DiffModel =>
    new DiffModel({
      challenger: {
        content: () => Promise.resolve(options.challenger ?? 'challenger'),
        label: options.challengerLabel ?? 'WORKING',
        source: options.challengerSource ?? Git.Diff.SpecialRef.WORKING
      },
      reference: {
        content: () => Promise.resolve(options.reference ?? 'reference'),
        label: options.referenceLabel ?? 'HEAD',
        source: options.referenceSource ?? 'HEAD'
      },
      filename: 'to/File.py',
      repositoryPath: 'path'
    });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render file diff', async () => {
    // Given
    const model = createModel({
      referenceLabel: '83baee',
      referenceSource: '83baee'
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
    const model = createModel();
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
    const model = createModel({
      challengerLabel: 'INDEX',
      challengerSource: Git.Diff.SpecialRef.INDEX
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
    const model = createModel();
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
    widget.dispose();
  });

  it('should debounce save from shared model changes in edit mode', async () => {
    // Given
    const model = createModel();
    const save = jest.fn(() => Promise.resolve({}));
    const widget = await createPlainTextDiff({
      model,
      languageRegistry: new EditorLanguageRegistry(),
      contentsManager: { save } as any
    });
    const refresh = jest.spyOn(widget, 'refresh');
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
    expect(onSharedModelChanged).not.toBeNull();
    const sharedModelChangeHandler = connect.mock.calls[0][0] as () => void;
    sharedModelChangeHandler();
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
    expect(refresh).not.toHaveBeenCalled();

    jest.useRealTimers();
    widget.dispose();
  });

  it('should sync edited content to open file context while in edit mode', async () => {
    // Given
    const model = createModel();
    const fromString = jest.fn();
    const openWidget = {};
    const context = {
      model: {
        toString: () => 'challenger',
        fromString
      },
      save: jest.fn(() => Promise.resolve())
    };
    const documentManager = {
      findWidget: jest.fn(() => openWidget as any),
      contextForWidget: jest.fn(() => context as any)
    };
    const widget = await createPlainTextDiff({
      model,
      languageRegistry: new EditorLanguageRegistry(),
      contentsManager: { save: jest.fn() } as any,
      documentManager: documentManager as any
    });
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

    // When
    (widget as any)._setEditMode(true);
    expect(onSharedModelChanged).not.toBeNull();
    onSharedModelChanged!();

    // Then
    expect(fromString).toHaveBeenCalledWith('edited from shared model');
    widget.dispose();
  });

  it('should use open document context save when available', async () => {
    // Given
    const model = createModel();
    const save = jest.fn(() => Promise.resolve());
    const fromString = jest.fn();
    const openWidget = {};
    const context = {
      model: {
        toString: () => 'challenger',
        fromString
      },
      save
    };
    const documentManager = {
      findWidget: jest.fn(() => openWidget as any),
      contextForWidget: jest.fn(() => context as any)
    };
    const contentsSave = jest.fn(() => Promise.resolve({}));
    const widget = await createPlainTextDiff({
      model,
      languageRegistry: new EditorLanguageRegistry(),
      contentsManager: { save: contentsSave } as any,
      documentManager: documentManager as any
    });

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
    expect(fromString).toHaveBeenCalledWith('edited content');
    expect(save).toHaveBeenCalled();
    expect(contentsSave).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledTimes(1);
    widget.dispose();
  });

  it('should block edit mode when open editor has conflicting unsaved changes', async () => {
    // Given
    const model = createModel();
    const openWidget = {};
    const context = {
      model: {
        dirty: true,
        toString: () => 'unsaved user content',
        fromString: jest.fn()
      },
      save: jest.fn(() => Promise.resolve())
    };
    const documentManager = {
      findWidget: jest.fn(() => openWidget as any),
      contextForWidget: jest.fn(() => context as any)
    };
    const notify = jest.spyOn(Notification, 'error').mockImplementation(
      () => 'notification-id'
    );

    const widget = await createPlainTextDiff({
      model,
      languageRegistry: new EditorLanguageRegistry(),
      contentsManager: { save: jest.fn() } as any,
      documentManager: documentManager as any
    });
    const setOption = jest.fn();
    const connect = jest.fn();
    const disconnect = jest.fn();
    (widget as any)._mergeView = {
      right: {
        remoteEditorWidget: {
          editor: {
            setOption,
            host: {
              addEventListener: jest.fn(),
              removeEventListener: jest.fn()
            },
            model: {
              sharedModel: {
                getSource: () => 'edited from shared model',
                changed: {
                  connect,
                  disconnect
                }
              }
            }
          },
          doc: {
            toString: () => 'edited from doc'
          }
        }
      }
    };
    (widget as any)._lastSavedContent = 'challenger';

    // When
    (widget as any)._setEditMode(true);

    // Then
    expect(setOption).not.toHaveBeenCalled();
    expect(connect).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalled();
    widget.dispose();
  });

  it('should notify users when inline save fails', async () => {
    // Given
    const model = createModel();
    const save = jest.fn(() => Promise.reject(new Error('save failed')));
    const notify = jest.spyOn(Notification, 'error').mockImplementation(
      () => 'notification-id'
    );
    const widget = await createPlainTextDiff({
      model,
      languageRegistry: new EditorLanguageRegistry(),
      contentsManager: { save } as any
    });
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
    expect(save).toHaveBeenCalled();
    expect(notify).toHaveBeenCalled();
    widget.dispose();
  });

  it('should refresh safely when merge view is unavailable', async () => {
    // Given
    const model = createModel({
      challenger: 'new challenger',
      reference: 'new reference'
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
    const model = createModel({
      challenger: 'new challenger',
      reference: 'new reference'
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
    const model = createModel();
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
