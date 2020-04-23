import * as React from 'react';
import { classes } from 'typestyle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ClearIcon from '@material-ui/icons/Clear';
import { Dialog, showDialog, showErrorMessage } from '@jupyterlab/apputils';
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
  current: string;

  /**
   * Current list of branches.
   */
  branches: Git.IBranch[];
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

    const repo = this.props.model.pathRepository;

    this.state = {
      filter: '',
      branchDialog: false,
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
   * @returns array of React elements
   */
  private _renderItems(): React.ReactElement[] {
    return this.state.branches.map(this._renderItem, this);
  }

  /**
   * Renders a menu item.
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
    return (
      <ListItem
        button
        title={`Switch to branch: ${branch.name}`}
        className={classes(
          listItemClass,
          branch.name === this.state.current ? activeListItemClass : null
        )}
        key={branch.name}
        onClick={this._onBranchClickFactory(branch.name)}
      >
        <span className={listItemIconClass} />
        {branch.name}
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
      current: repo ? this.props.model.currentBranch.name : '',
      branches: repo ? this.props.model.branches : []
    });
  }

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
   * Callback invoked upon clicking a button to create a new branch.
   *
   * @param event - event object
   */
  private _onNewBranchClick = (): void => {
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
  private _onNewBranchDialogClose = (): void => {
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
    function onResolve(result: any): void {
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
    function onError(err: any): void {
      if (err.message.includes('following files would be overwritten')) {
        showDialog({
          title: 'Unable to switch branch',
          body: (
            <React.Fragment>
              <p>
                Your changes to the follow files would be overwritten by
                switching:
              </p>
              <List>
                {err.message
                  .split('\n')
                  .slice(1, -3)
                  .map(renderFileName)}
              </List>
              <span>
                Please commit, stash, or discard your changes before you switch
                branches.
              </span>
            </React.Fragment>
          ),
          buttons: [Dialog.okButton({ label: 'Dismiss' })]
        });
      } else {
        showErrorMessage('Error switching branch', err.message);
      }
    }

    /**
     * Render a filename into a list
     * @param filename
     * @returns ReactElement
     */
    function renderFileName(filename: string): React.ReactElement {
      return <ListItem key={filename}>{filename}</ListItem>;
    }
  }
}
