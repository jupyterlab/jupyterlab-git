import { Toolbar } from '@jupyterlab/apputils';
import { Mode } from '@jupyterlab/codemirror';
import { Contents } from '@jupyterlab/services';
import {
  ITranslator,
  nullTranslator,
  TranslationBundle
} from '@jupyterlab/translation';
import { PromiseDelegate } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';
import { MergeView } from 'codemirror';
import { Git } from '../../tokens';
import { MergeView as LocalMergeView, mergeView } from './mergeview';

/**
 * Diff callback to be registered for plain-text files.
 *
 * @param model Diff model
 * @param toolbar MainAreaWidget toolbar
 * @returns PlainText diff widget
 */
export const createPlainTextDiff: Git.Diff.ICallback = async (
  model: Git.Diff.IModel,
  toolbar?: Toolbar,
  translator?: ITranslator
): Promise<PlainTextDiff> => {
  const widget = new PlainTextDiff(model, translator.load('jupyterlab_git'));
  await widget.ready;
  return widget;
};

/**
 * Plain Text Diff widget
 */
export class PlainTextDiff extends Widget implements Git.Diff.IDiffWidget {
  constructor(model: Git.Diff.IModel, translator?: TranslationBundle) {
    super({
      node: PlainTextDiff.createNode(
        model.reference.label,
        model.base?.label,
        model.challenger.label
      )
    });
    const getReady = new PromiseDelegate<void>();
    this._isReady = getReady.promise;
    this._container = this.node.lastElementChild as HTMLElement;
    this._model = model;
    this._trans = translator ?? nullTranslator.load('jupyterlab_git');

    // The list of internal strings is available at https://codemirror.net/examples/translate/
    this._translations = {
      // @codemirror/view
      'Control character': this._trans.__('Control character'),
      // @codemirror/commands
      'Selection deleted': this._trans.__('Selection deleted'),
      // @codemirror/language
      'Folded lines': this._trans.__('Folded lines'),
      'Unfolded lines': this._trans.__('Unfolded lines'),
      to: this._trans.__('to'),
      'folded code': this._trans.__('folded code'),
      unfold: this._trans.__('unfold'),
      'Fold line': this._trans.__('Fold line'),
      'Unfold line': this._trans.__('Unfold line'),
      // @codemirror/search
      'Go to line': this._trans.__('Go to line'),
      go: this._trans.__('go'),
      Find: this._trans.__('Find'),
      Replace: this._trans.__('Replace'),
      next: this._trans.__('next'),
      previous: this._trans.__('previous'),
      all: this._trans.__('all'),
      'match case': this._trans.__('match case'),
      replace: this._trans.__('replace'),
      'replace all': this._trans.__('replace all'),
      close: this._trans.__('close'),
      'current match': this._trans.__('current match'),
      'replaced $ matches': this._trans.__('replaced $ matches'),
      'replaced match on line $': this._trans.__('replaced match on line $'),
      'on line': this._trans.__('on line'),
      // From https://codemirror.net/5/addon/merge/merge.js
      'Identical text collapsed. Click to expand.': this._trans.__(
        'Identical text collapsed. Click to expand.'
      ),
      'Toggle locked scrolling': this._trans.__('Toggle locked scrolling'),
      'Push to left': this._trans.__('Push to left'),
      'Revert chunk': this._trans.__('Revert chunk')
    };

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
    return this._model.hasConflict;
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
    const value = this._mergeView?.editor().getValue() ?? null;
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
            this._translations,
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
      this._mergeView = null;

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
        this._challenger,
        this._reference,
        this._translations,
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
    translations: Record<string, string>,
    baseContent?: string
  ): Promise<void> {
    if (!this._mergeView) {
      const mode =
        Mode.findByFileName(this._model.filename) ||
        Mode.findBest(this._model.filename);

      let options: LocalMergeView.IMergeViewEditorConfiguration = {
        value: challengerContent,
        orig: referenceContent,
        mode: mode.mime,
        phrases: translations,
        ...this.getDefaultOptions()
      };

      // Show three-way diff on merge conflict
      // Note: Empty base content ("") is an edge case.
      if (baseContent !== null && baseContent !== undefined) {
        options = {
          ...options,
          origLeft: referenceContent,
          value: baseContent,
          origRight: challengerContent,
          readOnly: false,
          revertButtons: true
        };
      }

      this._mergeView = mergeView(
        this._container,
        options
      ) as MergeView.MergeViewEditor;
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

  protected getDefaultOptions(): Partial<MergeView.MergeViewEditorConfiguration> {
    // FIXME add options from settings and connect settings to update options
    return {
      lineNumbers: true,
      theme: 'jupyter',
      connect: 'align',
      collapseIdentical: true,
      readOnly: true,
      revertButtons: false
    };
  }

  protected _container: HTMLElement;
  protected _isReady: Promise<void>;
  protected _mergeView: MergeView.MergeViewEditor;
  protected _model: Git.Diff.IModel;
  protected _trans: TranslationBundle;
  protected _translations: Record<string, string>;

  private _reference: string | null = null;
  private _challenger: string | null = null;
  private _base: string | null = null;
}
