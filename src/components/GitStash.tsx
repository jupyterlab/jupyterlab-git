import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
import {
  changeStageButtonStyle,
  sectionAreaStyle,
  sectionFileContainerStyle,
  sectionHeaderLabelStyle
} from '../style/GitStageStyle';
import { Git } from '../tokens';
import { GitExtension } from '../model';
import { hiddenButtonStyle } from '../style/ActionButtonStyle';
import { ActionButton } from './ActionButton';
import { addIcon, discardIcon, removeIcon } from '../style/icons';
import { TranslationBundle } from '@jupyterlab/translation';
import { UseSignal } from '@jupyterlab/apputils';
import { FixedSizeList } from 'react-window';
import {
  fileIconStyle,
  fileLabelStyle,
  folderLabelStyle
} from '../style/FilePathStyle';
import { fileIcon } from '@jupyterlab/ui-components';

const HEADER_HEIGHT = 34;
const ITEM_HEIGHT = 25;

export interface IGitStashProps {
  /**
   * Actions component to display at the far right of the stage
   */
  actions?: React.ReactElement;

  /**
   * Is this group collapsible
   */
  collapsible?: boolean;

  /**
   * Git extension model
   */
  model: GitExtension;

  /**
   * Files in the group
   */
  stash: Git.IStash;
  /**
   * HTML element height
   */
  height: number;
  /**
   * Optional select all element
   */
  selectAllButton?: React.ReactElement;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;

  /**
   * Wrap mouse event handler to stop event propagation
   * @param fn Mouse event handler
   * @returns Mouse event handler that stops event from propagating
   */
  stopPropagationWrapper: (
    fn: React.EventHandler<React.MouseEvent>
  ) => React.EventHandler<React.MouseEvent>;
}

interface IGitStashEntryProps {
  /**
   * Actions component to display at the far right of the stage
   */
  actions?: React.ReactElement;

  /**
   * Git extension model
   */
  model: GitExtension;
  /**
   * Is this group collapsible
   */
  collapsible?: boolean;
  /**
   * Files corresponding to the stash
   */
  files: string[];
  /**
   * Index within the stash
   */
  index: number;
  /**
   * HTML element height
   */
  height: number;
  /**
   * Optional select all element
   */
  selectAllButton?: React.ReactElement;

  /**
   * Branch corresponding to the stash
   */
  branch: string;

  /**
   * message corresponding to the stash
   */
  message: string;

  /**
   * Wrap mouse event handler to stop event propagation
   * @param fn Mouse event handler
   * @returns Mouse event handler that stops event from propagating
   */
  stopPropagationWrapper: (
    fn: React.EventHandler<React.MouseEvent>
  ) => React.EventHandler<React.MouseEvent>;
}

/**
 * Dropdown for each entry in the stash
 */
const GitStashEntry: React.FunctionComponent<IGitStashEntryProps> = (
  props: IGitStashEntryProps
) => {
  const [showStashFiles, setShowStashFiles] = React.useState(false);

  const nFiles = props?.files?.length;

  const getFilePath = (file: string) => {
    // Root directory
    if (!file.includes('/')) {
      return {
        name: file,
        path: ''
      };
    } else {
      // One folder
      const fileSplit = file.split('/');
      if (fileSplit.length == 2) {
        return {
          path: fileSplit[0],
          name: fileSplit[1]
        };
        // More than one nested folder
      } else {
        return {
          name: fileSplit.pop(),
          path: fileSplit.join('/')
        };
      }
    }
  };

  return (
    <div className={sectionFileContainerStyle}>
      <div
        className={sectionAreaStyle}
        onClick={() => {
          if (props.collapsible && props?.files.length > 0) {
            setShowStashFiles(!showStashFiles);
          }
        }}
      >
        {props.collapsible && (
          <button className={changeStageButtonStyle}>
            {showStashFiles && props?.files.length > 0 ? (
              <caretDownIcon.react />
            ) : (
              <caretRightIcon.react />
            )}
          </button>
        )}
        <span
          className={sectionHeaderLabelStyle}
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <p>
            {props.message} (on {props.branch})
          </p>
          <span style={{ display: 'flex' }}>{props.actions}</span>
        </span>
      </div>
      {showStashFiles && (
        <FixedSizeList
          height={Math.max(
            Math.min(props.height - HEADER_HEIGHT, nFiles * ITEM_HEIGHT),
            ITEM_HEIGHT
          )}
          itemCount={nFiles}
          itemData={props?.files}
          itemKey={(index, data) => data[index]}
          itemSize={ITEM_HEIGHT}
          style={{ overflowX: 'hidden' }}
          width={'auto'}
        >
          {({ index, style }) => {
            const file = props.files[index];
            const { name, path } = getFilePath(file);

            return (
              <div style={{ display: 'flex', padding: '0 4px' }}>
                <fileIcon.react
                  className={fileIconStyle}
                  elementPosition="center"
                  tag="span"
                />
                <span className={fileLabelStyle}>
                  {name}
                  <span
                    // style={{
                    //   fontSize: 'var(--jp-ui-font-size0)',
                    //   margin: '0 4px',
                    //   color: 'var(--jp-ui-font-color2)'
                    // }}
                    className={folderLabelStyle}
                  >
                    {' '}
                    <span>{path}</span>
                  </span>
                  {/* <span className={folderLabelStyle}>{folder}</span> */}
                </span>
              </div>
            );
          }}
        </FixedSizeList>
      )}
    </div>
  );
};

