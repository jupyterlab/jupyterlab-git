import { CodeEditor, IEditorMimeTypeService } from '@jupyterlab/codeeditor';
import {
  CodeMirrorEditorFactory,
  EditorExtensionRegistry,
  EditorLanguageRegistry,
  IEditorLanguageRegistry
} from '@jupyterlab/codemirror';
import { PathExt } from '@jupyterlab/coreutils';
import { Contents } from '@jupyterlab/services';
import { TranslationBundle, nullTranslator } from '@jupyterlab/translation';
import { Toolbar, ToolbarButton } from '@jupyterlab/ui-components';
import { PromiseDelegate } from '@lumino/coreutils';
import { Panel, Widget } from '@lumino/widgets';
import {
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
  diff_match_patch
} from 'diff-match-patch';
import { MergeView, createNbdimeMergeView } from 'nbdime/lib/common/mergeview';
import {
  IStringDiffModel,
  StringDiffModel,
  createDirectStringDiffModel
} from 'nbdime/lib/diff/model';
import { DiffRangeRaw } from 'nbdime/lib/diff/range';
import { Git } from '../../tokens';

/**
 * Diff callback to be registered for plain-text files.
 *
 * @param model Diff model
 * @param toolbar MainAreaWidget toolbar
 * @returns PlainText diff widget
 */
export const createPlainTextDiff = async ({
  editorFactory,
  languageRegistry,
  model,
  contentsManager,
  toolbar,
  translator
}: Git.Diff.IFactoryOptions & {
  languageRegistry: IEditorLanguageRegistry;
  editorFactory?: CodeEditor.Factory;
  contentsManager?: Contents.IManager;
}): Promise<PlainTextDiff> => {
  const widget = new PlainTextDiff({
    model,
    languageRegistry,
    editorFactory,
    contentsManager,
    trans: (translator ?? nullTranslator).load('jupyterlab_git')
  });
  widget.addToolbarItems(toolbar);
  await widget.ready;
  return widget;
};

/**
 * Plain Text Diff widget
 */
export class PlainTextDiff extends Panel implements Git.Diff.IDiffWidget {
  constructor({
    model,
    languageRegistry,
    trans,
    editorFactory,
    contentsManager
  }: {
    model: Git.Diff.IModel;
    languageRegistry?: IEditorLanguageRegistry;
    editorFactory?: CodeEditor.Factory;
    contentsManager?: Contents.IManager;
    trans?: TranslationBundle;
  }) {
    super();
    this.addClass('jp-git-diff-root');
    this.addClass('nbdime-root');
    this.addWidget(
      new Widget({
        node: PlainTextDiff.createHeader(
          model.reference.label,
          model.base?.label,
          model.challenger.label
        )
      })
    );
    const getReady = new PromiseDelegate<void>();
    this._isReady = getReady.promise;
    this._languageRegistry = languageRegistry ?? new EditorLanguageRegistry();
    this._editorFactory =
      editorFactory ?? createEditorFactory(this._languageRegistry);
    this._model = model;
    this._trans = trans ?? nullTranslator.load('jupyterlab_git');
    this._contentsManager = contentsManager;
    this._fullPath = PathExt.join(
      this._model.repositoryPath ?? '/',
      this._model.filename
    );

    // Load file content early
    Promise.all([
      this._model.reference.content(),
      this._model.challenger.content(),
      this._model.base?.content() ?? Promise.resolve(null)
    ])
      .then(([reference, challenger, base]) => {
        this._reference = reference;
        this._challenger = challenger;
        this._base = base;

        getReady.resolve();
      })
      .catch(reason => {
        this.showError(reason);
        getReady.resolve();
      });
  }

  /**
   * Helper to determine if three-way diff should be shown.
   */
  private get _hasConflict(): boolean {
    return this._model.hasConflict ?? false;
  }

  /**
   * Checks if the conflicted file has been resolved.
   */
  get isFileResolved(): boolean {
    return true;
  }

  /**
   * Diff model
   */
  get model(): Git.Diff.IModel {
    return this._model;
  }

  /**
   * Promise which fulfills when the widget is ready.
   */
  get ready(): Promise<void> {
    return this._isReady;
  }

  /**
   * Add plain text diff toolbar items.
   */
  addToolbarItems(toolbar?: Toolbar): void {
    if (!toolbar || !this._isEditableDiff) {
      return;
    }

    this._editButton = new ToolbarButton({
      label: this._trans.__('Edit'),
      onClick: () => {
        this._setEditMode(!this._isEditMode);
      },
      tooltip: this._trans.__('Toggle inline edit mode')
    });
    this._editButton.pressed = this._isEditMode;
    toolbar.addItem('edit', this._editButton);
  }

