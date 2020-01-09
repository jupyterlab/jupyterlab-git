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
  actionsWrapperClass,
  activeListItemClass,
  branchDialogClass,
  buttonClass,
  cancelButtonClass,
  closeButtonClass,
  contentWrapperClass,
  createButtonClass,
  listItemClass,
  listItemContentClass,
  listItemDescClass,
  listItemIconClass,
  listItemTitleClass,
  listWrapperClass,
  nameInputClass,
  titleClass,
  titleWrapperClass
} from '../style/NewBranchDialog';

/**
 * Interface describing component properties.
 */
export interface INewBranchDialogProps {
  /**
   * Git extension data model.
   */
  model: IGitExtension;

  /**
   * Boolean indicating whether to show the dialog.
   */
  open: boolean;

  /**
   * Callback to invoke upon closing the dialog.
   */
  onClose: () => void;
}

/**
 * Interface describing component state.
 */
export interface INewBranchDialogState {
  /**
   * Branch name.
   */
  name: string;

  /**
   * Base branch.
   */
  base: string;

  /**
   * Current branch name.
   */
  current: string;

  /**
   * Current list of branches.
   */
  branches: Git.IBranch[];
}

/**
 * React component for rendering a dialog to create a new branch.
 */
export class NewBranchDialog extends React.Component<
  INewBranchDialogProps,
  INewBranchDialogState
> {
  /**
   * Returns a React component for rendering a branch menu.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: INewBranchDialogProps) {
    super(props);

    const repo = this.props.model.pathRepository;
    this._addListeners();

    this.state = {
      name: '',
      base: repo ? this.props.model.currentBranch.name : '',
      current: repo ? this.props.model.currentBranch.name : '',
      branches: repo ? this.props.model.branches : []
    };
  }

  /**
   * Callback invoked when a component will no longer be mounted.
   */
  componentWillUnmount() {
    this._removeListeners();
  }

  /**
   * Renders the component.
   *
   * @returns fragment
   */
  render() {
    return (
      <Dialog
        classes={{
          paper: branchDialogClass
        }}
        open={this.props.open}
        onClose={this.props.onClose}
        aria-labelledby="new-branch-dialog"
      >
        <div className={titleWrapperClass}>
          <p className={titleClass}>Create a Branch</p>
          <button className={closeButtonClass}>
            <ClearIcon
              titleAccess="Close this dialog"
              fontSize="small"
              onClick={this.props.onClose}
            />
          </button>
        </div>
        <div className={contentWrapperClass}>
          <p>Name</p>
          <input
            className={nameInputClass}
            type="text"
            onChange={this._onNameChange}
            value={this.state.name}
            placeholder=""
            title="Enter a branch name"
          />
          <p>Create branch based on...</p>
          <div className={listWrapperClass}>
            <List disablePadding>{this._renderItems()}</List>
          </div>
        </div>
        <DialogActions className={actionsWrapperClass}>
          <input
            className={classes(buttonClass, cancelButtonClass)}
            type="button"
            title="Close this dialog without creating a new branch"
            value="Cancel"
            onClick={this.props.onClose}
          />
          <input
            className={classes(buttonClass, createButtonClass)}
            type="button"
            title="Create a new branch"
            value="Create Branch"
            onClick={this._onCreate}
          />
        </DialogActions>
      </Dialog>
    );
  }

  /**
   * Renders branch menu items.
   *
   * @returns fragment array
   */
  private _renderItems() {
    const current = this.props.model.currentBranch.name;
    return this.state.branches
      .slice()
      .sort(comparator)
      .map(this._renderItem, this);

    /**
     * Comparator function for sorting branches.
     *
     * @private
     * @param a - first branch
     * @param b - second branch
     * @returns integer indicating sort order
     */
    function comparator(a: Git.IBranch, b: Git.IBranch): number {
      if (a.name === current) {
        return -1;
      }
      return 0;
    }
  }

  /**
   * Renders a branch menu item.
   *
   * @param branch - branch
   * @param idx - item index
   * @returns fragment
   */
  private _renderItem(branch: Git.IBranch, idx: number) {
    return (
      <ListItem
        button
        className={classes(
          listItemClass,
          branch.name === this.state.base ? activeListItemClass : null
        )}
        key={idx}
        onClick={this._onBranchClickFactory(branch.name)}
      >
        <span className={classes(listItemIconClass, 'jp-Icon-16')} />
        <div className={listItemContentClass}>
          <p className={listItemTitleClass}>{branch.name}</p>
          {branch.name === this.state.current ? (
            <p className={listItemDescClass}>
              The current branch. Pick this if you want to build on work done in
              this branch.
            </p>
          ) : null}
        </div>
      </ListItem>
    );
  }

  /**
   * Adds model listeners.
   */
  private _addListeners(): void {
    // When the repository changes, we're likely to have a new set of branches:
    this.props.model.repositoryChanged.connect(this._syncState, this);

    // When the HEAD changes, decent probability that we've switched branches:
    this.props.model.headChanged.connect(this._syncState, this);

    // When the status changes, we may have checked out a new branch (e.g., via the command-line and not via the extension):
    this.props.model.statusChanged.connect(this._syncState, this);
  }

  /**
   * Removes model listeners.
   */
  private _removeListeners(): void {
    this.props.model.repositoryChanged.disconnect(this._syncState, this);
    this.props.model.headChanged.disconnect(this._syncState, this);
    this.props.model.statusChanged.disconnect(this._syncState, this);
  }

  /**
   * Syncs the component state with the underlying model.
   */
  private _syncState(): void {
    const repo = this.props.model.pathRepository;
    this.setState({
      base: repo ? this.props.model.currentBranch.name : '',
      current: repo ? this.props.model.currentBranch.name : '',
      branches: repo ? this.props.model.branches : []
    });
  }

  /**
   * Returns a callback which is invoked upon clicking a branch name.
   *
   * @param branch - branch name
   * @returns callback
   */
  private _onBranchClickFactory(branch: string) {
    const self = this;
    return onClick;

    /**
     * Callback invoked upon clicking a branch name.
     *
     * @private
     * @param event - event object
     */
    function onClick() {
      self.setState({
        base: branch
      });
    }
  }

  /**
   * Callback invoked upon a change to the branch name input element.
   *
   * @param event - event object
   */
  private _onNameChange = (event: any): void => {
    this.setState({
      name: event.target.value
    });
  };

  /**
   * Callback invoked upon clicking a button to create a new branch.
   *
   * @param event - event object
   */
  private _onCreate = (): void => {
    const branch = this.state.name;

    // Close the branch dialog:
    this.props.onClose();

    // Reset the branch name:
    this.setState({
      name: ''
    });

    // Create the branch:
    this._createBranch(branch);
  };

  /**
   * Creates a new branch.
   *
   * @param branch - branch name
   */
  private _createBranch(branch: string): void {
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
  }
}
