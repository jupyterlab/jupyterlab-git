import { TranslationBundle } from '@jupyterlab/translation';
import ClearIcon from '@mui/icons-material/Clear';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import ListItem from '@mui/material/ListItem';
import React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { classes } from 'typestyle';
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
  listItemClass,
  listItemContentClass,
  listItemIconClass,
  listItemTitleClass,
  listWrapperClass,
  nameInputClass,
  titleClass,
  titleWrapperClass
} from '../style/NewBranchDialog';
import { disabledListItemClass } from '../style/WorktreeMenuStyle';
import { branchIcon, worktreeIcon } from '../style/icons';
import { Git } from '../tokens';

const ITEM_HEIGHT = 27.5; // HTML element height for a single branch
const HEIGHT = 200; // HTML element height for the branches list

/**
 * The default folder, relative to the repository root, in which new
 * worktrees are created.
 *
 * A visible folder is used on purpose: the Jupyter contents API does not
 * serve hidden folders by default, which would prevent opening the
 * worktrees in the file browser.
 */
export const DEFAULT_WORKTREE_FOLDER = 'worktrees';

/**
 * NewWorktreeDialog component properties
 */
export interface INewWorktreeDialogProps {
  /**
   * Current branch name.
   */
  currentBranch: string;

  /**
   * Current list of local branches.
   */
  branches: Git.IBranch[];