export const GitStash: React.FunctionComponent<IGitStashProps> = (
  props: IGitStashProps
) => {
  const [showStash, setShowStash] = React.useState(false);

  const nStash = props && props.stash ? props.stash.length : 0;

  const gitStashPop = async (index: number): Promise<void> => {
    try {
      await props.model.stash_pop(index);
    } catch (err) {
      console.error(err);
    }
  };

  const gitStashDrop = async (index: number): Promise<void> => {
    try {
      await props.model.stash_drop(index);
    } catch (err) {
      console.error(err);
    }
  };

  const gitStashApply = async (index: number): Promise<void> => {
    try {
      await props.model.stash_apply(index);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={sectionFileContainerStyle}>
      <div
        className={sectionAreaStyle}
        onClick={() => {
          if (props.collapsible && nStash > 0) {
            setShowStash(!showStash);
          }
        }}
      >
        {props.selectAllButton && props.selectAllButton}
        {props.collapsible && (
          <button className={changeStageButtonStyle}>
            {showStash && nStash > 0 ? (
              <caretDownIcon.react />
            ) : (
              <caretRightIcon.react />
            )}
          </button>
        )}
        <span
          className={sectionHeaderLabelStyle}
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <p>Stash</p>
          <span style={{ display: 'flex' }}>
            {props.actions}
            <span>({nStash})</span>
          </span>
        </span>
      </div>

      <UseSignal signal={props.model.stashChanged}>
        {() => {
          if (!props.stash || !Array.isArray(props.stash)) {
            return null;
          }

          const nStash = props.stash.length;

          return (
            props.model.stashChanged &&
            showStash &&
            nStash > 0 && (
              <>
                {props.stash.map(entry => (
                  <GitStashEntry
                    key={entry.index} // Add key prop
                    files={entry.files}
                    model={props.model}
                    index={entry.index}
                    branch={entry.branch}
                    message={entry.message}
                    height={100}
                    collapsible={true}
                    stopPropagationWrapper={props.stopPropagationWrapper}
                    actions={
                      <React.Fragment>
                        <ActionButton
                          className={hiddenButtonStyle}
                          icon={addIcon}
                          title={'Pop stash entry'}
                          onClick={props.stopPropagationWrapper(() => {
                            console.log('Pop It!');
                            gitStashPop(entry.index);
                          })}
                        />
                        <ActionButton
                          className={hiddenButtonStyle}
                          icon={discardIcon}
                          title={'Drop stash entry'}
                          onClick={props.stopPropagationWrapper(() => {
                            gitStashDrop(entry.index);
                          })}
                        />
                        <ActionButton
                          className={hiddenButtonStyle}
                          icon={removeIcon}
                          title={'Apply stash entry'}
                          onClick={props.stopPropagationWrapper(() => {
                            gitStashApply(entry.index);
                          })}
                        />
                      </React.Fragment>
                    }
                  />
                ))}
              </>
            )
          );
        }}
      </UseSignal>
    </div>
  );
};
