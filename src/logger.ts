import * as React from 'react';
import { ISignal, Signal } from '@lumino/signaling';
import { ILogMessage } from './tokens';

/**
 * Logger
 */
export class Logger {
  constructor() {
    this._signal = new Signal(this);
  }

  /**
   * Signal emitted when a log message is sent
   */
  get signal(): ISignal<Logger, ILogMessage> {
    return this._signal;
  }

  /**
   * Send a log message.
   *
   * @param message Log message
   */
  log(message: ILogMessage): void {
    this._signal.emit(message);
  }

  private _signal: Signal<Logger, ILogMessage>;
}

/**
 * Default logger
 */
export const logger = new Logger();

/**
 * Default logger context for React
 */
export const LoggerContext = React.createContext(logger);
