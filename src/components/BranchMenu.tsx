import { Dialog, showDialog, showErrorMessage } from '@jupyterlab/apputils';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ClearIcon from '@material-ui/icons/Clear';
import * as React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { classes } from 'typestyle';
import { Logger } from '../logger';
import { hiddenButtonStyle } from '../style/ActionButtonStyle';
import {
  activeListItemClass,
  nameClass,
  filterClass,
  filterClearClass,
  filterInputClass,
  filterWrapperClass,
  listItemClass,
  listItemIconClass,
  newBranchButtonClass,
  wrapperClass
} from '../style/BranchMenu';
import { branchIcon, trashIcon } from '../style/icons';
import { Git, IGitExtension, Level } from '../tokens';
import { ActionButton } from './ActionButton';
import { NewBranchDialog } from './NewBranchDialog';

const CHANGES_ERR_MSG =
  'The current branch contains files with uncommitted changes. Please commit or discard these changes before switching to or creating another branch.';
const ITEM_HEIGHT = 24.8; // HTML element height for a single branch
const MIN_HEIGHT = 150; // Minimal HTML element height for the branches list
const MAX_HEIGHT = 400; // Maximal HTML element height for the branches list

/**
 * Callback invoked upon encountering an error when switching branches.
 *
 * @private
 * @param error - error
 * @param logger - the logger
 */
function onBranchError(error: any, logger: Logger): void {
  if (error.message.includes('following files would be overwritten')) {
    // Empty log message to hide the executing alert
    logger.log({
      message: '',
      level: Level.INFO
    });
    showDialog({
      title: 'Unable to switch branch',
      body: (
        <React.Fragment>
          <p>
            Your changes to the following files would be overwritten by
            switching:
          </p>
          <List>
            {error.message
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
    logger.log({
      level: Level.ERROR,
      message: 'Failed to switch branch.',
      error
    });
  }
}

/**
 * Renders a file name.
 *
 * @private
 * @param filename - file name
 * @returns React element
 */
function renderFileName(filename: string): React.ReactElement {
  return <ListItem key={filename}>{filename}</ListItem>;
}

/**
 * Interface describing component properties.
 */
export interface IBranchMenuProps {
  /**
   * Current branch name.
   */
  currentBranch: string;

  /**
   * Current list of branches.
   */
  branches: Git.IBranch[];

  /**
   * Boolean indicating whether branching is disabled.
   */
  branching: boolean;

  /**
   * Extension logger
   */
  logger: Logger;

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
   * Boolean indicating whether to show a dialog to create a new branch.
   */
  branchDialog: boolean;

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
      filter: '',
      branchDialog: false
    };
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <div className={wrapperClass}>
        {this._renderFilter()}
        {this._renderBranchList()}
        {this._renderNewBranchDialog()}
      </div>
    );
  }

  /**
   * Renders a branch input filter.
   *
   * @returns React element
   */
  private _renderFilter(): React.ReactElement {
    return (
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
    );
  }

  /**
   * Renders a
   *
   * @returns React element
   */
  private _renderBranchList(): React.ReactElement {
    // Perform a "simple" filter... (TODO: consider implementing fuzzy filtering)
    const filter = this.state.filter;
    const branches = this.props.branches.filter(
      branch => !filter || branch.name.includes(filter)
    );
    return (
      <FixedSizeList
        height={Math.min(
          Math.max(MIN_HEIGHT, branches.length * ITEM_HEIGHT),
          MAX_HEIGHT
        )}
        itemCount={branches.length}
        itemData={branches}
        itemKey={(index, data) => data[index].name}
        itemSize={ITEM_HEIGHT}
        style={{ overflowX: 'hidden', paddingTop: 0, paddingBottom: 0 }}
        width={'auto'}
      >
        {this._renderItem}
      </FixedSizeList>
    );
  }

  /**
   * Renders a menu item.
   *
   * @param props Row properties
   * @returns React element
   */
  private _renderItem = (props: ListChildComponentProps): JSX.Element => {
    const { data, index, style } = props;
    const branch = data[index] as Git.IBranch;
    const isActive = branch.name === this.props.currentBranch;
    return (
      <ListItem
        button
        title={`Switch to branch: ${branch.name}`}
        className={classes(
          listItemClass,
          isActive ? activeListItemClass : null
        )}
        onClick={this._onBranchClickFactory(branch.name)}
        style={style}
      >
        <branchIcon.react className={listItemIconClass} tag="span" />
        <span className={nameClass}>{branch.name}</span>
        {!branch.is_remote_branch && !isActive && (
          <ActionButton
            className={hiddenButtonStyle}
            icon={trashIcon}
            title={'Delete this branch locally'}
            onClick={(event: React.MouseEvent) => {
              event.stopPropagation();
              this._onDeleteBranch(branch.name);
            }}
          />
        )}
      </ListItem>
    );
  };

  /**
   * Renders a dialog for creating a new branch.
   *
   * @returns React element
   */
  private _renderNewBranchDialog(): React.ReactElement {
    return (
      <NewBranchDialog
        currentBranch={this.props.currentBranch}
        branches={this.props.branches}
        logger={this.props.logger}
        open={this.state.branchDialog}
        model={this.props.model}
        onClose={this._onNewBranchDialogClose}
      />
    );
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
   * Callback on delete branch name button
   *
   * @param branchName Branch name
   */
  private _onDeleteBranch = async (branchName: string): Promise<void> => {
    const acknowledgement = await showDialog<void>({
      title: 'Delete branch',
      body: (
        <p>
          Are you sure you want to permanently delete the branch{' '}
          <b>{branchName}</b>?
          <br />
          This action cannot be undone.
        </p>
      ),
      buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Delete' })]
    });
    if (acknowledgement.button.accept) {
      try {
        await this.props.model.deleteBranch(branchName);
        await this.props.model.refreshBranch();
      } catch (error) {
        console.error(`Failed to delete branch ${branchName}`, error);
      }
    }
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
     * @returns promise which resolves upon attempting to switch branches
     */
    async function onClick(): Promise<void> {
      if (!self.props.branching) {
        showErrorMessage('Switching branches is disabled', CHANGES_ERR_MSG);
        return;
      }
      const opts = {
        branchname: branch
      };

      self.props.logger.log({
        level: Level.RUNNING,
        message: 'Switching branch...'
      });

      try {
        await self.props.model.checkout(opts);
      } catch (err) {
        return onBranchError(err, self.props.logger);
      }

      self.props.logger.log({
        level: Level.SUCCESS,
        message: 'Switched branch.'
      });
    }
  }
}
