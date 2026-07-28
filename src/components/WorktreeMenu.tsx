import { Dialog, Notification, showDialog } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import ListItem from '@mui/material/ListItem';
import * as React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { classes } from 'typestyle';
import { showError } from '../notifications';
import { hiddenButtonStyle } from '../style/ActionButtonStyle';
import {
  activeListItemClass,
  listItemClass,
  listItemIconClass,
  nameClass,
  wrapperClass
} from '../style/BranchMenu';
import {
  activeWorktreeDetailClass,
  disabledListItemClass,
  newWorktreeButtonClass,
  worktreeButtonWrapperClass,
  worktreePathClass,
  worktreeStateClass
} from '../style/WorktreeMenuStyle';
import { trashIcon, worktreeIcon } from '../style/icons';
import { CommandIDs, Git, IGitExtension } from '../tokens';
import { ActionButton } from './ActionButton';

const ITEM_HEIGHT = 24.8; // HTML element height for a single worktree
const MAX_HEIGHT = 400; // Maximal HTML element height for the worktrees list

/**
 * Interface describing component properties.
 */
export interface IWorktreeMenuProps {
  /**
   * Jupyter App commands registry
   */
  commands: CommandRegistry;

  /**
   * Git extension data model.
   */
  model: IGitExtension;

