import * as React from 'react';
import { classes } from 'typestyle';
import { LabIcon } from '@jupyterlab/ui-components';
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
  icon: LabIcon.IMaybeResolvable;
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
  const { disabled, className, title, onClick, icon } = props;
  return (
    <button
      disabled={disabled}
      className={classes(actionButtonStyle, className)}
      title={title}
      onClick={onClick}
    >
      {LabIcon.resolveReact({ icon })}
    </button>
  );
};
