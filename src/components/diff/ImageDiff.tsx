import { Contents } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import { Panel } from '@lumino/widgets';
import { ReactWidget } from '@jupyterlab/apputils';

import * as React from 'react';
import {
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
  useEffect
} from 'react';
import { Slider as MUISlider, withStyles } from '@material-ui/core';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

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
  imageCol,
  imageDiffWidgetClass,
  labelsClass,
  onionSkinChallengerImage,
  onionSkinContainer,
  onionSkinImage,
  onionSkinImageContainer,
  onionSkinReferenceImage,
  referenceImageClass,
  referenceLabelClass,
  sliderChallengerCircle,
  sliderReferenceCircle,
  swipeBackground,
  swipeChallengerImage,
  swipeContainer,
  swipeReferenceImage,
  slider,
  tabClass,
  tabIndicatorClass,
  tabsClass,
  twoUpView,
  swipeImage,
  emptyRefImage,
  emptyChallImage
} from '../../style/ImageDiffStyle';
import { filesize } from 'filesize';

export const createImageDiff: Git.Diff.ICallback = async (
  model: Git.Diff.IModel,
  toolbar?: Toolbar,
  translator?: ITranslator
): Promise<ImageDiffWidget> => {
  const widget = new ImageDiffWidget(model, translator.load('jupyterlab_git'));
  await widget.ready;
  return widget;
};

const MODES = ['2-up', 'Swipe', 'Onion Skin'];
const IMAGE_FILE_TYPES = ['png', 'jpeg', 'jpg'];

type ImageDiffProps = {
  referenceLabel: string;
  reference: string;
  challengerLabel: string;
  challenger: string;
  mode?: (typeof MODES)[number];
  trans: TranslationBundle;
  fileType: (typeof IMAGE_FILE_TYPES)[number];
};

type ImageDiffViewProps = {
  reference: string;
  challenger: string;
  fileType: string;
};

const whichViewMode = (mode: string) => {
  const elements = {
    '2-up': TwoUp,
    Swipe,
    'Onion Skin': OnionSkin
  } as Record<string, typeof TwoUp>;
  return elements[mode];
};

const base64FileSize = (base64str: string) => {
  const n = 0.75 * base64str.length;
  return filesize(n);
};

const getFileType = (filename: string) => {
  return (
    filename.substring(filename.lastIndexOf('.') + 1, filename.length) ||
    filename
  );
};

