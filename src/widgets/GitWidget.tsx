import { ReactWidget } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { CommandRegistry } from '@lumino/commands';
import { Widget } from '@lumino/widgets';
import * as React from 'react';
import { GitPanel } from '../components/GitPanel';
import { GitExtension } from '../model';
import { gitWidgetStyle } from '../style/GitWidgetStyle';

/**
 * A class that exposes the git plugin Widget.
 */
export class GitWidget extends ReactWidget {
  constructor(
    model: GitExtension,
    settings: ISettingRegistry.ISettings,
    commands: CommandRegistry,
    filebrowser: FileBrowserModel,
    options?: Widget.IOptions
  ) {
    super(options);
    this.node.id = 'GitSession-root';
    this.addClass(gitWidgetStyle);

    this._model = model;
    this._commands = commands;
    this._settings = settings;
    this._filebrowser = filebrowser;
  }

  render() {
    return (
      <GitPanel
        model={this._model}
        commands={this._commands}
        settings={this._settings}
        filebrowser={this._filebrowser}
      />
    );
  }

  private _model: GitExtension;
  private _commands: CommandRegistry;
  private _settings: ISettingRegistry.ISettings;
  private _filebrowser: FileBrowserModel;
}
