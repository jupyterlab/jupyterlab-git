import { Contents } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import { Panel } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/apputils';

import * as React from 'react';
import { useState, useCallback } from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

import { Git } from '../../tokens';
import {
  ITranslator,
  nullTranslator,
  TranslationBundle
} from '@jupyterlab/translation';
import { Toolbar } from '@jupyterlab/apputils';

import {
  challengerImageClass,
  challengerLabelClass,
  labelsClass,
  referenceImageClass,
  referenceLabelClass,
  selectedTabClass,
  tabClass,
  tabIndicatorClass,
  tabsClass,
  twoUpView
} from '../../style/ImageDiffStyle';

export const createImageDiff: Git.Diff.ICallback = async (
  model: Git.Diff.IModel,
  toolbar?: Toolbar,
  translator?: ITranslator
): Promise<ImageDiffWidget> => {
  const widget = new ImageDiffWidget(model, translator.load('jupyterlab_git'));
  await widget.ready;
  return widget;
};

const modes = ['2-up', 'Swipe', 'Onion Skin'];
type ImageDiffProps = {
  referenceLabel: string;
  reference: string;
  challengerLabel: string;
  challenger: string;
  mode?: typeof modes[number];
  trans: TranslationBundle;
};

type ImageDiffViewProps = {
  reference: string;
  challenger: string;
};

const whichViewMode = (mode: typeof modes[number]) => {
  const elements = {
    '2-up': TwoUp,
    Swipe,
    'Onion Skin': OnionSkin
  } as Record<string, typeof TwoUp>;
  return elements[mode];
};

const ImageDiff = ({
  reference,
  referenceLabel,
  challenger,
  challengerLabel,
  mode,
  trans
}: ImageDiffProps) => {
  const [modeSelect, setModeSelect] = useState<string>(mode ? mode : '2-up');

  const onTabChange = useCallback(
    (event: any, tab: number) => {
      setModeSelect(modes[tab]);
    },
    [modeSelect]
  );

  const ImageDiffView = whichViewMode(modeSelect);

  return (
    <div>
      <div className={labelsClass}>
        <span className={referenceLabelClass}>{referenceLabel}</span>
        <span className={challengerLabelClass}>{challengerLabel}</span>
      </div>
      <Tabs
        classes={{ root: tabsClass, indicator: tabIndicatorClass }}
        value={modes.indexOf(modeSelect)}
        onChange={onTabChange}
        variant="fullWidth"
      >
        <Tab
          classes={{
            root: tabClass,
            selected: selectedTabClass
          }}
          title={trans.__('View Image Diff in 2-up Mode')}
          label={trans.__('2-up')}
          disableFocusRipple
          disableRipple
        />
        <Tab
          classes={{
            root: tabClass,
            selected: selectedTabClass
          }}
          title={trans.__('View Image Diff in Swipe Mode')}
          label={trans.__('Swipe')}
          disableFocusRipple
          disableRipple
        />
        <Tab
          classes={{
            root: tabClass,
            selected: selectedTabClass
          }}
          title={trans.__('View Image Diff in Onion Skin Mode')}
          label={trans.__('Onion Skin')}
          disableFocusRipple
          disableRipple
        />
      </Tabs>
      <ImageDiffView reference={reference} challenger={challenger} />
    </div>
  );
};

const TwoUp = ({ reference, challenger }: ImageDiffViewProps) => {
  return (
    <div className={twoUpView}>
      <img
        className={referenceImageClass}
        src={`data:image/png;base64,${reference}`}
        alt="reference"
      />
      <img
        className={challengerImageClass}
        src={`data:image/png;base64,${challenger}`}
        alt="challenger"
      />
    </div>
  );
};

const Swipe = ({ reference, challenger }: ImageDiffViewProps) => {
  return <div>Swipe</div>;
};

const OnionSkin = ({ reference, challenger }: ImageDiffViewProps) => {
  return <div>Onion Skin</div>;
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
      const referenceLabel = this._model.reference.label;
      const challengerLabel = this._model.challenger.label;
      const [reference, challenger] = await Promise.all([
        this._model.reference.content(),
        this._model.challenger.content()
        // this._model.base?.content() ?? Promise.resolve(null)
      ]);

      console.log(reference, challenger);

      const reactImageDiffWidget = ReactWidget.create(
        <ImageDiff
          reference={reference}
          referenceLabel={referenceLabel}
          challenger={challenger}
          challengerLabel={challengerLabel}
          mode="2-up"
          trans={this._trans}
        />
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
