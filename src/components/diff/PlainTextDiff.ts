import { Toolbar } from '@jupyterlab/apputils';
import { Mode } from '@jupyterlab/codemirror';
import { PromiseDelegate } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';
import { MergeView } from 'codemirror';
import { Git } from '../../tokens';
import { mergeView } from './mergeview';
import { DiffModel } from './model';

/**
 * Diff callback to be registered for plain-text files.
 *
 * @param model Diff model
 * @param toolbar MainAreaWidget toolbar
 * @returns PlainText diff widget
 */
export const createPlainTextDiff: Git.Diff.ICallback<string> = async (
  model: DiffModel<string>,
  toolbar?: Toolbar
): Promise<PlainTextDiff> => {
  const widget = new PlainTextDiff(model);
  await widget.ready;
  return widget;
};

/**
 * Plain Text Diff widget
 */
export class PlainTextDiff extends Widget {
  constructor(model: DiffModel<string>) {
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
        getReady.reject(reason);
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
    this.createDiffView();
  }

  /**
   * Undo onAfterAttach
   */
  onBeforeDetach(): void {
    while (this._container.children.length > 0) {
      this._container.children[0].remove();
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
  protected async createDiffView(): Promise<void> {
    if (!this._mergeView) {
      const mode =
        Mode.findByFileName(this._model.filename) ||
        Mode.findBest(this._model.filename);

      await this.ready;

      if (!this._reference) {
        this._reference = await this._model.reference.content();
      }
      if (!this._challenger) {
        this._challenger = await this._model.challenger.content();
      }

      this._mergeView = mergeView(this._container, {
        value: this._challenger,
        orig: this._reference,
        mode: mode.mime,
        ...PlainTextDiff.getDefaultOptions()
      }) as MergeView.MergeViewEditor;

      this._reference = null;
      this._challenger = null;
    }
  }

  protected static getDefaultOptions(): Partial<MergeView.MergeViewEditorConfiguration> {
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
  protected _model: DiffModel<string>;

  private _reference: string | null = null;
  private _challenger: string | null = null;
}
