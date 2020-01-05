import * as React from 'react';
import { classes } from 'typestyle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import ClearIcon from '@material-ui/icons/Clear';
import { showErrorMessage } from '@jupyterlab/apputils';
import { Git, IGitExtension } from '../tokens';
import {
  branchDialogButtonClass,
  branchDialogCancelButtonClass,
  branchDialogClass,
  branchDialogCloseClass,
  branchDialogCreateButtonClass,
  branchDialogTitleClass,
  branchDialogTitleWrapperClass,
  branchMenuActiveListItemClass,
  branchMenuFilterClass,
  branchMenuFilterClearClass,
  branchMenuFilterInputClass,
  branchMenuFilterWrapperClass,
  branchMenuListItemClass,
  branchMenuListItemIconClass,
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

  /**
   * Boolean indicating whether to show a dialog to create a new branch.
   */
  branchDialog: boolean;
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
      filter: '',
      branchDialog: false
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
        <Dialog
          classes={{
            paper: branchDialogClass
          }}
          open={this.state.branchDialog}
          onClose={this._onBranchDialogClose}
          aria-labelledby="new-branch-dialog"
        >
          <div className={branchDialogTitleWrapperClass}>
            <p className={branchDialogTitleClass}>Create a Branch</p>
            <button className={branchDialogCloseClass}>
              <ClearIcon
                titleAccess="Close this dialog"
                fontSize="small"
                onClick={this._onBranchDialogClose}
              />
            </button>
          </div>
          <DialogActions>
            <input
              className={classes(
                branchDialogButtonClass,
                branchDialogCancelButtonClass
              )}
              type="button"
              title="Close this dialog without creating a new branch"
              value="Cancel"
              onClick={this._onBranchDialogClose}
            />
            <input
              className={classes(
                branchDialogButtonClass,
                branchDialogCreateButtonClass
              )}
              type="button"
              title="Create a new branch"
              value="Create Branch"
              onClick={this._onBranchDialogCreate}
            />
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  /**
   * Renders menu items.
   *
   * @returns fragment
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
        className={classes(
          branchMenuListItemClass,
          branch.name === this.props.model.currentBranch.name
            ? branchMenuActiveListItemClass
            : null
        )}
        key={idx}
        onClick={this._onBranchClickFactory(branch.name)}
      >
        <span className={branchMenuListItemIconClass} />
        {branch.name}
      </ListItem>
    );
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
    this.setState({
      branchDialog: true
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

  /**
   * Callback invoked upon closing a dialog to create a new branch.
   *
   * @param event - event object
   */
  private _onBranchDialogClose = () => {
    this.setState({
      branchDialog: false
    });
  };

  /**
   * Callback invoked upon clicking a button to create a new branch.
   *
   * @param event - event object
   */
  private _onBranchDialogCreate = () => {
    this._onBranchDialogClose();
    let foo = this._createBranch; // FIXME: invoke
    console.log(foo);
  };

  /**
   * Creates a new branch.
   *
   * @param branch - branch name
   */
  private _createBranch = (branch: string) => {
    const opts = {
      newBranch: true,
      branchname: branch
    };
    this.props.model
      .checkout(opts)
      .then(onResolve)
      .catch(onError);

    /**
     * Callback invoked upon promise resolution.
     *
     * @private
     * @param result - result
     */
    function onResolve(result: any) {
      if (result.code !== 0) {
        showErrorMessage('Error creating branch', result.message);
      }
    }

    /**
     * Callback invoked upon encountering an error.
     *
     * @private
     * @param err - error
     */
    function onError(err: any) {
      showErrorMessage('Error creating branch', err.message);
    }
  };
}
