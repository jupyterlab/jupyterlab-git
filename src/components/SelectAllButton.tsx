import * as React from 'react';

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

  /**
   * Whether the checkbox is checked
   */
  checked: boolean;
}

/**
 * Action button component
 *
 * @param props Component properties
 */
export const SelectAllButton: React.FunctionComponent<ISelectAllButtonProps> = (
  props: ISelectAllButtonProps
) => {
  const { className, onChange, checked } = props;
  return (
    <input
      type="checkbox"
      className={className}
      onChange={onChange}
      style={{ marginRight: '10px' }}
      checked={checked}
      data-test-id="SelectAllButton"
    ></input>
  );
};
