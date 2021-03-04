import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import ListItem from '@material-ui/core/ListItem';
import ClearIcon from '@material-ui/icons/Clear';
import { TranslationBundle } from '@jupyterlab/translation';
import * as React from 'react';
import { ListChildComponentProps, VariableSizeList } from 'react-window';
import { classes } from 'typestyle';
import { Logger } from '../logger';
import { branchIcon } from '../style/icons';
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
import { Git, IGitExtension, Level } from '../tokens';

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
   * Current branch name.
   */
  currentBranch: string;

  /**
   * Current list of branches.
   */
  branches: Git.IBranch[];

  /**
   * Extension logger
   */
  logger: Logger;

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

  /**
   * The application language translator.
   */
  trans: TranslationBundle;
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
   * Error message.
   */
  error: string;
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

    this._branchList = React.createRef<VariableSizeList>();
    this.state = {
      name: '',
      base: props.currentBranch || '',
      filter: '',
      error: ''
    };
  }

  /**
   * Renders a dialog for creating a new branch.
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
          <p className={titleClass}>{this.props.trans.__('Create a Branch')}</p>
          <button className={closeButtonClass}>
            <ClearIcon
              titleAccess={this.props.trans.__('Close this dialog')}
              fontSize="small"
              onClick={this._onClose}
            />
          </button>
        </div>
        <div className={contentWrapperClass}>
          {this.state.error ? (
            <p className={errorMessageClass}>{this.state.error}</p>
          ) : null}
          <p>{this.props.trans.__('Name')}</p>
          <input
            className={nameInputClass}
            type="text"
            onChange={this._onNameChange}
            value={this.state.name}
            placeholder=""
            title={this.props.trans.__('Enter a branch name')}
          />
          <p>{this.props.trans.__('Create branch based on...')}</p>
          <div className={filterWrapperClass}>
            <div className={filterClass}>
              <input
                className={filterInputClass}
                type="text"
                onChange={this._onFilterChange}
                value={this.state.filter}
                placeholder={this.props.trans.__('Filter')}
                title={this.props.trans.__('Filter branch menu')}
              />
              {this.state.filter ? (
                <button className={filterClearClass}>
                  <ClearIcon
                    titleAccess={this.props.trans.__(
                      'Clear the current filter'
                    )}
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
            title={this.props.trans.__(
              'Close this dialog without creating a new branch'
            )}
            value={this.props.trans.__('Cancel')}
            onClick={this._onClose}
          />
          <input
            className={classes(buttonClass, createButtonClass)}
            type="button"
            title={this.props.trans.__('Create a new branch')}
            value={this.props.trans.__('Create Branch')}
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
    const current = this.props.currentBranch;
    // Perform a "simple" filter... (TODO: consider implementing fuzzy filtering)
    const filter = this.state.filter;
    const branches = this.props.branches
      .filter(branch => !filter || branch.name.includes(filter))
      .slice()
      .sort(comparator);
    return (
      <VariableSizeList
        className={listWrapperClass}
        height={HEIGHT}
        estimatedItemSize={ITEM_HEIGHT}
        itemCount={branches.length}
        itemData={branches}
        itemKey={(index, data) => data[index].name}
        itemSize={index => {
          const branch = branches[index];
          return branch.name === this.props.currentBranch
            ? CURRENT_BRANCH_HEIGHT
            : ITEM_HEIGHT;
        }}
        ref={this._branchList}
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
      if (a.name === 'main') {
        return -1;
      } else if (b.name === 'main') {
        return 1;
      }
      return 0;
    }
  }

  /**
   * Renders a branch menu item.
   *
   * @param props Row properties
   * @returns React element
   */
  private _renderItem = (props: ListChildComponentProps): JSX.Element => {
    const { data, index, style } = props;
    const branch = data[index] as Git.IBranch;

    const isCurrent = branch.name === this.props.currentBranch;

    let isBold;
    let desc;
    if (isCurrent) {
      isBold = true;
      desc = BRANCH_DESC['current'];
    }
    return (
      <ListItem
        button
        title={this.props.trans.__(
          'Create a new branch based on: %1',
          branch.name
        )}
        className={classes(
          listItemClass,
          isCurrent ? activeListItemClass : null
        )}
        onClick={this._onBranchClickFactory(branch.name)}
        style={style}
      >
        <branchIcon.react className={listItemIconClass} tag="span" />
        <div className={listItemContentClass}>
          <p
            className={classes(
              listItemTitleClass,
              isBold ? listItemBoldTitleClass : null
            )}
          >
            {branch.name}
          </p>
          {desc ? (
            <p className={listItemDescClass}>{this.props.trans.__(desc)}</p>
          ) : null}
        </div>
      </ListItem>
    );
  };

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
    this._branchList.current.resetAfterIndex(0);
    this.setState({
      filter: event.target.value
    });
  };

  /**
   * Callback invoked to reset the menu filter.
   */
  private _resetFilter = (): void => {
    this._branchList.current.resetAfterIndex(0);
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
    const opts = {
      newBranch: true,
      branchname: branch
    };

    this.props.logger.log({
      level: Level.RUNNING,
      message: this.props.trans.__('Creating branch...')
    });
    try {
      await this.props.model.checkout(opts);
    } catch (err) {
      this.setState({
        error: err.message.replace(/^fatal:/, '')
      });
      this.props.logger.log({
        level: Level.ERROR,
        message: this.props.trans.__('Failed to create branch.')
      });
      return;
    }

    this.props.logger.log({
      level: Level.SUCCESS,
      message: this.props.trans.__('Branch created.')
    });
    // Close the branch dialog:
    this.props.onClose();

    // Reset the branch name and filter:
    this._branchList.current.resetAfterIndex(0);
    this.setState({
      name: '',
      filter: ''
    });
  }

  private _branchList: React.RefObject<VariableSizeList>;
}
