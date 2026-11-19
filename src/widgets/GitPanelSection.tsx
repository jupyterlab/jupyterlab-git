import { ReactWidget } from '@jupyterlab/apputils';
import { PanelWithToolbar } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import * as React from 'react';
import type { IGitPanelProps } from '../components/GitPanel';
import { sectionBodyStyle, sectionStyle } from '../style/GitWidgetStyle';

/**
 * A Git sidebar section displaying one view of the Git panel.
 *
 * The panel code is loaded the first time the section is displayed, so that
 * it stays out of the application startup.
 */
export class GitPanelSection extends PanelWithToolbar {
  constructor(props: IGitPanelProps) {
    super();
    this.addClass(sectionStyle);
    this._props = props;
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    if (this.isVisible) {
      this._onDisplayed();
    }
  }

  protected onBeforeShow(msg: Message): void {
    super.onBeforeShow(msg);
    this._onDisplayed();
  }

  private _onDisplayed(): void {
    // The section may be displayed in another panel than the Git panel.
    this._props.model.refresh().catch(error => {
      console.error(
        'Fail to refresh model when displaying a Git section.',
        error
      );
    });
    if (!this._contentPromise) {
      this._contentPromise = this._createContent();
      this._contentPromise.catch(error => {
        console.error('Fail to load the content of a Git section.', error);
      });
    }
  }

  private async _createContent(): Promise<void> {
    const { GitPanel } = await import('../components/GitPanel');
    if (this.isDisposed) {
      return;
    }
    const content = ReactWidget.create(<GitPanel {...this._props} />);
    content.addClass(sectionBodyStyle);
    this.addWidget(content);
  }

  private _props: IGitPanelProps;
  private _contentPromise: Promise<void> | null = null;
}
