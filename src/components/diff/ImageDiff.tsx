import { Contents } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import { Panel } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/apputils';

import * as React from 'react';

import { Git } from '../../tokens';
import {
  ITranslator,
  nullTranslator,
  TranslationBundle
} from '@jupyterlab/translation';
import { Toolbar } from '@jupyterlab/apputils';
import { useState } from 'react';
import { Mode as ModeTypes } from '@jupyterlab/codemirror';

export const createImageDiff: Git.Diff.ICallback = async (
  model: Git.Diff.IModel,
  toolbar?: Toolbar,
  translator?: ITranslator
): Promise<ImageDiffWidget> => {
  const widget = new ImageDiffWidget(model, translator.load('jupyterlab_git'));
  await widget.ready;
  return widget;
};

type ModeTypes = '2-up' | 'Swipe' | 'Onion Skin';
type ImageDiffProps = {
  reference: string;
  challenger: string;
  mode?: ModeTypes;
};

type ImageDiffViewProps = {
  reference: string;
  challenger: string;
};

const ImageDiff = ({ reference, challenger, mode }: ImageDiffProps) => {
  const [modeSelect, setModeSelect] = useState<ModeTypes>(mode ? mode : '2-up');

  return (
    <>
      <div>
        <button onClick={() => setModeSelect('2-up')}>2-up</button>
        <button onClick={() => setModeSelect('Swipe')}>Swipe</button>
        <button onClick={() => setModeSelect('Onion Skin')}>Onion Skin</button>
      </div>
      {modeSelect === '2-up' && (
        <TwoUp reference={reference} challenger={challenger} />
      )}
      {modeSelect === 'Swipe' && (
        <Swipe reference={reference} challenger={challenger} />
      )}
      {modeSelect === 'Onion Skin' && (
        <OnionSkin reference={reference} challenger={challenger} />
      )}
    </>
  );
};

const TwoUp = ({ reference, challenger }: ImageDiffViewProps) => {
  return <div>2-up</div>;
};

const Swipe = ({ reference, challenger }: ImageDiffViewProps) => {
  return <>Swipe</>;
};

const OnionSkin = ({ reference, challenger }: ImageDiffViewProps) => {
  return <>Onion Skin</>;
};

export class ImageDiffWidget extends Panel implements Git.Diff.IDiffWidget {
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

      const reactImageDiffWidget = ReactWidget.create(
        <ImageDiff reference={reference} challenger={challenger} mode="2-up" />
      );

      this.addWidget(reactImageDiffWidget);
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