  /**
   * Gets the file model of a resolved merge conflict,
   * and rejects if unable to retrieve.
   */
  getResolvedFile(): Promise<Partial<Contents.IModel>> {
    const value = this._mergeView?.getMergedValue() ?? null;
    if (value !== null) {
      return Promise.resolve({
        type: 'file',
        format: 'text',
        content: value
      });
    } else {
      return Promise.reject(
        this._trans.__('Failed to get a valid file value.')
      );
    }
  }

  /**
   * Callback to create the diff widget once the widget
   * is attached so CodeMirror get proper size.
   */
  onAfterAttach(): void {
    this.ready
      .then(() => {
        if (this._challenger !== null && this._reference !== null) {
          this.createDiffView(
            this._challenger,
            this._reference,
            this._hasConflict ? this._base : null
          );
        }
      })
      .catch(reason => {
        this.showError(reason);
      });
  }

  /**
   * Refresh diff
   *
   * Note: Update the content and recompute the diff
   */
  async refresh(): Promise<void> {
    await this.ready;
    if (this._isRefreshing) {
      this._refreshQueued = true;
      return;
    }
    this._isRefreshing = true;
    const previousEditor = this._mergeView?.right?.remoteEditorWidget;
    const previousSelection = previousEditor?.editor.getSelection() ?? null;
    const wasFocused = previousEditor?.editor.hasFocus() ?? false;
    const previousScrollTop = previousEditor?.cm.scrollDOM.scrollTop ?? null;
    const previousScrollLeft = previousEditor?.cm.scrollDOM.scrollLeft ?? null;
    try {
      this._saveEditedContent();
      // Clear all
      this._setEditableEditorNode(null);
      this._clearSaveTimer();
      this._mergeView?.dispose();
      // @ts-expect-error complex initialization
      this._mergeView = null;

      // Always fetch latest content to support repeated refreshes.
      this._reference = await this._model.reference.content();
      this._challenger = await this._model.challenger.content();
      this._base = this._hasConflict
        ? (await this._model.base?.content()) ?? null
        : null;

      await this.createDiffView(
        this._challenger!,
        this._reference!,
        this._hasConflict ? this._base : null
      );
      if (previousSelection && this._mergeView?.right) {
        const editorWidget = this._mergeView.right.remoteEditorWidget;
        window.requestAnimationFrame(() => {
          if (this.isDisposed || !this._mergeView?.right) {
            return;
          }
          editorWidget.editor.setSelection(previousSelection);
          editorWidget.editor.revealSelection(previousSelection);
          if (previousScrollTop !== null) {
            editorWidget.cm.scrollDOM.scrollTop = previousScrollTop;
          }
          if (previousScrollLeft !== null) {
            editorWidget.cm.scrollDOM.scrollLeft = previousScrollLeft;
          }
          if (wasFocused) {
            editorWidget.editor.focus();
          }
        });
      }
    } catch (reason) {
      this.showError(reason as Error);
    } finally {
      this._isRefreshing = false;
      if (this._refreshQueued && !this.isDisposed) {
        this._refreshQueued = false;
        void this.refresh();
      }
    }
  }

  /**
   * Create wrapper node
   */
  protected static createHeader(
    ...labels: (string | undefined)[]
  ): HTMLElement {
    const bannerClass =
      labels[1] !== undefined ? 'jp-git-merge-banner' : 'jp-git-diff-banner';
    const head = document.createElement('div');
    head.classList.add(bannerClass);
    head.innerHTML = labels
      .filter(label => !!label)
      .map(label => `<span>${label}</span>`)
      .join('');
    return head;
  }

