import { Contents } from '@jupyterlab/services';
import { INotebookContent } from '@jupyterlab/nbformat';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { PromiseDelegate } from '@lumino/coreutils';
import { Panel } from '@lumino/widgets';
import { NotebookMergeWidget } from 'nbdime/lib/merge/widget';
import { NotebookDiffWidget } from 'nbdime/lib/diff/widget';

import { Git } from '../../tokens';
import { nullTranslator, TranslationBundle } from '@jupyterlab/translation';

export class ImageDiff extends Panel implements Git.Diff.IDiffWidget {
  [x: string]: any;
  constructor(
    model: Git.Diff.IModel,
    renderMime: IRenderMimeRegistry,
    translator?: TranslationBundle
  ) {
    super();
    const getReady = new PromiseDelegate<void>();
    this._isReady = getReady.promise;
    this._model = model;
    this._renderMime = renderMime;
    this._trans = translator ?? nullTranslator.load('jupyterlab_git');

    this.refresh()
      .then(() => {
        getReady.resolve();
      })
      .catch(reason => {
        console.error(
          this._trans.__('Failed to refresh Image diff.'),
          reason,
          reason?.traceback
        );
      });
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

  get isFileResolved(): boolean {
    return null;
  }

  async getResolvedFile(): Promise<Partial<Contents.IModel>> {
    return null;
  }

  async refresh(): Promise<void> {
    if (!this._scroller?.parent) {
      while (this.widgets.length > 0) {
        this.widgets[0].dispose();
      }

      try {
        // ENH request content only if it changed
        const referenceContent = await this._model.reference.content();
        const challengerContent = await this._model.challenger.content();
        const baseContent = await this._model.base?.content();

        const createView = baseContent
          ? this.createMergeView.bind(this)
          : this.createDiffView.bind(this);

        this._nbdWidget = await createView(
          challengerContent,
          referenceContent,
          baseContent
        );

        while (this._scroller.widgets.length > 0) {
          this._scroller.widgets[0].dispose();
        }
        this._scroller.addWidget(this._nbdWidget);
      } catch (reason) {
        this.showError(reason as Error);
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new NotebookDiffWidget(model, this._renderMime);
  }

  protected _areUnchangedCellsHidden = false;
  protected _isReady: Promise<void>;
  protected _lastSerializeModel: INotebookContent | null = null;
  protected _model: Git.Diff.IModel;
  protected _nbdWidget: NotebookMergeWidget | NotebookDiffWidget;
  protected _renderMime: IRenderMimeRegistry;
  protected _scroller: Panel;
  protected _trans: TranslationBundle;
}
