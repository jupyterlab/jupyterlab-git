import { Contents } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import { Panel } from '@lumino/widgets';

import { Git } from '../../tokens';
import {
  ITranslator,
  nullTranslator,
  TranslationBundle
} from '@jupyterlab/translation';
import { Toolbar } from '@jupyterlab/apputils';
import { GitWidget } from '../../widgets/GitWidget';

export const createImageDiff: Git.Diff.ICallback = async (
  model: Git.Diff.IModel,
  toolbar?: Toolbar,
  translator?: ITranslator
): Promise<ImageDiff> => {
  const widget = new ImageDiff(model, translator.load('jupyterlab_git'));
  await widget.ready;
  return widget;
};

export class ImageDiff extends Panel implements Git.Diff.IDiffWidget {
  [x: string]: any;
  constructor(model: Git.Diff.IModel, translator?: TranslationBundle) {
    super();
    const getReady = new PromiseDelegate<void>();
    this._isReady = getReady.promise;
    this._model = model;
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

        this._imgWidget = await createView(
          challengerContent,
          referenceContent,
          baseContent
        );

        while (this._scroller.widgets.length > 0) {
          this._scroller.widgets[0].dispose();
        }
        this._scroller.addWidget(this._imgWidget);
      } catch (reason) {
        this.showError(reason as Error);
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new GitWidget(model, this._renderMime);
  }

  protected _areUnchangedCellsHidden = false;
  protected _isReady: Promise<void>;
  protected _model: Git.Diff.IModel;
  protected _imgWidget: GitWidget;
  protected _scroller: Panel;
  protected _trans: TranslationBundle;
}
