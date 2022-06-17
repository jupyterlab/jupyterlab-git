import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IStatusBar } from '@jupyterlab/statusbar';
import { TranslationBundle } from '@jupyterlab/translation';
import { Badge } from '@material-ui/core';
import React from 'react';
import { classes } from 'typestyle';
import { Operation, showGitOperationDialog } from '../commandsAndMenu';
import { gitIcon } from '../style/icons';
import {
  badgeClass,
  statusAnimatedIconClass,
  statusIconClass,
  currentBranchNameClass
} from '../style/StatusWidget';
import { toolbarButtonClass } from '../style/Toolbar';
import { IGitExtension } from '../tokens';
import { sleep } from '../utils';
import { ActionButton } from './ActionButton';

export class StatusWidget extends ReactWidget {
  /**
   * Returns a status bar widget.
   * @param trans - The language translator
   * @returns widget
   */
  constructor(model: IGitExtension, trans: TranslationBundle) {
    super();
    this._model = model;
    this._trans = trans;

    this.addClass('jp-git-StatusWidget');
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
      <>
        <UseSignal
          signal={this._model.credentialsRequiredChanged}
          initialArgs={false}
        >
          {(_, needsCredentials) => (
            <Badge
              className={badgeClass}
              variant="dot"
              invisible={!needsCredentials}
              data-test-id="git-credential-badge"
            >
              <ActionButton
                className={classes(
                  toolbarButtonClass,
                  this._status !== 'idle'
                    ? statusAnimatedIconClass
                    : statusIconClass
                )}
                icon={gitIcon}
                onClick={
                  needsCredentials
                    ? async () => this._showGitOperationDialog()
                    : undefined
                }
                title={
                  needsCredentials
                    ? `Git: ${this._trans.__('credentials required')}`
                    : `Git: ${this._trans.__(this._status)}`
                }
              />
            </Badge>
          )}
        </UseSignal>

        <UseSignal signal={this._model.headChanged}>
          {() =>
            this._model.currentBranch && (
              <span className={currentBranchNameClass}>
                {this._model.currentBranch.name}
              </span>
            )
          }
        </UseSignal>
      </>
    );
  }

  async _showGitOperationDialog(): Promise<void> {
    try {
      await showGitOperationDialog(this._model, Operation.Fetch, this._trans);
    } catch (error) {
      console.error('Encountered an error when fetching. Error:', error);
    }
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

  private _model: IGitExtension;
  private _trans: TranslationBundle;
}

export function addStatusBarWidget(
  statusBar: IStatusBar,
  model: IGitExtension,
  settings: ISettingRegistry.ISettings,
  trans: TranslationBundle
): void {
  // Add a status bar widget to provide Git status updates:
  const statusWidget = new StatusWidget(model, trans);
  statusBar.registerStatusItem('git-status', {
    align: 'left',
    item: statusWidget,
    isActive: Private.isStatusWidgetActive(settings),
    activeStateChanged: settings && settings.changed
  });

  const callback = Private.createEventCallback(statusWidget);
  model.taskChanged.connect(callback);

  statusWidget.disposed.connect(() => {
    model.taskChanged.disconnect(callback);
  });
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
          status = 'checking out…';
          break;
        case 'git:clone':
          status = 'cloning repository…';
          break;
        case 'git:commit:create':
          status = 'committing changes…';
          break;
        case 'git:commit:revert':
          status = 'reverting changes…';
          break;
        case 'git:init':
          status = 'initializing repository…';
          break;
        case 'git:merge':
          status = 'merging…';
          break;
        case 'git:pull':
          status = 'pulling changes…';
          break;
        case 'git:pushing':
          status = 'pushing changes…';
          break;
        case 'git:refresh':
          status = 'refreshing…';
          break;
        case 'git:reset:changes':
          status = 'resetting changes…';
          break;
        case 'git:reset:hard':
          status = 'discarding changes…';
          break;
        default:
          if (/git:add:files/.test(event)) {
            status = 'adding files…';
          } else {
            status = 'working…';
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