  /**
   * Callback to invoke upon closing the dialog.
   *
   * Called without options if the dialog is cancelled.
   */
  onClose(options?: Git.IAddWorktreeOptions): void;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

/**
 * Returns the default worktree path for a branch.
 *
 * @param branch - branch name
 * @returns worktree path relative to the repository root
 */
function defaultWorktreePath(branch: string): string {
  return branch ? `${DEFAULT_WORKTREE_FOLDER}/${branch}` : '';
}

/**
 * NewWorktreeDialog React component
 *
 * A dialog to create a new worktree, either for an existing branch which is
 * not checked out in any worktree, or for a new branch started from the
 * selected branch.
 *
 * @param props Component properties
 * @returns React element
 */
export function NewWorktreeDialog(props: INewWorktreeDialogProps): JSX.Element {
  const [filter, setFilter] = React.useState<string>('');
  const [selectedBranch, setSelectedBranch] = React.useState<string>(
    props.currentBranch
  );
  const [newBranchName, setNewBranchName] = React.useState<string>('');
  const [worktreePath, setWorktreePath] = React.useState<string>('');
  const [pathEdited, setPathEdited] = React.useState<boolean>(false);

  const { trans } = props;

  // A non-empty new branch name switches the dialog to "new branch" mode,
  // in which the selected branch is used as the start point.
  const newBranchMode = newBranchName.trim() !== '';

  const branches = props.branches.filter(
    branch => !filter || branch.name.includes(filter)
  );

  const selectedBranchData = props.branches.find(
    branch => branch.name === selectedBranch
  );
  const selectionValid =
    !!selectedBranchData && (newBranchMode || !selectedBranchData.worktree);

  const canCreate =
    worktreePath.trim() !== '' &&
    (newBranchMode ? newBranchName.trim() !== '' : selectionValid);

  function renderItem(rowProps: ListChildComponentProps): JSX.Element {
    const { data, index, style } = rowProps;
    const branch = data[index] as Git.IBranch;
    const isSelected = branch.name === selectedBranch;
    // Branches already checked out in a worktree cannot be checked out
    // again, but they can be used as the start point of a new branch.
    const unavailable = !newBranchMode && !!branch.worktree;

    return (
      <ListItem
        button
        title={
          unavailable
            ? trans.__(
                "The branch '%1' is already checked out in the worktree '%2'",
                branch.name,
                branch.worktree ?? ''
              )
            : newBranchMode
            ? trans.__('Start the new branch from %1', branch.name)
            : trans.__('Create a worktree for branch %1', branch.name)
        }
        className={classes(
          listItemClass,
          isSelected ? activeListItemClass : null,
          unavailable ? disabledListItemClass : null
        )}
        onClick={() => {
          if (unavailable) {
            return;
          }
          setSelectedBranch(branch.name);
          if (!newBranchMode && !pathEdited) {
            setWorktreePath(defaultWorktreePath(branch.name));
          }
        }}
        style={style}
      >
        <branchIcon.react className={listItemIconClass} tag="span" />
        <div className={listItemContentClass}>
          <p className={listItemTitleClass}>{branch.name}</p>
        </div>
        {branch.worktree ? (
          <worktreeIcon.react className={listItemIconClass} tag="span" />
        ) : null}
      </ListItem>
    );
  }

  return (
    <Dialog
      classes={{
        paper: branchDialogClass
      }}
      open={true}
      onClose={() => {
        props.onClose();
      }}
    >
      <div className={titleWrapperClass}>
        <p className={titleClass}>{trans.__('Add Worktree')}</p>
        <button className={closeButtonClass}>
          <ClearIcon
            titleAccess={trans.__('Close this dialog')}
            fontSize="small"
            onClick={() => {
              props.onClose();
            }}
          />
        </button>
      </div>
      <div className={contentWrapperClass}>
        <p>
          {newBranchMode
            ? trans.__('Start the new branch from…')
            : trans.__('Branch to check out in the new worktree')}
        </p>
        <div className={filterWrapperClass}>
          <div className={filterClass}>
            <input
              className={filterInputClass}
              type="text"
              onChange={event => {
                setFilter(event.target.value);
              }}
              value={filter}
              placeholder={trans.__('Filter')}
              title={trans.__('Filter branch list')}
            />
            {filter ? (
              <button className={filterClearClass}>
                <ClearIcon
                  titleAccess={trans.__('Clear the current filter')}
                  fontSize="small"
                  onClick={() => {
                    setFilter('');
                  }}
                />
              </button>
            ) : null}
          </div>
        </div>
        <FixedSizeList
          className={listWrapperClass}
          height={HEIGHT}
          itemSize={ITEM_HEIGHT}
          itemCount={branches.length}
          itemData={branches}
          itemKey={(index, data) => data[index].name}
          style={{ overflowX: 'hidden' }}
          width={'auto'}
        >
          {renderItem}
        </FixedSizeList>
        <p>{trans.__('Or create a new branch named…')}</p>
        <input
          className={nameInputClass}
          type="text"
          onChange={event => {
            const name = event.target.value;
            setNewBranchName(name);
            if (!pathEdited) {
              setWorktreePath(
                defaultWorktreePath(name.trim() || selectedBranch)
              );
            }
          }}
          value={newBranchName}
          placeholder={trans.__('Leave empty to use an existing branch')}
          title={trans.__('Enter a new branch name')}
        />
        <p>{trans.__('Worktree path (relative to the repository)')}</p>
        <input
          className={nameInputClass}
          type="text"
          onChange={event => {
            setWorktreePath(event.target.value);
            setPathEdited(true);
          }}
          value={worktreePath}
          placeholder={defaultWorktreePath(trans.__('branch'))}
          title={trans.__('Enter the new worktree path')}
        />
      </div>
      <DialogActions className={actionsWrapperClass}>
        <input
          className={classes(buttonClass, cancelButtonClass)}
          type="button"
          title={trans.__('Close this dialog without adding a worktree')}
          value={trans.__('Cancel')}
          onClick={() => {
            props.onClose();
          }}
        />
        <input
          className={classes(buttonClass, createButtonClass)}
          type="button"
          title={trans.__('Add a new worktree')}
          value={trans.__('Add Worktree')}
          onClick={() => {
            props.onClose({
              worktreePath: worktreePath.trim(),
              branch: newBranchMode ? newBranchName.trim() : selectedBranch,
              newBranch: newBranchMode,
              startPoint: newBranchMode ? selectedBranch : undefined
            });
          }}
          disabled={!canCreate}
        />
      </DialogActions>
    </Dialog>
  );
}
