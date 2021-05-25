import { Toolbar } from '@jupyterlab/apputils';
import { Mode } from '@jupyterlab/codemirror';
import { PromiseDelegate } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';
import { MergeView } from 'codemirror';
import { Git } from '../../tokens';
import { mergeView } from './mergeview';

/**
 * Diff callback to be registered for plain-text files.
 *
 * @param model Diff model
 * @param toolbar MainAreaWidget toolbar
 * @returns PlainText diff widget
 */
export const createPlainTextDiff: Git.Diff.ICallback<string> = async (
  model: Git.Diff.IModel<string>,
  toolbar?: Toolbar
): Promise<PlainTextDiff> => {
  const widget = new PlainTextDiff(model);
  await widget.ready;
  return widget;
};

/**
 * Plain Text Diff widget
 */
export class PlainTextDiff extends Widget implements Git.Diff.IDiffWidget {
  constructor(model: Git.Diff.IModel<string>) {
    super({
      node: PlainTextDiff.createNode(
        model.reference.label,
        model.challenger.label
      )
    });
    const getReady = new PromiseDelegate<void>();
    this._isReady = getReady.promise;
    this._container = this.node.lastElementChild as HTMLElement;
    this._model = model;

    // Load file content early
    Promise.all([
      this._model.reference.content(),
      this._model.challenger.content()
    ])
      .then(([reference, challenger]) => {
        this._reference = reference;
        this._challenger = challenger;

        getReady.resolve();
      })
      .catch(reason => {
        this.showError(reason);
        getReady.resolve();
      });
  }

  /**
   * Promise which fulfills when the widget is ready.
   */
  get ready(): Promise<void> {
    return this._isReady;
  }

  /**
   * Callback to create the diff widget once the widget
   * is attached so CodeMirror get proper size.
   */
  onAfterAttach(): void {
    this.ready
      .then(() => {
        if (this._challenger !== null && this._reference !== null) {
          this.createDiffView(this._challenger, this._reference);
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

      this.createDiffView(this._challenger, this._reference);
      this._challenger = null;
      this._reference = null;
    } catch (reason) {
      this.showError(reason);
    }
  }

  /**
   * Create wrapper node
   */
  protected static createNode(
    baseLabel: string,
    remoteLabel: string
  ): HTMLElement {
    const head = document.createElement('div');
    head.className = 'jp-git-diff-root';
    head.innerHTML = `
    <div class="jp-git-diff-banner">
      <span>${baseLabel}</span>
      <span class="jp-spacer"></span>
      <span>${remoteLabel}</span>
    </div>
    <div class="jp-git-PlainText-diff"></div>`;
    return head;
  }

  /**
   * Create the Plain Text Diff view
   */
  protected async createDiffView(
    challengerContent: string,
    referenceContent: string
  ): Promise<void> {
    if (!this._mergeView) {
      const mode =
        Mode.findByFileName(this._model.filename) ||
        Mode.findBest(this._model.filename);

      this._mergeView = mergeView(this._container, {
        value: challengerContent,
        orig: referenceContent,
        mode: mode.mime,
        ...this.getDefaultOptions()
      }) as MergeView.MergeViewEditor;
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
      'Failed to load file diff.',
      error,
      (error as any)?.traceback
    );
    const msg = ((error.message || error) as string).replace('\n', '<br />');
    this.node.innerHTML = `<p class="jp-git-diff-error">
      <span>Error Loading File Diff:</span>
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
  protected _model: Git.Diff.IModel<string>;

  private _reference: string | null = null;
  private _challenger: string | null = null;
}
