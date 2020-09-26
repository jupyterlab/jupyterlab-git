import * as React from 'react';
import Modal from '@material-ui/core/Modal';
import CircularProgress from '@material-ui/core/CircularProgress';
import { fullscreenProgressClass } from '../style/SuspendModal';

/**
 * Interface describing component properties.
 */
export interface ISuspendModalProps {
  /**
   * Boolean indicating whether to display a modal blocking UI interaction.
   */
  open: boolean;

  /**
   * Callback invoked upon clicking on a modal.
   */
  onClick?: (event?: any) => void;
}

/**
 * React component for rendering a modal blocking UI interaction.
 */
export class SuspendModal extends React.Component<ISuspendModalProps> {
  /**
   * Returns a React component for rendering a modal.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: ISuspendModalProps) {
    super(props);
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <Modal
        disableAutoFocus={true}
        disableEnforceFocus={true}
        open={this.props.open}
        onClick={this._onClick}
      >
        <div className={fullscreenProgressClass}>
          <CircularProgress color="inherit" />
        </div>
      </Modal>
    );
  }

  /**
   * Callback invoked upon clicking on a feedback modal.
   *
   * @param event - event object
   */
  private _onClick = (event: any): void => {
    this.props.onClick && this.props.onClick(event);
  };
}
