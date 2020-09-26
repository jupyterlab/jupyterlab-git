import * as React from 'react';
import { classes } from 'typestyle';
import ListItem from '@material-ui/core/ListItem';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import ClearIcon from '@material-ui/icons/Clear';
import { sleep } from '../utils';
import { Git, IGitExtension, ILogMessage } from '../tokens';
import {
  actionsWrapperClass,
  activeListItemClass,
  branchDialogClass,
  buttonClass,
  cancelButtonClass,
  closeButtonClass,
  contentWrapperClass,
  createButtonClass,
  errorMessageClass,
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
import { SuspendModal } from './SuspendModal';
import { Alert } from './Alert';
import { VariableSizeList, ListChildComponentProps } from 'react-window';

const BRANCH_DESC = {
  current:
    'The current branch. Pick this if you want to build on work done in this branch.',
  default:
    'The default branch. Pick this if you want to start fresh from the default branch.'
};

const ITEM_HEIGHT = 27.5; // HTML element height for a single branch
const CURRENT_BRANCH_HEIGHT = 66.5; // HTML element height for the current branch with description
const HEIGHT = 200; // HTML element height for the branches list

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
   * Boolean indicating whether to enable UI suspension.
   */
  suspend: boolean;

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

  /**
   * Error message.
   */
  error: string;

  /**
   * Boolean indicating whether UI interaction should be suspended (e.g., due to pending command).
   */
  suspend: boolean;

  /**
   * Boolean indicating whether to show an alert.
   */
  alert: boolean;

  /**
   * Log message.
   */
  log: ILogMessage;
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
      branches: repo ? this.props.model.branches : [],
      error: '',
      suspend: false,
      alert: false,
      log: {
        severity: 'info',
        message: ''
      }
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
      <React.Fragment>
        {this._renderDialog()}
        {this._renderFeedback()}
      </React.Fragment>
    );
  }

  /**
   * Renders a dialog for creating a new branch.
   *
   * @returns React element
   */
  private _renderDialog(): React.ReactElement {
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
          {this.state.error ? (
            <p className={errorMessageClass}>{this.state.error}</p>
          ) : null}
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
          {this._renderItems()}
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
            disabled={this.state.name === '' || this.state.error !== ''}
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
  private _renderItems(): JSX.Element {
    const current = this.props.model.currentBranch.name;
    const branches = this.state.branches.slice().sort(comparator);
    return (
      <VariableSizeList
        className={listWrapperClass}
        height={HEIGHT}
        itemCount={branches.length}
        itemData={branches}
        itemKey={(index, data) => data[index].name}
        itemSize={index => {
          const branch = branches[index];
          return branch.name === this.state.current
            ? CURRENT_BRANCH_HEIGHT
            : ITEM_HEIGHT;
        }}
        style={{ overflowX: 'hidden' }}
        width={'auto'}
      >
        {this._renderItem}
      </VariableSizeList>
    );

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
      } else if (b.name === current) {
        return 1;
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
  private _renderItem = (props: ListChildComponentProps): JSX.Element => {
    const { data, index, style } = props;
    const branch = data[index] as Git.IBranch;
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
        onClick={this._onBranchClickFactory(branch.name)}
        style={style}
      >
        <span
          className={classes(
            'jp-git-icon',
            listItemIconClass,
            'jp-Icon-16',
            isBase && 'jp-git-selected'
          )}
        />
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
  };

  /**
   * Renders a component to provide UI feedback.
   *
   * @returns React element
   */
  private _renderFeedback(): React.ReactElement {
    return (
      <React.Fragment>
        <SuspendModal
          open={this.props.suspend && this.state.suspend}
          onClick={this._onFeedbackModalClick}
        />
        <Alert
          open={this.state.alert}
          message={this.state.log.message}
          severity={this.state.log.severity}
          onClose={this._onFeedbackAlertClose}
        />
      </React.Fragment>
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
   * Sets the suspension state.
   *
   * @param bool - boolean indicating whether to suspend UI interaction
   */
  private _suspend(bool: boolean): void {
    if (this.props.suspend) {
      this.setState({
        suspend: bool
      });
    }
  }

  /**
   * Sets the current component log message.
   *
   * @param msg - log message
   */
  private _log(msg: ILogMessage): void {
    this.setState({
      alert: true,
      log: msg
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
      filter: '',
      error: ''
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
      name: event.target.value,
      error: ''
    });
  };

  /**
   * Callback invoked upon clicking a button to create a new branch.
   *
   * @param event - event object
   */
  private _onCreate = (): void => {
    // Create the branch:
    this._createBranch(this.state.name);
  };

  /**
   * Creates a new branch.
   *
   * @param branch - branch name
   * @returns promise which resolves upon attempting to create a new branch
   */
  private async _createBranch(branch: string): Promise<void> {
    let result: Array<any>;

    const opts = {
      newBranch: true,
      branchname: branch
    };
    this._log({
      severity: 'info',
      message: 'Creating branch...'
    });
    this._suspend(true);
    try {
      result = await Promise.all([
        sleep(1000),
        this.props.model.checkout(opts)
      ]);
    } catch (err) {
      this._suspend(false);
      this.setState({
        error: err.message.replace(/^fatal:/, '')
      });
      this._log({
        severity: 'error',
        message: 'Failed to create branch.'
      });
      return;
    }
    this._suspend(false);
    const res = result[1] as Git.ICheckoutResult;
    if (res.code !== 0) {
      this.setState({
        error: res.message
      });
      this._log({
        severity: 'error',
        message: 'Failed to create branch.'
      });
      return;
    }
    this._log({
      severity: 'success',
      message: 'Branch created.'
    });
    // Close the branch dialog:
    this.props.onClose();

    // Reset the branch name and filter:
    this.setState({
      name: '',
      filter: ''
    });
  }

  /**
   * Callback invoked upon clicking on the feedback modal.
   *
   * @param event - event object
   */
  private _onFeedbackModalClick = (): void => {
    this._suspend(false);
  };

  /**
   * Callback invoked upon closing a feedback alert.
   *
   * @param event - event object
   */
  private _onFeedbackAlertClose = (): void => {
    this.setState({
      alert: false
    });
  };
}
