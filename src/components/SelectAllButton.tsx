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
  onChange?: (event?: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Action button component
 *
 * @param props Component properties
 */
export const SelectAllButton: React.FunctionComponent<ISelectAllButtonProps> = (
  props: ISelectAllButtonProps
) => {
  const { className, onChange } = props;
  return (
    <input
      type="checkbox"
      className={className}
      onChange={onChange}
      style={{ marginRight: '10px' }}
    ></input>
  );
};
