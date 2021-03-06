import { ReactWidget } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IStatusBar } from '@jupyterlab/statusbar';
import { TranslationBundle } from '@jupyterlab/translation';
import React from 'react';
import { gitIcon } from '../style/icons';
import {
  statusAnimatedIconClass,
  statusIconClass
} from '../style/StatusWidget';
import { IGitExtension } from '../tokens';
import { sleep } from '../utils';

export class StatusWidget extends ReactWidget {
  /**
   * Returns a status bar widget.
   * @param trans - The language translator
   * @returns widget
   */
  constructor(trans: TranslationBundle) {
    super();
    this._trans = trans;
  }

  /**
   * Sets the current status.
   */
  set status(text: string) {
    this._status = text;
    if (!this._locked) {
      this._animate();
    }
  }

  render(): JSX.Element {
    return (
      <div title={`Git: ${this._trans.__(this._status)}`}>
        <gitIcon.react
          className={
            this._status !== 'idle' ? statusAnimatedIconClass : statusIconClass
          }
          left={'1px'}
          top={'3px'}
          stylesheet={'statusBar'}
        />
      </div>
    );
  }

  /**
   * Locks the status widget to prevent updates.
   *
   * ## Notes
   *
   * -   This is used to throttle updates in order to prevent "flashing" messages.
   */
  async _animate(): Promise<void> {
    this._locked = true;
    this.update();
    await sleep(500);
    this._locked = false;
    this.update();
  }

  /**
   * Boolean indicating whether the status widget is accepting updates.
   */
  private _locked = false;

  /**
   * Status string.
   */
  private _status = '';

  private _trans: TranslationBundle;
}

export function addStatusBarWidget(
  statusBar: IStatusBar,
  model: IGitExtension,
  settings: ISettingRegistry.ISettings,
  trans: TranslationBundle
): void {
  // Add a status bar widget to provide Git status updates:
  const statusWidget = new StatusWidget(trans);
  statusBar.registerStatusItem('git-status', {
    align: 'left',
    item: statusWidget,
    isActive: Private.isStatusWidgetActive(settings),
    activeStateChanged: settings && settings.changed
  });
  model.taskChanged.connect(Private.createEventCallback(statusWidget));
}
/* eslint-disable no-inner-declarations */
namespace Private {
  /**
   * Returns a callback for updating a status widget upon receiving model events.
   *
   * @private
   * @param widget - status widget
   * @returns callback
   */
  export function createEventCallback(
    widget: StatusWidget
  ): (model: IGitExtension, event: string) => void {
    return onEvent;

    /**
     * Callback invoked upon a model event.
     *
     * @private
     * @param model - extension model
     * @param event - event name
     */
    function onEvent(model: IGitExtension, event: string) {
      let status;
      switch (event) {
        case 'empty':
          status = 'idle';
          break;
        case 'git:checkout':
          status = 'checking out...';
          break;
        case 'git:clone':
          status = 'cloning repository...';
          break;
        case 'git:commit:create':
          status = 'committing changes...';
          break;
        case 'git:commit:revert':
          status = 'reverting changes...';
          break;
        case 'git:init':
          status = 'initializing repository...';
          break;
        case 'git:pull':
          status = 'pulling changes...';
          break;
        case 'git:pushing':
          status = 'pushing changes...';
          break;
        case 'git:refresh':
          status = 'refreshing...';
          break;
        case 'git:reset:changes':
          status = 'resetting changes...';
          break;
        case 'git:reset:hard':
          status = 'discarding changes...';
          break;
        default:
          if (/git:add:files/.test(event)) {
            status = 'adding files...';
          } else {
            status = 'working...';
          }
          break;
      }
      widget.status = status;
    }
  }

  /**
   * Returns a callback which returns a boolean indicating whether the extension should display status updates.
   *
   * @private
   * @param settings - extension settings
   * @returns callback
   */
  export function isStatusWidgetActive(
    settings?: ISettingRegistry.ISettings
  ): () => boolean {
    return settings ? isActive : inactive;

    /**
     * Returns a boolean indicating that the extension should not display status updates.
     *
     * @private
     * @returns boolean indicating that the extension should not display status updates
     */
    function inactive(): boolean {
      return false;
    }

    /**
     * Returns a boolean indicating whether the extension should display status updates.
     *
     * @private
     * @returns boolean indicating whether the extension should display status updates
     */
    function isActive(): boolean {
      return settings.composite.displayStatus as boolean;
    }
  }
}
/* eslint-enable no-inner-declarations */
