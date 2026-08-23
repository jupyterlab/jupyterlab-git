import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IStatusBar } from '@jupyterlab/statusbar';
import { TranslationBundle } from '@jupyterlab/translation';
import Badge from '@mui/material/Badge';
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
  set status(status: StatusWidget.IStatus) {
    this._status = status;
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
                  this._status.isIdle
                    ? statusIconClass
                    : statusAnimatedIconClass
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
                    : `Git: ${this._status.message}`
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
   * Current status.
   */
  private _status: StatusWidget.IStatus = { isIdle: false, message: '' };

  private _model: IGitExtension;
  private _trans: TranslationBundle;
}

export namespace StatusWidget {
  /**
   * Status displayed by the Git status bar widget.
   */
  export interface IStatus {
    /**
     * Whether no Git operation is currently running.
     */
    isIdle: boolean;

    /**
     * Translated message describing the current Git operation.
     */
    message: string;
  }
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

  const callback = Private.createEventCallback(statusWidget, trans);
  model.taskChanged.connect(callback);

  statusWidget.disposed.connect(() => {
    model.taskChanged.disconnect(callback);
  });
}
namespace Private {
  /**
   * Returns a callback for updating a status widget upon receiving model events.
   *
   * @private
   * @param widget - status widget
   * @param trans - language translator
   * @returns callback
   */
  export function createEventCallback(
    widget: StatusWidget,
    trans: TranslationBundle
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
      let isIdle = false;
      let message: string;
      switch (event) {
        case 'empty':
          isIdle = true;
          message = trans.__('idle');
          break;
        case 'git:checkout':
          message = trans.__('checking out…');
          break;
        case 'git:clone':
          message = trans.__('cloning repository…');
          break;
        case 'git:commit:create':
          message = trans.__('committing changes…');
          break;
        case 'git:commit:revert':
          message = trans.__('reverting changes…');
          break;
        case 'git:init':
          message = trans.__('initializing repository…');
          break;
        case 'git:merge':
          message = trans.__('merging…');
          break;
        case 'git:pull':
          message = trans.__('pulling changes…');
          break;
        case 'git:pushing':
          message = trans.__('pushing changes…');
          break;
        case 'git:rebase':
          message = trans.__('rebasing…');
          break;
        case 'git:rebase:resolve':
          message = trans.__('resolving rebase…');
          break;
        case 'git:refresh':
          message = trans.__('refreshing…');
          break;
        case 'git:reset:changes':
          message = trans.__('resetting changes…');
          break;
        case 'git:reset:hard':
          message = trans.__('discarding changes…');
          break;
        default:
          if (/git:add:files/.test(event)) {
            message = trans.__('adding files…');
          } else {
            message = trans.__('working…');
          }
          break;
      }
      widget.status = { isIdle, message };
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
      return (settings?.composite.displayStatus ?? true) as boolean;
    }
  }
}
