import { Toolbar } from '@jupyterlab/apputils';
import { Mode } from '@jupyterlab/codemirror';
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
export const createPlainTextDiff: Git.IDiffCallback<string> = async (
  model: DiffModel<string>,
  toolbar?: Toolbar
): Promise<PlainTextDiff> => {
  return Promise.resolve(new PlainTextDiff(model));
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
    this._model = model;
  }

  /**
   * Callback to create the diff widget once the widget
   * is attached so CodeMirror get proper size.
   */
  onAfterAttach(): void {
    this.createDiffView();
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
    <div class=jp-git-diff-banner>
      <span>${baseLabel}</span>
      <span>${remoteLabel}</span>
    </div>`;
    const container = document.createElement('div');
    container.className = 'jp-git-PlainText-diff';
    head.appendChild(container);
    return head;
  }

  /**
   * Create the Plain Text Diff view
   */
  protected createDiffView(): void {
    if (!this._mergeView) {
      const mode =
        Mode.findByFileName(this._model.filename) ||
        Mode.findBest(this._model.filename);

      this._mergeView = mergeView(
        this.node.getElementsByClassName(
          'jp-git-PlainText-diff'
        )[0] as HTMLElement,
        {
          value: this._model.challenger.content,
          orig: this._model.reference.content,
          mode: mode.mime,
          ...PlainTextDiff.getDefaultOptions()
        }
      ) as MergeView.MergeViewEditor;
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

  protected _mergeView: MergeView.MergeViewEditor;
  protected _model: DiffModel<string>;
}
