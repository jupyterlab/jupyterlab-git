import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import ClearIcon from '@material-ui/icons/Clear';
import { TranslationBundle } from '@jupyterlab/translation';
import * as React from 'react';
import { VariableSizeList } from 'react-window';
import { classes } from 'typestyle';
import { Logger } from '../logger';
import {
  actionsWrapperClass,
  tagDialogClass,
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
  nameInputClass,
  titleClass,
  titleWrapperClass,
  historyDialogBoxWrapperStyle,
  historyDialogBoxStyle,
  activeListItemClass,
  commitItemBoldClass,
  commitHeaderBoldClass,
  commitBodyClass,
  commitHeaderClass,
  commitHeaderItemClass,
  commitWrapperClass
} from '../style/NewTagDialog';
import { Git, IGitExtension, Level } from '../tokens';
import { GitCommitGraph } from './GitCommitGraph';

/**
 * Interface describing component properties.
 */
export interface INewTagDialogProps {
  /**
   * List of prior commits.
   */
  pastCommits: Git.ISingleCommitInfo[];

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
export interface INewTagDialogState {
  /**
   * Tag name.
   */
  name: string;

  /**
   * Identifier of commit the tag is pointing to.
   */
  baseCommitId: string;

  /**
   * Menu filter.
   */
  filter: string;

  /**
   * Error message.
   */
  error: string;
}

const DialogBoxCommitGraph: React.FunctionComponent<INewTagDialogProps> = (
  props: INewTagDialogProps
): React.ReactElement => {
  const [nodeHeights, setNodeHeights] = React.useState<{
    [sha: string]: number;
  }>({});
  const nodes = React.useRef<{ [sha: string]: HTMLLIElement }>({});

  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const borderBoxSize = Array.isArray(entry.borderBoxSize)
          ? entry.borderBoxSize[0]
          : entry.borderBoxSize;
        const offsetHeight = borderBoxSize.blockSize;
        const sha = entry.target.id;
        setNodeHeights(prev => ({ ...prev, [sha]: offsetHeight }));
      }
    });

    props.pastCommits.forEach(commit =>
      resizeObserver.observe(nodes.current[commit.commit], {
        box: 'border-box'
      })
    );
    return () => resizeObserver.disconnect();
  }, []);
  console.log('Commits: ', props.pastCommits);
  console.log('Nodes: ', nodes);

  return (
    <GitCommitGraph
      commits={props.pastCommits.map(commit => ({
        sha: commit.commit,
        parents: commit.pre_commits
      }))}
      getNodeHeight={(sha: string) => nodeHeights[sha] ?? 55}
    />
  );
};

/**
 * React component for rendering a dialog to create a new tag.
 */
export class NewTagDialog extends React.Component<
  INewTagDialogProps,
  INewTagDialogState
