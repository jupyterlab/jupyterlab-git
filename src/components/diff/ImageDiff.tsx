import { Contents } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import { Panel } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/apputils';

import * as React from 'react';
import ReactCompareImage from 'react-compare-image';

import { Git } from '../../tokens';
import {
  ITranslator,
  nullTranslator,
  TranslationBundle
} from '@jupyterlab/translation';
import { Toolbar } from '@jupyterlab/apputils';

export const createImageDiff: Git.Diff.ICallback = async (
  model: Git.Diff.IModel,
  toolbar?: Toolbar,
  translator?: ITranslator
): Promise<ImageDiff> => {
  const widget = new ImageDiff(model, translator.load('jupyterlab_git'));
  await widget.ready;
  return widget;
};

type CompareImageProps = {
  reference: string;
  challenger: string;
}

const CompareImage = ({ reference, challenger }: CompareImageProps) => {
  return (
    <ReactCompareImage
      leftImage={`data:image/png;base64,${reference}`}
      rightImage={`data:image/png;base64,${challenger}`}
      leftImageLabel="Reference"
      rightImageLabel="Challenger"
    />
  )
}

export class ImageDiff extends Panel implements Git.Diff.IDiffWidget {
  constructor(model: Git.Diff.IModel, translator?: TranslationBundle) {
    super();
    const getReady = new PromiseDelegate<void>();
    this._container = this.node as HTMLElement;
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
    // await this.ready;
    try {
      const [reference, challenger] = await Promise.all([
        this._model.reference.content(),
        this._model.challenger.content()
        // this._model.base?.content() ?? Promise.resolve(null)
      ]);

      const compareImageWidget = ReactWidget.create(
        <CompareImage reference={reference} challenger={challenger} />
      );

      this.addWidget(compareImageWidget);
    } catch (reason) {
      this.showError(reason as Error);
    }
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
  protected _isReady: Promise<void>;
  protected _model: Git.Diff.IModel;
  protected _trans: TranslationBundle;
}
