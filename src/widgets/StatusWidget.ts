import { Widget } from '@lumino/widgets';
import { sleep } from '../utils';
import { statusWidgetClass } from '../style/StatusWidget';

/**
 * Class for creating a status bar widget.
 */
export class StatusWidget extends Widget {
  /**
   * Returns a status bar widget.
   *
   * @returns widget
   */
  constructor() {
    super();
    this.addClass(statusWidgetClass);
  }

  /**
   * Sets the current status.
   */
  set status(text: string) {
    this._status = text;
    if (!this._locked) {
      this._lock();
      this.refresh();
    }
  }

  /**
   * Refreshes the status widget.
   */
  refresh(): void {
    this.node.textContent = 'Git: ' + this._status;
  }

  /**
   * Locks the status widget to prevent updates.
   *
   * ## Notes
   *
   * -   This is used to throttle updates in order to prevent "flashing" messages.
   */
  async _lock(): Promise<void> {
    this._locked = true;
    await sleep(500);
    this._locked = false;
    this.refresh();
  }

  /**
   * Boolean indicating whether the status widget is accepting updates.
   */
  private _locked = false;

  /**
   * Status string.
   */
  private _status = '';
}
