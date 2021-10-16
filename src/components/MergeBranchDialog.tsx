import { TranslationBundle } from '@jupyterlab/translation';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import ListItem from '@material-ui/core/ListItem';
import ClearIcon from '@material-ui/icons/Clear';
import React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { classes } from 'typestyle';
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
  filterClass,
  filterClearClass,
  filterInputClass,
  filterWrapperClass,
  listItemClass,
  listItemContentClass,
  listItemIconClass,
  listItemTitleClass,
  listWrapperClass,
  titleClass,
  titleWrapperClass
} from '../style/NewBranchDialog';
import { Git } from '../tokens';

const ITEM_HEIGHT = 27.5; // HTML element height for a single branch
const HEIGHT = 200; // HTML element height for the branches list

/**
 * MergeBranchDialog component properties
 */
export interface IMergeBranchDialogProps {
  /**
   * Current branch name.
   */
  currentBranch: string;

  /**
   * Current list of local branches and without the current branch.
   */
  branches: Git.IBranch[];

  /**
   * Callback to invoke upon closing the dialog.
   */
  onClose(branch?: string): void;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

/**
 * MergeBranchDialog React component
 *
 * @param props Component properties
 * @returns React element
 */
export function MergeBranchDialog(props: IMergeBranchDialogProps): JSX.Element {
  const [filter, setFilter] = React.useState<string>('');
  const [selectedBranch, setSelectedBranch] = React.useState<string | null>(
    null
  );

  const branches = props.branches.filter(
    branch => !filter || branch.name.includes(filter)
  );

  const { trans } = props;

  function renderItem(props: ListChildComponentProps): JSX.Element {
    const { data, index, style } = props;
    const branch = data[index] as Git.IBranch;
    const isSelected = branch.name === selectedBranch;

    return (
      <ListItem
        button
        title={trans.__('Create a new branch based on: %1', branch.name)}
        className={classes(
          listItemClass,
          isSelected ? activeListItemClass : null
        )}
        onClick={() => {
          setSelectedBranch(branch.name);
        }}
        style={style}
      >
        <branchIcon.react className={listItemIconClass} tag="span" />
        <div className={listItemContentClass}>
          <p className={listItemTitleClass}>{branch.name}</p>
        </div>
      </ListItem>
    );
  }

  return (
    <Dialog
      classes={{
        paper: branchDialogClass
      }}
      open={true}
      onClose={props.onClose}
    >
      <div className={titleWrapperClass}>
        <p className={titleClass}>{trans.__('Merge Branch')}</p>
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
          {trans.__('Select the branch to merge in %1', props.currentBranch)}
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
      </div>
      <DialogActions className={actionsWrapperClass}>
        <input
          className={classes(buttonClass, cancelButtonClass)}
          type="button"
          title={trans.__('Close this dialog without merging a branch')}
          value={trans.__('Cancel')}
          onClick={() => {
            props.onClose();
          }}
        />
        <input
          className={classes(buttonClass, createButtonClass)}
          type="button"
          title={trans.__('Merge branch')}
          value={trans.__('Merge')}
          onClick={() => {
            props.onClose(selectedBranch);
          }}
          disabled={selectedBranch === null}
        />
      </DialogActions>
    </Dialog>
  );
}
