import * as React from 'react';
import List from '@material-ui/core/List';
import ClearIcon from '@material-ui/icons/Clear';
import { IGitExtension } from '../tokens';
import {
  branchMenuFilterClass,
  branchMenuFilterClearClass,
  branchMenuFilterInputClass,
  branchMenuFilterWrapperClass,
  branchMenuListWrapperClass,
  branchMenuNewBranchButtonClass,
  branchMenuWrapperClass
} from '../style/BranchMenu';

/**
 * Interface describing component properties.
 */
export interface IBranchMenuProps {
  /**
   * Git extension data model.
   */
  model: IGitExtension;
}

/**
 * Interface describing component state.
 */
export interface IBranchMenuState {
  /**
   * Menu filter.
   */
  filter: string;
}

/**
 * React component for rendering a branch menu.
 */
export class BranchMenu extends React.Component<
  IBranchMenuProps,
  IBranchMenuState
> {
  /**
   * Returns a React component for rendering a branch menu.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: IBranchMenuProps) {
    super(props);
    this.state = {
      filter: ''
    };
  }

  /**
   * Renders the component.
   *
   * @returns fragment
   */
  render() {
    return (
      <div className={branchMenuWrapperClass}>
        <div className={branchMenuFilterWrapperClass}>
          <div className={branchMenuFilterClass}>
            <input
              className={branchMenuFilterInputClass}
              type="text"
              onChange={this._onFilterChange}
              value={this.state.filter}
              placeholder="Filter"
              title="Filter branch menu"
            />
            {this.state.filter ? (
              <button className={branchMenuFilterClearClass}>
                <ClearIcon
                  titleAccess="Clear the current filter"
                  fontSize="small"
                  onClick={this._resetFilter}
                />
              </button>
            ) : null}
          </div>
          <input
            className={branchMenuNewBranchButtonClass}
            type="button"
            title="Create a new branch"
            value="New Branch"
            onClick={this._onNewBranchClick}
          />
        </div>
        <div className={branchMenuListWrapperClass}>
          <List disablePadding>{this._renderItems()}</List>
        </div>
      </div>
    );
  }

  /**
   * Renders menu items.
   *
   * @returns fragment
   */
  private _renderItems = () => {
    return <li />;
  };

  /**
   * Callback invoked upon a change to the menu filter.
   *
   * @param event - event object
   */
  private _onFilterChange = (event: any) => {
    this.setState({
      filter: event.target.value
    });
  };

  /**
   * Callback invoked to reset the menu filter.
   */
  private _resetFilter = () => {
    this.setState({
      filter: ''
    });
  };

  /**
   * Callback invoked upon clicking a button to create a new branch.
   *
   * @param event - event object
   */
  private _onNewBranchClick = () => {
    console.log('Create a new branch...');
  };
}
