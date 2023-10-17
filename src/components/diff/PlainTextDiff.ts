import { CodeEditor, IEditorMimeTypeService } from '@jupyterlab/codeeditor';
import {
  CodeMirrorEditorFactory,
  EditorExtensionRegistry,
  EditorLanguageRegistry,
  IEditorLanguageRegistry
} from '@jupyterlab/codemirror';
import { Contents } from '@jupyterlab/services';
import { TranslationBundle, nullTranslator } from '@jupyterlab/translation';
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
  toolbar,
  translator
}: Git.Diff.IFactoryOptions & {
  languageRegistry: IEditorLanguageRegistry;
  editorFactory?: CodeEditor.Factory;
}): Promise<PlainTextDiff> => {
  const widget = new PlainTextDiff({
    model,
    languageRegistry,
    editorFactory,
    trans: (translator ?? nullTranslator).load('jupyterlab_git')
  });
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
    editorFactory
  }: {
    model: Git.Diff.IModel;
    languageRegistry: IEditorLanguageRegistry;
    editorFactory?: CodeEditor.Factory;
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
    this._editorFactory = editorFactory ?? createEditorFactory();
    this._languageRegistry = languageRegistry;
    this._model = model;
    this._trans = trans ?? nullTranslator.load('jupyterlab_git');

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
    try {
      // Clear all
      this._mergeView.dispose();

      // ENH request content only if it changed
      if (this._reference !== null) {
        this._reference = await this._model.reference.content();
      }
      if (this._challenger !== null) {
        this._challenger = await this._model.challenger.content();
      }
      if (this._base !== null) {
        this._base = (await this._model.base?.content()) ?? null;
      }

      this.createDiffView(
        this._challenger!,
        this._reference!,
        this._hasConflict ? this._base : null
      );

      this._challenger = null;
      this._reference = null;
      this._base = null;
    } catch (reason) {
      this.showError(reason as Error);
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
        // factory: this._editorFactory
        showBase: false
      });
      this._mergeView.addClass('jp-git-PlainText-diff');

      this.addWidget(this._mergeView);
    }

    return Promise.resolve();
  }

  /**
   * Display an error instead of the file diff
   *
   * @param error Error object
   */
  protected showError(error: Error): void {
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
    this.node.innerHTML = `<p class="jp-git-diff-error">
      <span>${this._trans.__('Error Loading File Diff:')}</span>
      <span class="jp-git-diff-error-message">${msg}</span>
    </p>`;
  }

  protected _editorFactory: CodeEditor.Factory;
  protected _isReady: Promise<void>;
  // @ts-expect-error complex initialization
  protected _mergeView: MergeView;
  protected _model: Git.Diff.IModel;
  protected _trans: TranslationBundle;

  private _reference: string | null = null;
  private _challenger: string | null = null;
  private _languageRegistry: IEditorLanguageRegistry;
  private _base: string | null = null;
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
function createEditorFactory(): CodeEditor.Factory {
  const factory = new CodeMirrorEditorFactory({
    extensions: new EditorExtensionRegistry(),
    languages: new EditorLanguageRegistry()
  });

  return factory.newInlineEditor.bind(factory);
}
