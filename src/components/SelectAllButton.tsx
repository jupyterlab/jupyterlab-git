import * as React from 'react';
// import { classes } from 'typestyle';
// import { actionButtonStyle } from '../style/ActionButtonStyle';

/**
 * Action button properties interface
 */
export interface ISelectAllButtonProps {
  /**
   * Customize class name
   */
  className?: string;
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
export const SelectAllButton: React.FunctionComponent<ISelectAllButtonProps> = (
  props: ISelectAllButtonProps
) => {
  const { className, onClick } = props;
  return (
    <input
      type="checkbox"
      className={className}
      onClick={onClick}
      style={{ marginRight: '10px' }}
    ></input>
  );
};
