import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import ClearIcon from '@material-ui/icons/Clear';
import { TranslationBundle } from '@jupyterlab/translation';
import * as React from 'react';
import { classes } from 'typestyle';
import { Logger } from '../logger';
import {
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
import {
  actionsWrapperClass,
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
  nameInputClass,
  titleClass,
  titleWrapperClass
} from '../style/NewBranchDialog';
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
 * Interface describing component properties.
 */
export interface IDialogBoxCommitGraphProps {
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
   * The application language translator.
   */
  trans: TranslationBundle;

  /**
   * Filter state.
   */
  filter: string;

  /**
   * Base commit id state.
   */
  baseCommitId: string;

  /**
   * Update function for baseCommitId.
   */
  updateBaseCommitId: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Interface describing component properties.
 */
export interface ISingleCommitProps {
  /**
   * Commit data.
   */
  commit: Git.ISingleCommitInfo;

  /**
   * Identifier of commit the tag is pointing to.
   */
  baseCommitId: string;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;

  /**
   * Callback to store a reference of the rendered <li> element in DialogBoxCommitGraph
   */
  setRef: (el: HTMLLIElement) => void;

  /**
   * Update function for baseCommitId state.
   */
  updateBaseCommitId: React.Dispatch<React.SetStateAction<string>>;
}

export const DialogBoxCommitGraph: React.FunctionComponent<
  IDialogBoxCommitGraphProps
> = (props: IDialogBoxCommitGraphProps): React.ReactElement => {
  const { filter, baseCommitId, updateBaseCommitId } = props;
  const pastCommits = props.pastCommits
    .filter(
      commit =>
        !filter ||
        commit.commit_msg.toLowerCase().includes(filter.toLowerCase())
    )
    .slice();

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

    pastCommits.forEach(commit => {
      const node = nodes.current[commit.commit];
      resizeObserver.observe(node, {
        box: 'border-box'
      });
    });

    return () => resizeObserver.disconnect();
  }, [pastCommits]);

  let isFilter;
  if (filter === '') {
    isFilter = true;
  }

  return (
    <div className={historyDialogBoxWrapperStyle}>
      {isFilter && (
        <GitCommitGraph
          commits={pastCommits.map(commit => ({
            sha: commit.commit,
            parents: commit.pre_commits
          }))}
          getNodeHeight={(sha: string) => nodeHeights[sha] ?? 55}
        />
      )}
      <ol className={historyDialogBoxStyle}>
        {pastCommits.map((commit, index) => {
          return (
            <SingleCommitNode
              key={index}
              commit={commit}
              baseCommitId={baseCommitId}
              trans={props.trans}
              setRef={node => {
                nodes.current[commit.commit] = node;
              }}
              updateBaseCommitId={updateBaseCommitId}
            ></SingleCommitNode>
          );
        })}
      </ol>
    </div>
  );
};

export const SingleCommitNode: React.FunctionComponent<ISingleCommitProps> = (
  props: ISingleCommitProps
): React.ReactElement => {
  const { baseCommitId, updateBaseCommitId } = props;
  const isLatest = props.commit.commit === baseCommitId;

  let isBold;
  if (isLatest) {
    isBold = true;
  }
  /**
   * Returns a callback which is invoked upon clicking a commit name.
   *
   * @param commit - commit
   * @returns callback
   */
  const onCommitClickFactory = React.useCallback(
    (commitId: string) => {
      return onClick;

      /**
       * Callback invoked upon clicking a commit.
       *
       * @private
       * @param event - event object
       */
      function onClick(): void {
        updateBaseCommitId(commitId);
      }
    },
    [baseCommitId]
  );

  return (
    <li
      id={props.commit.commit}
      ref={props.setRef}
      className={classes(
        commitWrapperClass,
        isLatest ? activeListItemClass : null
      )}
      title={props.trans.__(
        'Create a new tag pointing to commit %1: %2 by %3',
        props.commit.commit in Git.Diff.SpecialRef
          ? Git.Diff.SpecialRef[+props.commit.commit]
          : props.commit.commit.slice(0, 7),
        props.commit.commit_msg,
        props.commit.author
      )}
      onClick={onCommitClickFactory(props.commit.commit)}
    >
      <div className={commitHeaderClass}>
        <span
          className={classes(
            commitHeaderItemClass,
            isBold ? commitItemBoldClass : null
          )}
        >
          {props.commit.author}
        </span>
        <span
          className={classes(
            commitHeaderItemClass,
            isBold ? commitItemBoldClass : null
          )}
        >
          {+props.commit.commit in Git.Diff.SpecialRef
            ? Git.Diff.SpecialRef[+props.commit.commit]
            : props.commit.commit.slice(0, 7)}
        </span>
        <span
          className={classes(
            commitHeaderItemClass,
            isBold ? commitItemBoldClass : null
          )}
        >
          {props.commit.date}
        </span>
      </div>
      <div
        className={classes(
          commitBodyClass,
          isBold ? commitHeaderBoldClass : null
        )}
      >
        {props.commit.commit_msg}
      </div>
    </li>
  );
};

