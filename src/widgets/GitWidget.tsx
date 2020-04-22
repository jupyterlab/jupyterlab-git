import { ReactWidget } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
import { GitPanel } from '../components/GitPanel';
import { GitExtension } from '../model';
import { gitWidgetStyle } from '../style/GitWidgetStyle';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * A class that exposes the git plugin Widget.
 */
export class GitWidget extends ReactWidget {
  constructor(
    model: GitExtension,
    settings: ISettingRegistry.ISettings,
    renderMime: IRenderMimeRegistry,
    options?: Widget.IOptions
  ) {
    super(options);
    this.node.id = 'GitSession-root';
    this.addClass(gitWidgetStyle);

    this._model = model;
    this._renderMime = renderMime;
    this._settings = settings;
  }

  render() {
    return (
      <GitPanel
        model={this._model}
        renderMime={this._renderMime}
        settings={this._settings}
      />
    );
  }

  private _model: GitExtension;
  private _renderMime: IRenderMimeRegistry;
  private _settings: ISettingRegistry.ISettings;
}