  /**
   * The list of worktrees of the repo.
   */
  worktrees: Git.IWorktree[];

  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

/**
 * React component for rendering a worktree menu.
 */
export class WorktreeMenu extends React.Component<IWorktreeMenuProps> {
  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <div className={wrapperClass}>
        {this._renderNewWorktreeButton()}
        {this._renderWorktreeList()}
      </div>
    );
  }

  /**
   * Renders a button to create a new worktree.
   *
   * @returns React element
   */
  private _renderNewWorktreeButton(): React.ReactElement {
    return (
      <div className={worktreeButtonWrapperClass}>
        <input
          className={newWorktreeButtonClass}
          type="button"
          title={this.props.trans.__('Create a new worktree')}
          value={this.props.trans.__('New Worktree')}
          onClick={this._onNewWorktreeClick}
        />
      </div>
    );
  }

  /**
   * Renders the list of worktrees.
   *
   * @returns React element
   */
  private _renderWorktreeList(): React.ReactElement {
    // A bare repository entry is not a working tree that can be opened
    const worktrees = this.props.worktrees.filter(worktree => !worktree.bare);

    return (
      <FixedSizeList
        height={Math.min(
          Math.max(1, worktrees.length) * ITEM_HEIGHT,
          MAX_HEIGHT
        )}
        itemCount={worktrees.length}
        itemData={worktrees}
        itemKey={(index, data) => data[index].path}
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
    const worktree = data[index] as Git.IWorktree;
    const trans = this.props.trans;

    const isOutsideRoot = worktree.path.startsWith('..');
    const openable =
      !worktree.is_current && !worktree.prunable && !isOutsideRoot;
    const label =
      worktree.branch ?? (worktree.head ? worktree.head.slice(0, 7) : '');

    let stateHint = '';
    if (worktree.prunable) {
      stateHint = trans.__('(stale)');
    } else if (worktree.locked) {
      stateHint = trans.__('(locked)');
    } else if (worktree.detached) {
      stateHint = trans.__('(detached)');
    }

    let title: string;
    if (worktree.is_current) {
      title = trans.__('Current worktree: %1', worktree.path);
    } else if (worktree.prunable) {
      title = trans.__(
        'The folder of this worktree is missing; it can be removed'
      );
    } else if (isOutsideRoot) {
      title = trans.__(
        'This worktree is outside of the Jupyter server root and cannot be opened'
      );
    } else {
      title = trans.__('Open worktree: %1', worktree.path);
    }

    return (
      <ListItem
        button
        title={title}
        className={classes(
          listItemClass,
          worktree.is_current ? activeListItemClass : null,
          !openable && !worktree.is_current ? disabledListItemClass : null
        )}
        onClick={this._onWorktreeClickFactory(worktree)}
        role="listitem"
        style={style}
      >
        <worktreeIcon.react className={listItemIconClass} tag="span" />
        <span className={nameClass}>{label}</span>
        {stateHint && (
          <span
            className={classes(
              worktreeStateClass,
              worktree.is_current ? activeWorktreeDetailClass : null
            )}
          >
            {stateHint}
          </span>
        )}
        <span
          className={classes(
            worktreePathClass,
            worktree.is_current ? activeWorktreeDetailClass : null
          )}
        >
          {worktree.path}
        </span>
        {!worktree.is_main && !worktree.is_current && (
          <ActionButton
            className={hiddenButtonStyle}
            icon={trashIcon}
            title={trans.__('Remove this worktree')}
            onClick={async (
              event?: React.MouseEvent<HTMLButtonElement, MouseEvent>
            ) => {
              event?.stopPropagation();
              await this._onRemoveWorktree(worktree);
            }}
          />
        )}
      </ListItem>
    );
  };

  /**
   * Callback invoked upon clicking a button to create a new worktree.
   */
  private _onNewWorktreeClick = (): void => {
    this.props.commands.execute(CommandIDs.gitAddWorktree);
  };

  /**
   * Returns a callback which is invoked upon clicking a worktree.
   *
   * @param worktree - worktree
   * @returns callback
   */
  private _onWorktreeClickFactory(worktree: Git.IWorktree) {
    return async (): Promise<void> => {
      const isOutsideRoot = worktree.path.startsWith('..');
      if (worktree.is_current || worktree.prunable || isOutsideRoot) {
        return;
      }
      await this.props.commands.execute(CommandIDs.gitOpenWorktree, {
        path: worktree.path
      });
    };
  }

  /**
   * Callback on remove worktree button
   *
   * @param worktree Worktree to remove
   */
  private _onRemoveWorktree = async (
    worktree: Git.IWorktree
  ): Promise<void> => {
    const trans = this.props.trans;
    const acknowledgement = await showDialog<void>({
      title: trans.__('Remove worktree'),
      body: (
        <p>
          {trans.__(
            'Are you sure you want to permanently remove the worktree '
          )}
          <b>{worktree.path}</b>?
          <br />
          {trans.__('This deletes its folder and cannot be undone.')}
        </p>
      ),
      buttons: [
        Dialog.cancelButton({ label: trans.__('Cancel') }),
        Dialog.warnButton({ label: trans.__('Remove') })
      ]
    });
    if (!acknowledgement.button.accept) {
      return;
    }

    try {
      await this.props.model.removeWorktree(worktree.path);
    } catch (error: any) {
      const message: string = error?.message ?? '';
      const isDirty = message.includes('modified or untracked files');
      const isLocked = message.includes('locked working tree');
      if (!isDirty && !isLocked) {
        Notification.error(
          trans.__('Failed to remove worktree.'),
          showError(error, trans)
        );
        return;
      }

      const confirmForce = await showDialog<void>({
        title: trans.__('Force remove worktree'),
        body: isLocked
          ? trans.__(
              'The worktree %1 is locked. Do you want to force its removal?',
              worktree.path
            )
          : trans.__(
              'The worktree %1 contains modified or untracked files that will be lost. Do you want to force its removal?',
              worktree.path
            ),
        buttons: [
          Dialog.cancelButton({ label: trans.__('Cancel') }),
          Dialog.warnButton({ label: trans.__('Force Remove') })
        ]
      });
      if (!confirmForce.button.accept) {
        return;
      }

      try {
        await this.props.model.removeWorktree(worktree.path, true);
      } catch (forceError: any) {
        Notification.error(
          trans.__('Failed to remove worktree.'),
          showError(forceError, trans)
        );
      }
    }
  };
}