export const NewTagDialogBox: React.FunctionComponent<INewTagDialogProps> = (
  props: INewTagDialogProps
): React.ReactElement => {
  const [nameState, setNameState] = React.useState('');
  const [baseCommitIdState, setBaseCommitIdState] = React.useState(
    props.pastCommits[0]?.commit ?? null
  );
  const [filterState, setFilterState] = React.useState('');
  const [errorState, setErrorState] = React.useState('');

  /**
   * Callback invoked upon closing the dialog.
   *
   * @param event - event object
   */
  const onClose = (): void => {
    props.onClose();
    setNameState('');
    setFilterState('');
    setErrorState('');
  };

  /**
   * Callback invoked upon a change to the menu filter.
   *
   * @param event - event object
   */
  const onFilterChange = React.useCallback(
    (event: any): void => {
      setFilterState(event.target.value);
    },
    [filterState]
  );

  /**
   * Callback invoked to reset the menu filter.
   */
  const resetFilter = (): void => {
    setFilterState('');
  };

  /**
   * Callback invoked upon a change to the tag name input element.
   *
   * @param event - event object
   */
  const onNameChange = React.useCallback(
    (event: any): void => {
      setNameState(event.target.value);
      setErrorState('');
    },
    [nameState]
  );

  /**
   * Creates a new tag.
   *
   * @param tag - tag name
   * @returns promise which resolves upon attempting to create a new tag
   */
  const createTag = async (): Promise<void> => {
    const tagName = nameState;
    const commitId = baseCommitIdState;

    props.logger.log({
      level: Level.RUNNING,
      message: props.trans.__('Creating tag…')
    });
    try {
      await props.model.setTag(tagName, commitId);
    } catch (err) {
      setErrorState(err.message.replace(/^fatal:/, ''));
      props.logger.log({
        level: Level.ERROR,
        message: props.trans.__('Failed to create tag.')
      });
      return;
    }

    props.logger.log({
      level: Level.SUCCESS,
      message: props.trans.__('Tag created.')
    });
    // Close the tag dialog:
    props.onClose();

    setNameState('');
    setFilterState('');
  };

  return (
    <Dialog
      classes={{
        paper: branchDialogClass
      }}
      open={props.open}
      onClose={onClose}
    >
      <div className={titleWrapperClass}>
        <p className={titleClass}>{props.trans.__('Create a Tag')}</p>
        <button className={closeButtonClass}>
          <ClearIcon
            titleAccess={props.trans.__('Close this dialog')}
            fontSize="small"
            onClick={onClose}
          />
        </button>
      </div>
      <div className={contentWrapperClass}>
        {errorState ? <p className={errorMessageClass}>{errorState}</p> : null}
        <p>{props.trans.__('Name')}</p>
        <input
          className={nameInputClass}
          type="text"
          onChange={onNameChange}
          value={nameState}
          placeholder=""
          title={props.trans.__('Enter a tag name')}
        />
        <p>{props.trans.__('Create tag pointing to…')}</p>
        <div className={filterWrapperClass}>
          <div className={filterClass}>
            <input
              className={filterInputClass}
              type="text"
              onChange={onFilterChange}
              value={filterState}
              placeholder={props.trans.__('Filter by commit message')}
              title={props.trans.__('Filter history of commits menu')}
            />
            {filterState ? (
              <button className={filterClearClass}>
                <ClearIcon
                  titleAccess={props.trans.__('Clear the current filter')}
                  fontSize="small"
                  onClick={resetFilter}
                />
              </button>
            ) : null}
          </div>
        </div>
        {
          <DialogBoxCommitGraph
            pastCommits={props.pastCommits}
            logger={props.logger}
            model={props.model}
            trans={props.trans}
            filter={filterState}
            baseCommitId={baseCommitIdState}
            updateBaseCommitId={setBaseCommitIdState}
          />
        }
      </div>
      <DialogActions className={actionsWrapperClass}>
        <input
          className={classes(buttonClass, cancelButtonClass)}
          type="button"
          title={props.trans.__('Close this dialog without creating a new tag')}
          value={props.trans.__('Cancel')}
          onClick={onClose}
        />
        <input
          className={classes(buttonClass, createButtonClass)}
          type="button"
          title={props.trans.__('Create a new tag')}
          value={props.trans.__('Create Tag')}
          onClick={() => {
            createTag();
          }}
          disabled={nameState === '' || errorState !== ''}
        />
      </DialogActions>
    </Dialog>
  );
};