  /**
   * Create the Plain Text Diff view
   *
   * Note: baseContent will only be passed when displaying
   *       a three-way merge conflict.
   */
  protected async createDiffView(
    challengerContent: string,
    referenceContent: string,
    baseContent: string | null = null
  ): Promise<void> {
    if (!this._mergeView) {
      const mimetypes =
        this._languageRegistry.findByFileName(this._model.filename)?.mime ??
        this._languageRegistry.findBest(this._model.filename)?.mime ??
        IEditorMimeTypeService.defaultMimeType;
      const mimetype = Array.isArray(mimetypes) ? mimetypes[0] : mimetypes;

      let remote: IStringDiffModel;
      let local: IStringDiffModel | undefined = undefined;
      let merged: IStringDiffModel | undefined = undefined;
      if (baseContent !== null) {
        remote = createStringDiffModel(baseContent, referenceContent);
        local = createStringDiffModel(baseContent, challengerContent);
        local.mimetype = mimetype;
        merged = createDirectStringDiffModel(baseContent, baseContent);
        merged.mimetype = mimetype;
      } else {
        remote = createStringDiffModel(referenceContent, challengerContent);
      }
      remote.mimetype = mimetype;

      this._mergeView = createNbdimeMergeView({
        remote,
        local,
        merged,
        factory: this._editorFactory,
        showBase: false
      });
      this._mergeView.addClass('jp-git-PlainText-diff');

      this.addWidget(this._mergeView);
    }

    this._lastSavedContent = challengerContent;
    this._updateEditMode();

    return Promise.resolve();
  }

  /**
   * Display an error instead of the file diff
   *
   * @param error Error object
   */
  protected showError(error: Error): void {
    this._setEditableEditorNode(null);
    this._clearSaveTimer();
    console.error(
      this._trans.__('Failed to load file diff.'),
      error,
      (error as any)?.traceback
    );
    const msg = ((error.message || error) as string).replace('\n', '<br />');
    while (this.widgets.length > 0) {
      const w = this.widgets[0];
      this.layout?.removeWidget(w);
      w.dispose();
    }
    // @ts-expect-error complex initialization
    this._mergeView = null;
    this.node.innerHTML = `<p class="jp-git-diff-error">
      <span>${this._trans.__('Error Loading File Diff:')}</span>
      <span class="jp-git-diff-error-message">${msg}</span>
    </p>`;
  }

  /**
   * Dispose plain text diff widget.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._saveEditedContent();
    this._setEditableEditorNode(null);
    this._clearSaveTimer();
    super.dispose();
  }

  protected _editorFactory: CodeEditor.Factory;
  protected _isReady: Promise<void>;
  // @ts-expect-error complex initialization
  protected _mergeView: MergeView;
  protected _model: Git.Diff.IModel;
  protected _trans: TranslationBundle;
  protected _contentsManager: Contents.IManager | undefined;
  protected _fullPath: string;
  protected _editButton: ToolbarButton | null = null;
  protected _isEditMode = false;
  protected _saveTimer: number | null = null;
  protected _isSaving = false;
  protected _isRefreshing = false;
  protected _refreshQueued = false;
  protected _nextSaveContent: string | null = null;
  protected _editableEditorNode: HTMLElement | null = null;
  protected _lastSavedContent: string | null = null;

  private _reference: string | null = null;
  private _challenger: string | null = null;
  private _languageRegistry: IEditorLanguageRegistry;
  private _base: string | null = null;

  /**
   * Whether this diff can be edited inline.
   */
  private get _isEditableDiff(): boolean {
    return (
      !this._hasConflict &&
      this._contentsManager !== undefined &&
      this._model.challenger.source === Git.Diff.SpecialRef.WORKING
    );
  }

  /**
   * Set inline edit mode.
   */
  private _setEditMode(isEditMode: boolean): void {
    if (!this._isEditableDiff || this._isEditMode === isEditMode) {
      return;
    }
    this._isEditMode = isEditMode;
    if (!this._isEditMode) {
      this._saveEditedContent();
    }
    this._updateEditMode();
    if (this._editButton) {
      this._editButton.pressed = isEditMode;
    }
  }

  /**
   * Update editor read-only mode and save listeners.
   */
  private _updateEditMode(): void {
    if (!this._isEditableDiff || !this._mergeView?.right) {
      return;
    }

    const editorWidget = this._mergeView.right.remoteEditorWidget;
    editorWidget.editor.setOption('readOnly', !this._isEditMode);
    this._setEditableEditorNode(this._isEditMode ? editorWidget.node : null);
  }

  /**
   * Set the current editable editor node.
   */
  private _setEditableEditorNode(node: HTMLElement | null): void {
    if (this._editableEditorNode === node) {
      return;
    }
    this._editableEditorNode?.removeEventListener('input', this._onInput);
    this._editableEditorNode?.removeEventListener('keyup', this._onKeyup);
    this._editableEditorNode = node;
    this._editableEditorNode?.addEventListener('input', this._onInput);
    this._editableEditorNode?.addEventListener('keyup', this._onKeyup);
  }