> {
  /**
   * Returns a React component for rendering a tag menu.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: INewTagDialogProps) {
    super(props);

    this._commitsList = React.createRef<VariableSizeList>();
    this.state = {
      name: '',
      baseCommitId: props.pastCommits[0].commit || null,
      filter: '',
      error: ''
    };
  }

  /**
   * Renders a dialog for creating a new tag.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <Dialog
        classes={{
          paper: tagDialogClass
        }}
        open={this.props.open}
        onClose={this._onClose}
      >
        <div className={titleWrapperClass}>
          <p className={titleClass}>{this.props.trans.__('Create a Tag')}</p>
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
            title={this.props.trans.__('Enter a tag name')}
          />
          <p>{this.props.trans.__('Create tag pointing to…')}</p>
          <div className={filterWrapperClass}>
            <div className={filterClass}>
              <input
                className={filterInputClass}
                type="text"
                onChange={this._onFilterChange}
                value={this.state.filter}
                placeholder={this.props.trans.__('Filter by commit message')}
                title={this.props.trans.__('Filter history of commits menu')}
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
              'Close this dialog without creating a new tag'
            )}
            value={this.props.trans.__('Cancel')}
            onClick={this._onClose}
          />
          <input
            className={classes(buttonClass, createButtonClass)}
            type="button"
            title={this.props.trans.__('Create a new tag')}
            value={this.props.trans.__('Create Tag')}
            onClick={() => {
              this._createTag();
            }}
            disabled={this.state.name === '' || this.state.error !== ''}
          />
        </DialogActions>
      </Dialog>
    );
  }

  private _renderDialogBoxCommitGraph(): React.ReactElement {
    return (
      <React.Fragment>
        <DialogBoxCommitGraph
          pastCommits={this.props.pastCommits}
          logger={this.props.logger}
          model={this.props.model}
          open={this.props.open}
          onClose={this.props.onClose}
          trans={this.props.trans}
        />
      </React.Fragment>
    );
  }

  /**
   * Renders commit menu items.
   *
   * @returns array of React elements
   */
  private _renderItems(): JSX.Element {
    const filter = this.state.filter;
    const pastCommits = this.props.pastCommits
      .filter(commit => !filter || commit.commit_msg.includes(filter))
      .slice();
    return (
      <div className={historyDialogBoxWrapperStyle}>
        {this._renderDialogBoxCommitGraph}
        <ol className={historyDialogBoxStyle}>
          {pastCommits.map((commit, index) => this._renderItem(commit, index))}
        </ol>
      </div>
    );
  }

  /**
   * Renders a tag menu item.
   *
   * @param props Row properties
   * @returns React element
   */
  private _renderItem = (
    commit: Git.ISingleCommitInfo,
    index: number
  ): JSX.Element => {
    const isLatest = commit === this.props.pastCommits[0];

    let isBold;
    if (isLatest) {
      isBold = true;
    }
    return (
      <li
        id={commit.commit}
        className={classes(
          commitWrapperClass,
          isLatest ? activeListItemClass : null
        )}
        title={this.props.trans.__(
          'Create a new tag pointing to commit %1: %2 by %3',
          commit.commit in Git.Diff.SpecialRef
            ? Git.Diff.SpecialRef[+commit.commit]
            : commit.commit.slice(0, 7),
          commit.commit_msg,
          commit.author
        )}
        onClick={this._onTagClickFactory(commit.commit)}
      >
        <div className={commitHeaderClass}>
          <span
            className={classes(
              commitHeaderItemClass,
              isBold ? commitItemBoldClass : null
            )}
          >
            {commit.author}
          </span>
          <span
            className={classes(
              commitHeaderItemClass,
              isBold ? commitItemBoldClass : null
            )}
          >
            {+commit.commit in Git.Diff.SpecialRef
              ? Git.Diff.SpecialRef[+commit.commit]
              : commit.commit.slice(0, 7)}
          </span>
          <span
            className={classes(
              commitHeaderItemClass,
              isBold ? commitItemBoldClass : null
            )}
          >
            {commit.date}
          </span>
        </div>
        <div
          className={classes(
            commitBodyClass,
            isBold ? commitHeaderBoldClass : null
          )}
        >
          {commit.commit_msg}
        </div>
      </li>
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
    this._commitsList.current.resetAfterIndex(0);
    this.setState({
      filter: event.target.value
    });
  };

  /**
   * Callback invoked to reset the menu filter.
   */
  private _resetFilter = (): void => {
    this._commitsList.current.resetAfterIndex(0);
    this.setState({
      filter: ''
    });
  };

  /**
   * Returns a callback which is invoked upon clicking a commit name.
   *
   * @param commit - commit
   * @returns callback
   */
  private _onTagClickFactory(commitId: string) {
    const self = this;
    return onClick;

    /**
     * Callback invoked upon clicking a commit.
     *
     * @private
     * @param event - event object
     */
    function onClick(): void {
      self.setState({
        baseCommitId: commitId
      });
    }
  }

  /**
   * Callback invoked upon a change to the tag name input element.
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
   * Creates a new tag.
   *
   * @param tag - tag name
   * @returns promise which resolves upon attempting to create a new tag
   */
  private async _createTag(): Promise<void> {
    const tagName = this.state.name;
    const commitId = this.state.baseCommitId;

    this.props.logger.log({
      level: Level.RUNNING,
      message: this.props.trans.__('Creating tag…')
    });
    try {
      await this.props.model.newTag(tagName, commitId);
    } catch (err) {
      this.setState({
        error: err.message.replace(/^fatal:/, '')
      });
      this.props.logger.log({
        level: Level.ERROR,
        message: this.props.trans.__('Failed to create tag.')
      });
      return;
    }

    this.props.logger.log({
      level: Level.SUCCESS,
      message: this.props.trans.__('Tag created.')
    });
    // Close the tag dialog:
    this.props.onClose();

    // Reset the tag name and filter:
    this._commitsList.current.resetAfterIndex(0);
    this.setState({
      name: '',
      filter: ''
    });
  }

  private _commitsList: React.RefObject<VariableSizeList>;
}