const ImageDiff = ({
  reference,
  referenceLabel,
  challenger,
  challengerLabel,
  mode,
  trans,
  fileType
}: ImageDiffProps) => {
  const [modeSelect, setModeSelect] = useState<string>(mode ? mode : '2-up');

  const onTabChange = useCallback(
    (event: any, tab: number) => {
      setModeSelect(MODES[tab]);
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
        value={MODES.indexOf(modeSelect)}
        onChange={onTabChange}
        variant="fullWidth"
      >
        <Tab
          classes={{
            root: tabClass
          }}
          title={trans.__('View Image Diff in 2-up Mode')}
          label={trans.__('2-up')}
          disableFocusRipple
          disableRipple
        />
        <Tab
          classes={{
            root: tabClass
          }}
          title={trans.__('View Image Diff in Swipe Mode')}
          label={trans.__('Swipe')}
          disableFocusRipple
          disableRipple
        />
        <Tab
          classes={{
            root: tabClass
          }}
          title={trans.__('View Image Diff in Onion Skin Mode')}
          label={trans.__('Onion Skin')}
          disableFocusRipple
          disableRipple
        />
      </Tabs>
      <ImageDiffView
        reference={reference}
        challenger={challenger}
        fileType={fileType}
      />
    </div>
  );
};

const TwoUp = ({ reference, challenger, fileType }: ImageDiffViewProps) => {
  const [referDimensions, setReferDimensions] = useState<number[]>([100, 100]);
  const [challDimensions, setChallDimensions] = useState<number[]>([100, 100]);

  const [imageDimensions, setImageDimensions] = useState<number[]>([100, 100]);

  const handleReferLoad = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    let width = event.currentTarget.naturalWidth;
    let height = event.currentTarget.naturalHeight;
    setReferDimensions([width, height]);

    width = Math.min(event.currentTarget.width, 400);
    height = Math.min(event.currentTarget.height, 400);
    setImageDimensions([width, height]);
  };

  const handleChallLoad = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    let width = event.currentTarget.naturalWidth;
    let height = event.currentTarget.naturalHeight;
    setChallDimensions([width, height]);

    width = Math.min(event.currentTarget.width, 400);
    height = Math.min(event.currentTarget.height, 400);
    setImageDimensions([width, height]);
  };

  useEffect(() => {
    if (!reference) {
      setReferDimensions([...challDimensions]);
    }
  }, [challDimensions]);

  useEffect(() => {
    if (!challenger) {
      setChallDimensions([...referDimensions]);
    }
  }, [referDimensions]);

  return (
    <div className={twoUpView}>
      <div className={imageCol}>
        <img
          className={`${referenceImageClass} ${
            !reference ? emptyRefImage : ''
          }`}
          src={`data:image/${fileType};base64,${reference}`}
          alt={'Reference'}
          onLoad={handleReferLoad}
          style={
            !reference
              ? {
                  width: `${imageDimensions[0]}px`,
                  height: `${imageDimensions[1]}px`
                }
              : {}
          }
        />
        <label htmlFor={referenceImageClass}>{`W: ${
          referDimensions[0]
        }px | H: ${referDimensions[1]}px | ${base64FileSize(
          reference
        )}`}</label>
      </div>
      <div className={imageCol}>
        <img
          className={`${challengerImageClass} ${
            !challenger ? emptyChallImage : ''
          }`}
          src={`data:image/${fileType};base64,${challenger}`}
          alt={'challenger'}
          onLoad={handleChallLoad}
          style={
            !challenger
              ? {
                  width: `${imageDimensions[0]}px`,
                  height: `${imageDimensions[1]}px`
                }
              : {}
          }
        />
        <label htmlFor={challengerImageClass}>{`W: ${
          challDimensions[0]
        }px | H: ${challDimensions[1]}px | ${base64FileSize(
          challenger
        )}`}</label>
      </div>
    </div>
  );
};

type SliderProps = {
  value: number;
  onChange: (
    event: React.ChangeEvent<unknown>,
    newValue: number | number[]
  ) => void;
  width: number;
  reversed?: boolean;
};

const CustomMUISlider = withStyles({
  root: {
    color: 'var(--jp-brand-color1)'
  },
  thumb: {
    backgroundColor: 'var(--jp-brand-color1)'
  }
})(MUISlider);

const Slider = ({ value, onChange, width, reversed }: SliderProps) => {
  const circleClasses = reversed
    ? [sliderChallengerCircle, sliderReferenceCircle]
    : [sliderReferenceCircle, sliderChallengerCircle];

  return (
    <div className={slider}>
      <span className={circleClasses[0]}>&#x25CF;</span>
      <CustomMUISlider
        style={{ width: `${width + 10}px` }}
        value={value}
        onChange={onChange}
      />
      <span className={circleClasses[1]}>&#x25CF;</span>
    </div>
  );
};

const Swipe = ({ reference, challenger, fileType }: ImageDiffViewProps) => {
  const [sliderValue, setSliderValue] = useState(50);
  const [sliderWidth, setSliderWidth] = useState(0);

  const referenceImageRef = useRef(null);
  const challengerImageRef = useRef(null);

  const handleSliderChange = (
    event: React.ChangeEvent<unknown>,
    newValue: number | number[]
  ) => {
    if (typeof newValue === 'number') {
      setSliderValue(newValue);
    }
  };

  useLayoutEffect(() => {
    const refWidth = reference ? referenceImageRef.current.offsetWidth : 0;
    const challWidth = challenger ? challengerImageRef.current.offsetWidth : 0;

    setSliderWidth(Math.max(refWidth, challWidth) - 10);
  }, []);

  return (
    <div className={swipeContainer}>
      <Slider
        value={sliderValue}
        onChange={handleSliderChange}
        width={sliderWidth}
        reversed
      />
      <div className={swipeBackground}>
        <img
          src={`data:image/${fileType};base64,${reference}`}
          className={`${swipeImage} ${swipeReferenceImage} ${
            !reference ? emptyRefImage : ''
          }`}
          style={{
            clipPath: `polygon(0 0, ${sliderValue - 0.1}% 0, ${
              sliderValue - 0.1
            }% 100%, 0% 100%)`,
            width: sliderWidth ? `${sliderWidth}px` : ''
          }}
          alt="Reference"
          ref={referenceImageRef}
        />
        <img
          src={`data:image/${fileType};base64,${challenger}`}
          className={`${swipeImage} ${swipeChallengerImage} ${
            !challenger ? emptyChallImage : ''
          }`}
          style={{
            clipPath: `polygon(${sliderValue + 0.1}% 0, 100% 0, 100% 100%, ${
              sliderValue + 0.1
            }% 100%)`,
            width: sliderWidth ? `${sliderWidth}px` : ''
          }}
          alt="Challenger"
          ref={challengerImageRef}
        />
      </div>
    </div>
  );
};

