import { TranslationBundle } from '@jupyterlab/translation';
import { Dialog, showDialog, showErrorMessage } from '@jupyterlab/apputils';
import { Button } from '@material-ui/core';
import Portal from '@material-ui/core/Portal';
import Slide from '@material-ui/core/Slide';
import Snackbar from '@material-ui/core/Snackbar';
import { Color, default as MuiAlert } from '@material-ui/lab/Alert';
import * as React from 'react';

/**
 * Returns a React component for "sliding-in" an alert.
 *
 * @private
 * @param props - component properties
 * @returns React element
 */
function SlideTransition(props: any): React.ReactElement {
  return <Slide {...props} direction="up" />;
}

/**
 * Interface describing component properties.
 */
export interface IAlertProps {
  /**
   * Detailed message
   */
  details?: string;

  /**
   * Alert duration (in milliseconds).
   */
  duration?: number;

  /**
   * Error object
   */
  error?: Error;

  /**
   * Alert message.
   */
  message: string;

  /**
   * Boolean indicating whether to display an alert.
   */
  open: boolean;

  /**
   * Callback invoked upon clicking on an alert.
   */
  onClick?: (event?: any) => void;

  /**
   * Callback invoked upon closing an alert.
   */
  onClose: (event?: any) => void;

  /**
   * Alert severity.
   */
  severity?: Color;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

/**
 * React component for rendering an alert.
 */
export class Alert extends React.Component<IAlertProps> {
  /**
   * Returns a React component for rendering an alert.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: IAlertProps) {
    super(props);
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    let duration: number | null = null;

    const severity = this.props.severity || 'info';
    if (severity === 'success') {
      duration = this.props.duration || 5000; // milliseconds
    }

    let action: React.ReactNode;
    if (this.props.error) {
      action = (
        <Button
          color="inherit"
          size="small"
          onClick={() => {
            showErrorMessage(this.props.trans.__('Error'), this.props.error, [
              Dialog.warnButton({ label: this.props.trans.__('Dismiss') })
            ]);
          }}
        >
          {this.props.trans.__('SHOW')}
        </Button>
      );
    } else if (this.props.details) {
      action = (
        <Button
          color="inherit"
          size="small"
          onClick={() => {
            showDialog({
              title: this.props.trans.__('Detailed message'),
              body: this.props.details,
              buttons: [
                Dialog.okButton({ label: this.props.trans.__('DISMISS') })
              ]
            });
          }}
        >
          {this.props.trans.__('Details')}
        </Button>
      );
    }

    return (
      <Portal>
        <Snackbar
          key="git:alert"
          open={this.props.open}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          autoHideDuration={duration}
          TransitionComponent={SlideTransition}
          onClick={this._onClick}
          onClose={this._onClose}
        >
          <MuiAlert action={action} variant="filled" severity={severity}>
            {this.props.message || this.props.trans.__('(missing message)')}
          </MuiAlert>
        </Snackbar>
      </Portal>
    );
  }

  /**
   * Callback invoked upon clicking on an alert.
   *
   * @param event - event object
   */
  private _onClick = (event: any): void => {
    if (this.props.onClick) {
      this.props.onClick(event);
      return;
    }
    this._onClose(event, 'click');
  };

  /**
   * Callback invoked upon closing an alert.
   *
   * @param event - event object
   * @param reason - reason why the callback was invoked
   */
  private _onClose = (event: any, reason: string): void => {
    if (reason === 'clickaway') {
      return;
    }
    this.props.onClose(event);
  };
}
