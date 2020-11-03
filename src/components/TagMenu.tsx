import { Dialog, showDialog, showErrorMessage } from '@jupyterlab/apputils';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ClearIcon from '@material-ui/icons/Clear';
import * as React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { Logger } from '../logger';
import {
  nameClass,
  filterClass,
  filterClearClass,
  filterInputClass,
  filterWrapperClass,
  listItemClass,
  listItemIconClass,
  wrapperClass
} from '../style/BranchMenu';
import { tagIcon } from '../style/icons';
import { IGitExtension, Level } from '../tokens';

const CHANGES_ERR_MSG =
  'The repository contains files with uncommitted changes. Please commit or discard these changes before switching to a tag.';
const ITEM_HEIGHT = 24.8; // HTML element height for a single branch
const MIN_HEIGHT = 150; // Minimal HTML element height for the tags list
const MAX_HEIGHT = 400; // Maximal HTML element height for the tags list

/**
 * Callback invoked upon encountering an error when switching tags.
 *
 * @private
 * @param error - error
 * @param logger - the logger
 */
function onTagError(error: any, logger: Logger): void {
  if (error.message.includes('following files would be overwritten')) {
    // Empty log message to hide the executing alert
    logger.log({
      message: '',
      level: Level.INFO
    });
    showDialog({
      title: 'Unable to checkout tag',
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
            Please commit, stash, or discard your changes before you checkout
            tags.
          </span>
        </React.Fragment>
      ),
      buttons: [Dialog.okButton({ label: 'Dismiss' })]
    });
  } else {
    logger.log({
      level: Level.ERROR,
      message: 'Failed to checkout tag.',
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
export interface ITagMenuProps {
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
export interface ITagMenuState {
  /**
   * Menu filter.
   */
  filter: string;

  /**
   * Current list of tags.
   */
  tags: string[];
}

/**
 * React component for rendering a branch menu.
 */
export class TagMenu extends React.Component<ITagMenuProps, ITagMenuState> {
  /**
   * Returns a React component for rendering a branch menu.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: ITagMenuProps) {
    super(props);

    this.state = {
      filter: '',
      tags: []
    };
  }

  componentDidMount() {
    this.props.model
      .tags()
      .then(response => {
        this.setState({
          tags: response.tags
        });
      })
      .catch(error => {
        console.error(error);
        this.setState({
          tags: []
        });
        showErrorMessage('Fail to get the tags.', error);
      });
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
      </div>
    );
  }

  /**
   * Renders a
   *
   * @returns React element
   */
  private _renderTagList(): React.ReactElement {
    // Perform a "simple" filter... (TODO: consider implementing fuzzy filtering)
    const filter = this.state.filter;
    const tags = this.state.tags.filter(tag => !filter || tag.includes(filter));
    return (
      <FixedSizeList
        height={Math.min(
          Math.max(MIN_HEIGHT, tags.length * ITEM_HEIGHT),
          MAX_HEIGHT
        )}
        itemCount={tags.length}
        itemData={tags}
        itemKey={(index, data) => data[index]}
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
    const tag = data[index] as string;

    return (
      <ListItem
        button
        title={`Checkout to tag: ${tag}`}
        className={listItemClass}
        onClick={this._onTagClickFactory(tag)}
        style={style}
      >
        <tagIcon.react className={listItemIconClass} tag="span" />
        <span className={nameClass}>{tag}</span>
      </ListItem>
    );
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
   * Returns a callback which is invoked upon clicking a tag.
   *
   * @param branch - tag
   * @returns callback
   */
  private _onTagClickFactory(tag: string) {
    const self = this;
    return onClick;

    /**
     * Callback invoked upon clicking a tag.
     *
     * @private
     * @param event - event object
     * @returns promise which resolves upon attempting to switch tags
     */
    async function onClick(): Promise<void> {
      if (!self.props.branching) {
        showErrorMessage('Checkout tags is disabled', CHANGES_ERR_MSG);
        return;
      }

      self.props.logger.log({
        level: Level.RUNNING,
        message: 'Checking tag out...'
      });

      try {
        await self.props.model.checkoutTag(tag);
      } catch (err) {
        return onTagError(err, self.props.logger);
      }

      self.props.logger.log({
        level: Level.SUCCESS,
        message: 'Tag checkout.'
      });
    }
  }
}