const OnionSkin = ({ reference, challenger, fileType }: ImageDiffViewProps) => {
  const [sliderValue, setSliderValue] = useState(50);
  const [sliderWidth, setSliderWidth] = useState(40);

  const referenceImageRef = useRef(null);
  const challengerImageRef = useRef(null);

  const handleSliderChange = (
    event: React.ChangeEvent<unknown>,
    newValue: number | number[]
  ) => {
    if (typeof newValue === 'number') {
      setSliderValue(newValue);
    }
  };

  useLayoutEffect(() => {
    const refWidth = reference ? referenceImageRef.current.offsetWidth : 40;
    const challWidth = challenger ? challengerImageRef.current.offsetWidth : 40;

    setSliderWidth(Math.max(refWidth, challWidth) - 10);
  }, []);

  return (
    <div className={onionSkinContainer}>
      <Slider
        value={sliderValue}
        onChange={handleSliderChange}
        width={sliderWidth}
      />
      <div className={onionSkinImageContainer}>
        <img
          src={`data:image/${fileType};base64,${reference}`}
          alt="Reference"
          className={`${onionSkinImage} ${onionSkinReferenceImage} ${
            !reference ? emptyRefImage : ''
          }`}
          style={!reference ? { width: `${sliderWidth}px` } : {}}
          ref={referenceImageRef}
        />
        <img
          src={`data:image/${fileType};base64,${challenger}`}
          alt="Challenger"
          className={`${onionSkinImage} ${onionSkinChallengerImage} ${
            !challenger ? emptyChallImage : ''
          }`}
          style={{ opacity: sliderValue / 100 }}
          ref={challengerImageRef}
        />
      </div>
    </div>
  );
};

export class ImageDiffWidget extends Panel implements Git.Diff.IDiffWidget {
  constructor(model: Git.Diff.IModel, translator?: TranslationBundle) {
    super();
    this.addClass('jp-git-image-diff');
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
    try {
      const referenceLabel = this._model.reference.label;
      const challengerLabel = this._model.challenger.label;
      const [reference, challenger] = await Promise.all([
        this._model.reference.content(),
        this._model.challenger.content()
      ]);

      const fileType = getFileType(this._model.filename);

      if (!IMAGE_FILE_TYPES.includes(fileType)) {
        throw Error(
          `Image file format ${fileType} not supported. Only ${IMAGE_FILE_TYPES} file extensions are supported' by the image diff view.`
        );
      }

      const reactImageDiffWidget = ReactWidget.create(
        <ImageDiff
          reference={reference}
          referenceLabel={referenceLabel}
          challenger={challenger}
          challengerLabel={challengerLabel}
          mode="2-up"
          trans={this._trans}
          fileType={fileType}
        />
      );

      this.addClass(imageDiffWidgetClass);

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

    while (this.widgets.length > 0) {
      this.widgets[0].dispose();
    }

    const msg = ((error.message || error) as string).replace('\n', '<br />');
    this.node.innerHTML = `<p style="color: unset" class="jp-git-diff-error">
      <span>${this._trans.__('Error Loading Image Diff:')}</span>
      <span class="jp-git-diff-error-message">${msg}</span>
    </p>`;
  }

  protected _container: HTMLElement;
  protected _isReady: Promise<void>;
  protected _model: Git.Diff.IModel;
  protected _trans: TranslationBundle;
}
