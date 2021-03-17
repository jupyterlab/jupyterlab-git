import { TranslationBundle } from '@jupyterlab/translation';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Color } from '@material-ui/lab/Alert';
import * as React from 'react';
import { ILogMessage, Level } from '../tokens';
import { Alert } from './Alert';
import { SuspendModal } from './SuspendModal';

const LEVEL_TO_SEVERITY: Map<Level, Color> = new Map([
  [Level.ERROR, 'error'],
  [Level.WARNING, 'warning'],
  [Level.SUCCESS, 'success'],
  [Level.INFO, 'info'],
  [Level.RUNNING, 'info']
]);

const VISUAL_DELAY = 1000; // in ms

export interface IFeedbackProps {
  /**
   * Alert
   */
  log: ILogMessage;

  /**
   * Extension settings
   */
  settings: ISettingRegistry.ISettings;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

export interface IFeedbackState {
  /**
   * Overlay visibility
   */
  blockUI: boolean;

  /**
   * Log message stack
   */
  logStack: ILogMessage[];

  /**
   * Last time the feedback message was changed
   */
  lastUpdate: number;

  /**
   * Alert visibility
   */
  showAlert: boolean;
}

/**
 * Component to handle logger user feedback
 */
export class Feedback extends React.Component<IFeedbackProps, IFeedbackState> {
  constructor(props: IFeedbackProps) {
    super(props);

    this.state = {
      blockUI: false,
      lastUpdate: Date.now() - VISUAL_DELAY,
      logStack: [],
      showAlert: false
    };
  }

  static getDerivedStateFromProps(
    props: IFeedbackProps,
    state: IFeedbackState
  ): IFeedbackState {
    const latestLog = state.logStack[state.logStack.length - 1];
    const now = Date.now();
    if (props.log !== latestLog) {
      if (now - state.lastUpdate > VISUAL_DELAY) {
        state.logStack.shift();
      }
      if (latestLog && props.log.level > latestLog.level) {
        // Higher level takes over
        state.logStack.splice(0, 1, props.log);
        state.lastUpdate = now;
      } else {
        state.logStack.push(props.log);
      }
      state.blockUI = props.settings.composite[
        'blockWhileCommandExecutes'
      ] as boolean;
      state.showAlert = true;
    }
    return state;
  }

  render(): JSX.Element {
    if (this.state.logStack.length > 1) {
      setTimeout(() => {
        if (this.state.logStack.length > 1) {
          this.setState({
            blockUI: this.props.settings.composite[
              'blockWhileCommandExecutes'
            ] as boolean,
            logStack: this.state.logStack.slice(1),
            lastUpdate: Date.now(),
            showAlert: true
          });
        }
      }, VISUAL_DELAY);
    }

    const log = this.state.logStack[0];

    return (
      <React.Fragment>
        <SuspendModal
          open={
            this.state.blockUI &&
            log.level === Level.RUNNING &&
            this.state.showAlert
          }
          onClick={() => {
            this.setState({ blockUI: false });
          }}
        />
        <Alert
          details={log?.details}
          error={log?.error}
          open={this.state.showAlert}
          message={log?.message || this.props.log.message}
          severity={LEVEL_TO_SEVERITY.get(log?.level || this.props.log.level)}
          onClose={() => this.setState({ showAlert: false })}
          trans={this.props.trans}
        />
      </React.Fragment>
    );
  }
}