  /**
   * Debounce file save while typing.
   */
  private _onInput = (): void => {
    this._clearSaveTimer();
    this._saveTimer = window.setTimeout(() => {
      this._saveTimer = null;
      this._saveEditedContent();
    }, 1000);
  };

  /**
   * Fallback for key events where input may not fire (e.g. newline on Enter).
   */
  private _onKeyup = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      this._onInput();
    }
  };

  /**
   * Clear pending save timer.
   */
  private _clearSaveTimer(): void {
    if (this._saveTimer !== null) {
      window.clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
  }

  /**
   * Save edited content to the underlying file.
   */
  private _saveEditedContent(): void {
    if (!this._contentsManager || !this._mergeView?.right) {
      return;
    }
    const content = this._mergeView.right.remoteEditorWidget.doc.toString();
    if (content === this._lastSavedContent) {
      return;
    }
    this._nextSaveContent = content;
    if (!this._isSaving) {
      void this._flushSaveQueue();
    }
  }

  /**
   * Flush pending save requests sequentially.
   */
  private async _flushSaveQueue(): Promise<void> {
    if (!this._contentsManager) {
      return;
    }
    this._isSaving = true;
    let didSave = false;
    while (this._nextSaveContent !== null) {
      const content = this._nextSaveContent;
      this._nextSaveContent = null;
      try {
        await this._contentsManager.save(this._fullPath, {
          type: 'file',
          format: 'text',
          content
        });
        this._lastSavedContent = content;
        didSave = true;
      } catch (reason) {
        console.error(
          this._trans.__('Failed to save inline diff changes.'),
          reason,
          (reason as any)?.traceback
        );
      }
    }
    this._isSaving = false;
    if (didSave && !this.isDisposed) {
      void this.refresh();
    }
  }
}

/**
 * Diff status
 */
enum DiffStatus {
  Equal = DIFF_EQUAL,
  Delete = DIFF_DELETE,
  Insert = DIFF_INSERT
}

/**
 * Diff type
 */
type Diff = [DiffStatus, string];

/**
 * Pointer to the diff algorithm
 */
let dmp: any;
/**
 * Compute the diff between two strings.
 *
 * @param a Reference
 * @param b Challenger
 * @param ignoreWhitespace Whether to ignore white spaces or not
 * @returns Diff list
 */
function getDiff(a: string, b: string, ignoreWhitespace?: boolean): Diff[] {
  if (!dmp) {
    dmp = new diff_match_patch();
  }

  const diff = dmp.diff_main(a, b);
  dmp.diff_cleanupSemantic(diff);
  // The library sometimes leaves in empty parts, which confuse the algorithm
  for (let i = 0; i < diff.length; ++i) {
    const part = diff[i];
    if (ignoreWhitespace ? !/[^ \t]/.test(part[1]) : !part[1]) {
      diff.splice(i--, 1);
    } else if (i && diff[i - 1][0] === part[0]) {
      diff.splice(i--, 1);
      diff[i][1] += part[1];
    }
  }
  return diff;
}

/**
 * Create nbdime diff model from two strings.
 *
 * @param reference Reference text
 * @param challenger Challenger text
 * @param ignoreWhitespace Whether to ignore white spaces or not
 * @returns The nbdime diff model
 */
function createStringDiffModel(
  reference: string,
  challenger: string,
  ignoreWhitespace?: boolean
): IStringDiffModel {
  const diffs = getDiff(reference, challenger, ignoreWhitespace);

  const additions: DiffRangeRaw[] = [];
  const deletions: DiffRangeRaw[] = [];

  let referencePos = 0;
  let challengerPos = 0;
  diffs.forEach(([status, str]) => {
    switch (status) {
      case DiffStatus.Delete:
        deletions.push(new DiffRangeRaw(referencePos, str.length));
        referencePos += str.length;
        break;
      case DiffStatus.Insert:
        additions.push(new DiffRangeRaw(challengerPos, str.length));
        challengerPos += str.length;
        break;
      // Equal is not represented in nbdime
      case DiffStatus.Equal:
        referencePos += str.length;
        challengerPos += str.length;
        break;
    }
  });

  return new StringDiffModel(reference, challenger, additions, deletions);
}

/**
 * Create a default editor factory.
 *
 * @returns Editor factory
 */
function createEditorFactory(
  languages: IEditorLanguageRegistry
): CodeEditor.Factory {
  const factory = new CodeMirrorEditorFactory({
    extensions: new EditorExtensionRegistry(),
    languages
  });

  return factory.newInlineEditor.bind(factory);
}
