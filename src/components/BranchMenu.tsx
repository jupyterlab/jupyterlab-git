import * as React from 'react';
import { classes } from 'typestyle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ClearIcon from '@material-ui/icons/Clear';
import { showErrorMessage } from '@jupyterlab/apputils';
import { Git, IGitExtension } from '../tokens';
import {
  activeListItemClass,
  filterClass,
  filterClearClass,
  filterInputClass,
  filterWrapperClass,
  listItemClass,
  listItemIconClass,
  listWrapperClass,
  newBranchButtonClass,
  wrapperClass
} from '../style/BranchMenu';
import { NewBranchDialog } from './NewBranchDialog';

const CHANGES_ERR_MSG =
  'The current branch contains files with uncommitted changes. Please commit or discard these changes before switching to or creating another branch.';

/**
 * Interface describing component properties.
 */
export interface IBranchMenuProps {
  /**
   * Git extension data model.
   */
  model: IGitExtension;

  /**
   * Boolean indicating whether branching is disabled.
   */
  branching: boolean;
}

/**
 * Interface describing component state.
 */
export interface IBranchMenuState {
  /**
   * Menu filter.
   */
  filter: string;

  /**
   * Boolean indicating whether to show a dialog to create a new branch.
   */
  branchDialog: boolean;

  /**
   * Current branch name.
   */
  branch: string;
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

    // When the repository changes, we're likely to have a new set of branches:
    this.props.model.repositoryChanged.connect(this._syncState, this);

    // When the HEAD changes, decent probability that we've switched branches:
    this.props.model.headChanged.connect(this._syncState, this);

    // When the status changes, we may have checked out a new branch (e.g., via the command-line and not via the extension):
    this.props.model.statusChanged.connect(this._syncState, this);

    this.state = {
      filter: '',
      branchDialog: false,
      branch: this.props.model.pathRepository
        ? this.props.model.currentBranch.name
        : ''
    };
  }

  /**
   * Renders the component.
   *
   * @returns fragment
   */
  render() {
    return (
      <div className={wrapperClass}>
        <div className={filterWrapperClass}>
          <div className={filterClass}>
            <input
              className={filterInputClass}
              type="text"
              onChange={this._onFilterChange}
              value={this.state.filter}
              placeholder="Filter"
              title="Filter branch menu"
            />
            {this.state.filter ? (
              <button className={filterClearClass}>
                <ClearIcon
                  titleAccess="Clear the current filter"
                  fontSize="small"
                  onClick={this._resetFilter}
                />
              </button>
            ) : null}
          </div>
          <input
            className={newBranchButtonClass}
            type="button"
            title="Create a new branch"
            value="New Branch"
            onClick={this._onNewBranchClick}
          />
        </div>
        <div className={listWrapperClass}>
          <List disablePadding>{this._renderItems()}</List>
        </div>
        <NewBranchDialog
          open={this.state.branchDialog}
          model={this.props.model}
          onClose={this._onNewBranchDialogClose}
        />
      </div>
    );
  }

  /**
   * Renders menu items.
   *
   * @returns fragment array
   */
  private _renderItems = () => {
    return this.props.model.branches.map(this._renderItem);
  };

  /**
   * Renders a menu item.
   *
   * @param branch - branch
   * @param idx - item index
   * @returns fragment
   */
  private _renderItem = (branch: Git.IBranch, idx: number) => {
    // Perform a "simple" filter... (TODO: consider implementing fuzzy filtering)
    if (this.state.filter && !branch.name.includes(this.state.filter)) {
      return null;
    }
    return (
      <ListItem
        button
        title={`Switch to branch: ${branch.name}`}
        className={classes(
          listItemClass,
          branch.name === this.state.branch ? activeListItemClass : null
        )}
        key={idx}
        onClick={this._onBranchClickFactory(branch.name)}
      >
        <span className={listItemIconClass} />
        {branch.name}
      </ListItem>
    );
  };

  /**
   * Syncs the component state with the underlying model.
   */
  private _syncState = () => {
    console.log('SYNCING STATE');
    this.setState({
      branch: this.props.model.pathRepository
        ? this.props.model.currentBranch.name
        : ''
    });
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
    if (!this.props.branching) {
      showErrorMessage('Creating a new branch is disabled', CHANGES_ERR_MSG);
      return;
    }
    this.setState({
      branchDialog: true
    });
  };

  /**
   * Callback invoked upon closing a dialog to create a new branch.
   */
  private _onNewBranchDialogClose = () => {
    this.setState({
      branchDialog: false
    });
  };

  /**
   * Returns a callback which is invoked upon clicking a branch name.
   *
   * @param branch - branch name
   * @returns callback
   */
  private _onBranchClickFactory = (branch: string) => {
    const self = this;
    return onClick;

    /**
     * Callback invoked upon clicking a branch name.
     *
     * @private
     * @param event - event object
     */
    function onClick() {
      if (!self.props.branching) {
        showErrorMessage('Switching branches is disabled', CHANGES_ERR_MSG);
        return;
      }
      const opts = {
        branchname: branch
      };
      self.props.model
        .checkout(opts)
        .then(onResolve)
        .catch(onError);
    }

    /**
     * Callback invoked upon promise resolution.
     *
     * @private
     * @param result - result
     */
    function onResolve(result: any) {
      if (result.code !== 0) {
        showErrorMessage('Error switching branch', result.message);
      }
    }

    /**
     * Callback invoked upon encountering an error.
     *
     * @private
     * @param err - error
     */
    function onError(err: any) {
      showErrorMessage('Error switching branch', err.message);
    }
  };
}
