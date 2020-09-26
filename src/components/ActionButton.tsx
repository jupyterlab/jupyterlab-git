import { LabIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
import { classes } from 'typestyle';
import { actionButtonStyle } from '../style/ActionButtonStyle';

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
   * Icon
   */
  icon: LabIcon;
  /**
   * Button title
   */
  title: string;
  /**
   * On-click event handler
   */
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Action button component
 *
 * @param props Component properties
 */
export const ActionButton: React.FunctionComponent<IActionButtonProps> = (
  props: IActionButtonProps
) => {
  const { disabled, className, title, onClick, icon } = props;
  return (
    <button
      disabled={disabled}
      className={classes(actionButtonStyle, className)}
      title={title}
      onClick={onClick}
    >
      <icon.react elementPosition="center" tag="span" />
    </button>
  );
};
