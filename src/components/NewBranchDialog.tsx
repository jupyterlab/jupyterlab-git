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
  filterClass,
  filterClearClass,
  filterInputClass,
  filterWrapperClass,
  listItemBoldTitleClass,
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

const BRANCH_DESC = {
  current:
    'The current branch. Pick this if you want to build on work done in this branch.',
  default:
    'The default branch. Pick this if you want to start fresh from the default branch.'
};

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
   * Menu filter.
   */
  filter: string;

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

    this.state = {
      name: '',
      base: repo ? this.props.model.currentBranch.name : '',
      filter: '',
      current: repo ? this.props.model.currentBranch.name : '',
      branches: repo ? this.props.model.branches : []
    };
  }

  /**
   * Callback invoked immediately after mounting a component (i.e., inserting into a tree).
   */
  componentDidMount(): void {
    this._addListeners();
  }

  /**
   * Callback invoked when a component will no longer be mounted.
   */
  componentWillUnmount(): void {
    this._removeListeners();
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <Dialog
        classes={{
          paper: branchDialogClass
        }}
        open={this.props.open}
        onClose={this._onClose}
      >
        <div className={titleWrapperClass}>
          <p className={titleClass}>Create a Branch</p>
          <button className={closeButtonClass}>
            <ClearIcon
              titleAccess="Close this dialog"
              fontSize="small"
              onClick={this._onClose}
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
          </div>
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
            onClick={this._onClose}
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
   * @returns array of React elements
   */
  private _renderItems(): React.ReactElement[] {
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
      if (a.name === 'master') {
        return -1;
      } else if (b.name === 'master') {
        return 1;
      }
      return 0;
    }
  }

  /**
   * Renders a branch menu item.
   *
   * @param branch - branch
   * @param idx - item index
   * @returns React element
   */
  private _renderItem(
    branch: Git.IBranch,
    idx: number
  ): React.ReactElement | null {
    // Perform a "simple" filter... (TODO: consider implementing fuzzy filtering)
    if (this.state.filter && !branch.name.includes(this.state.filter)) {
      return null;
    }
    const isBase = branch.name === this.state.base;
    const isCurr = branch.name === this.state.current;

    let isBold;
    let desc;
    if (isCurr) {
      isBold = true;
      desc = BRANCH_DESC['current'];
    }
    return (
      <ListItem
        button
        title={`Create a new branch based on: ${branch.name}`}
        className={classes(listItemClass, isBase ? activeListItemClass : null)}
        key={branch.name}
        onClick={this._onBranchClickFactory(branch.name)}
      >
        <span className={classes(listItemIconClass, 'jp-Icon-16')} />
        <div className={listItemContentClass}>
          <p
            className={classes(
              listItemTitleClass,
              isBold ? listItemBoldTitleClass : null
            )}
          >
            {branch.name}
          </p>
          {desc ? <p className={listItemDescClass}>{desc}</p> : null}
        </div>
      </ListItem>
    );
  }

  /**
   * Adds model listeners.
   */
  private _addListeners(): void {
    // When the HEAD changes, decent probability that we've switched branches:
    this.props.model.headChanged.connect(this._syncState, this);

    // When the status changes, we may have checked out a new branch (e.g., via the command-line and not via the extension) or changed repositories:
    this.props.model.statusChanged.connect(this._syncState, this);
  }

  /**
   * Removes model listeners.
   */
  private _removeListeners(): void {
    this.props.model.headChanged.disconnect(this._syncState, this);
    this.props.model.statusChanged.disconnect(this._syncState, this);
  }

  /**
   * Syncs the component state with the underlying model.
   */
  private _syncState(): void {
    const repo = this.props.model.pathRepository;
    this.setState({
      base: repo ? this.state.base : '',
      current: repo ? this.props.model.currentBranch.name : '',
      branches: repo ? this.props.model.branches : []
    });
  }

  /**
   * Callback invoked upon closing the dialog.
   *
   * @param event - event object
   */
  private _onClose = (): void => {
    this.props.onClose();
    this.setState({
      name: '',
      filter: ''
    });
  };

  /**
   * Callback invoked upon a change to the menu filter.
   *
   * @param event - event object
   */
  private _onFilterChange = (event: any): void => {
    this.setState({
      filter: event.target.value
    });
  };

  /**
   * Callback invoked to reset the menu filter.
   */
  private _resetFilter = (): void => {
    this.setState({
      filter: ''
    });
  };

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
    function onClick(): void {
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

    // Reset the branch name and filter:
    this.setState({
      name: '',
      filter: ''
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
    function onResolve(result: any): void {
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
    function onError(err: any): void {
      showErrorMessage('Error creating branch', err.message);
    }
  }
}
