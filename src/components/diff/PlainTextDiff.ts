import { CodeEditor } from '@jupyterlab/codeeditor';
import {
  CodeMirrorEditorFactory,
  EditorExtensionRegistry,
  EditorLanguageRegistry
} from '@jupyterlab/codemirror';
import { Contents } from '@jupyterlab/services';
import { nullTranslator, TranslationBundle } from '@jupyterlab/translation';
import { PromiseDelegate } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';
import { createNbdimeMergeView, MergeView } from 'nbdime/lib/common/mergeview';
import { StringDiffModel } from 'nbdime/lib/diff/model';
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
  model,
  toolbar,
  translator
}: Git.Diff.IFactoryOptions & {
  editorFactory?: CodeEditor.Factory;
}): Promise<PlainTextDiff> => {
  const widget = new PlainTextDiff({
    model,
    editorFactory,
    trans: (translator ?? nullTranslator).load('jupyterlab_git')
  });
  await widget.ready;
  return widget;
};

/**
 * Plain Text Diff widget
 */
export class PlainTextDiff extends Widget implements Git.Diff.IDiffWidget {
  constructor({
    model,
    trans,
    editorFactory
  }: {
    model: Git.Diff.IModel;
    editorFactory?: CodeEditor.Factory;
    trans?: TranslationBundle;
  }) {
    super({
      node: PlainTextDiff.createNode(
        model.reference.label,
        model.base?.label ?? '',
        model.challenger.label
      )
    });
    const getReady = new PromiseDelegate<void>();
    this._isReady = getReady.promise;
    this._container = this.node.lastElementChild as HTMLElement;
    this._editorFactory = editorFactory ?? createEditorFactory();
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
            this._languageRegistry,
            this._hasConflict ? this._base : null
          );
        }
      })
      .catch(reason => {
        this.showError(reason);
      });
  }

  /**
   * Undo onAfterAttach
   */
  onBeforeDetach(): void {
    this._container.innerHTML = '';
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
      this._container.innerHTML = '';
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
        this._languageRegistry,
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
  protected static createNode(...labels: string[]): HTMLElement {
    const bannerClass =
      labels[1] !== undefined ? 'jp-git-merge-banner' : 'jp-git-diff-banner';
    const head = document.createElement('div');
    head.className = 'jp-git-diff-root';
    head.innerHTML = `
    <div class="${bannerClass}">
      ${labels
        .filter(label => !!label)
        .map(label => `<span>${label}</span>`)
        .join('<span class="jp-spacer"></span>')}
    </div>
    <div class="jp-git-PlainText-diff"></div>`;
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
    languageRegistry: EditorLanguageRegistry | null = null,
    baseContent: string | null = null
  ): Promise<void> {
    if (!this._mergeView) {
      const remote = new StringDiffModel(
        referenceContent,
        challengerContent,
        [],
        []
      );

      this._mergeView = createNbdimeMergeView({
        remote,
        factory: this._editorFactory
      });
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
    this.node.innerHTML = `<p class="jp-git-diff-error">
      <span>${this._trans.__('Error Loading File Diff:')}</span>
      <span class="jp-git-diff-error-message">${msg}</span>
    </p>`;
  }

  protected _container: HTMLElement;
  protected _editorFactory: CodeEditor.Factory;
  protected _isReady: Promise<void>;
  // @ts-expect-error complex initialization
  protected _mergeView: MergeView;
  protected _model: Git.Diff.IModel;
  protected _trans: TranslationBundle;

  private _reference: string | null = null;
  private _challenger: string | null = null;
  private _languageRegistry: EditorLanguageRegistry | null = null;
  private _base: string | null = null;
}

function createEditorFactory(): CodeEditor.Factory {
  const factory = new CodeMirrorEditorFactory({
    extensions: new EditorExtensionRegistry(),
    languages: new EditorLanguageRegistry()
  });

  return factory.newInlineEditor.bind(factory);
}
