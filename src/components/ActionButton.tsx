import * as React from 'react';
import { classes } from 'typestyle';
import { actionButtonStyle } from '../style/ActionButtonStyle';
import { LabIcon } from '@jupyterlab/ui-components';

/**
 * Action button properties interface
 */
export interface IActionButtonProps {
  /**
   * Customize class name
   */
  className?: string;
  /**
   * Is disabled?
   */
  disabled?: boolean;
  /**
   * Icon name
   */
  iconName: string;
  /**
   * Button title
   */
  title: string;
  /**
   * On-click event handler
   */
  onClick?: (event?: React.MouseEvent) => void;
}

/**
 * Action button component
 *
 * @param props Component properties
 */
export const ActionButton: React.FunctionComponent<IActionButtonProps> = (
  props: IActionButtonProps
) => {
  const Icon = LabIcon.resolve({ icon: props.iconName });
  return (
    <button
      disabled={props.disabled}
      className={classes(actionButtonStyle, props.className)}
      title={props.title}
      onClick={props.onClick}
    >
      <Icon.react tag="span" />
    </button>
  );
};
