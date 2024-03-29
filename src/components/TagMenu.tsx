import {
  Dialog,
  Notification,
  showDialog,
  showErrorMessage
} from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import ClearIcon from '@mui/icons-material/Clear';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import * as React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { showError } from '../notifications';
import {
  filterClass,
  filterClearClass,
  filterInputClass,
  filterWrapperClass,
  listItemClass,
  listItemIconClass,
  nameClass,
  newBranchButtonClass,
  wrapperClass
} from '../style/BranchMenu';
import { tagIcon } from '../style/icons';
import { Git, IGitExtension } from '../tokens';
import { NewTagDialogBox } from './NewTagDialog';

const ITEM_HEIGHT = 24.8; // HTML element height for a single tag
const MIN_HEIGHT = 150; // Minimal HTML element height for the tags list
const MAX_HEIGHT = 400; // Maximal HTML element height for the tags list

/**
 * Callback invoked upon encountering an error when switching tags.
 *
 * @private
 * @param error - error
 * @param id - notificatin id
 * @param trans - Translation object
 */
function onTagError(error: any, id: string, trans: TranslationBundle): void {
  if (error.message.includes('following files would be overwritten')) {
    // Empty log message to hide the executing alert
    Notification.dismiss(id);
    showDialog({
      title: trans.__('Unable to checkout tag'),
      body: (
        <React.Fragment>
          <p>
            {trans.__(
              'Your changes to the following files would be overwritten by switching:'
            )}
          </p>
          <List>
            {error.message.split('\n').slice(1, -3).map(renderFileName)}
          </List>
          <span>
            {trans.__(
              'Please commit, stash, or discard your changes before you checkout tags.'
            )}
          </span>
        </React.Fragment>
      ),
      buttons: [Dialog.okButton({ label: trans.__('Dismiss') })]
    });
  } else {
    Notification.update({
      id,
      message: trans.__('Failed to checkout tag.'),
      type: 'error',
      ...showError(error, trans)
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
export interface ITagMenuProps {
  /**
   * Current list of tags.
   */
  tagsList: Git.ITag[];

  /**
   * Boolean indicating whether branching is disabled.
   */
  branching: boolean;

  /**
   * List of prior commits.
   */
  pastCommits: Git.ISingleCommitInfo[];

  /**
   * Git extension data model.
   */
  model: IGitExtension;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

/**
 * Interface describing component state.
 */
export interface ITagMenuState {
  /**
   * Boolean indicating whether to show a dialog to create a new tag.
   */
  tagDialog: boolean;

  /**
   * Menu filter.
   */
  filter: string;
}

/**
 * React component for rendering a tag menu.
 */
export class TagMenu extends React.Component<ITagMenuProps, ITagMenuState> {
  /**
   * Returns a React component for rendering a tag menu.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: ITagMenuProps) {
    super(props);

    this.state = {
      filter: '',
      tagDialog: false
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
        {this._renderTagList()}
        {this._renderNewTagDialog()}
      </div>
    );
  }

  /**
   * Renders a tag input filter.
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
            placeholder={this.props.trans.__('Filter')}
            title={this.props.trans.__('Filter tag menu')}
          />
          {this.state.filter ? (
            <button className={filterClearClass}>
              <ClearIcon
                titleAccess={this.props.trans.__('Clear the current filter')}
                fontSize="small"
                onClick={this._resetFilter}
              />
            </button>
          ) : null}
        </div>
        <input
          className={newBranchButtonClass}
          type="button"
          title={this.props.trans.__('Create a new tag')}
          value={this.props.trans.__('New Tag')}
          onClick={this._onNewTagClick}
        />
      </div>
    );
  }

  /**
   * Renders list of tags.
   *
   * @returns React element
   */
  private _renderTagList(): React.ReactElement {
    // Perform a "simple" filter... (TODO: consider implementing fuzzy filtering)
    const filter = this.state.filter;
    const tags = this.props.tagsList.filter(
      tag => !filter || tag.name.includes(filter)
    );
    return (
      <FixedSizeList
        height={Math.min(
          Math.max(MIN_HEIGHT, tags.length * ITEM_HEIGHT),
          MAX_HEIGHT
        )}
        itemCount={tags.length}
        itemData={tags}
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
    const tag = data[index] as Git.ITag;

    return (
      <ListItem
        button
        title={this.props.trans.__('Checkout to tag: %1', tag.name)}
        className={listItemClass}
        onClick={this._onTagClickFactory(tag.name)}
        style={style}
      >
        <tagIcon.react className={listItemIconClass} tag="span" />
        <span className={nameClass}>{tag.name}</span>
      </ListItem>
    );
  };

  /**
   * Renders a dialog for creating a new tag.
   *
   * @returns React element
   */
  private _renderNewTagDialog(): React.ReactElement {
    const isSingleCommit = false;
    return (
      <NewTagDialogBox
        pastCommits={this.props.pastCommits}
        model={this.props.model}
        trans={this.props.trans}
        open={this.state.tagDialog}
        onClose={this._onNewTagDialogClose}
        isSingleCommit={isSingleCommit}
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
   * Callback invoked upon clicking a button to create a new tag.
   *
   * @param event - event object
   */
  private _onNewTagClick = (): void => {
    if (!this.props.branching) {
      showErrorMessage(
        this.props.trans.__('Creating a new tag is disabled'),
        this.props.trans.__('Error in creating new tag')
      );
      return;
    }
    this.setState({
      tagDialog: true
    });
  };

  /**
   * Callback invoked upon closing a dialog to create a new tag.
   */
  private _onNewTagDialogClose = (): void => {
    this.setState({
      tagDialog: false
    });
  };

  /**
   * Returns a callback which is invoked upon clicking a tag.
   *
   * @param tag - tag
   * @returns callback
   */
  private _onTagClickFactory(tag: string) {
    /**
     * Callback invoked upon clicking a tag.
     *
     * @private
     * @param event - event object
     * @returns promise which resolves upon attempting to switch tags
     */
    const onClick = async (): Promise<void> => {
      if (!this.props.branching) {
        showErrorMessage(
          this.props.trans.__('Checkout tags is disabled'),
          this.props.trans.__(
            'The repository contains files with uncommitted changes. Please commit or discard these changes before switching to a tag.'
          )
        );
        return;
      }

      const id = Notification.emit(
        this.props.trans.__('Checking tag out…'),
        'in-progress',
        { autoClose: false }
      );

      try {
        await this.props.model.checkoutTag(tag);
      } catch (err) {
        return onTagError(err, id, this.props.trans);
      }

      Notification.update({
        id,
        message: this.props.trans.__('Tag checkout.'),
        type: 'success',
        autoClose: 5000
      });
    };
    return onClick;
  }
}
