import { caretDownIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
import {
  changeStageButtonStyle,
  sectionAreaStyle,
  sectionFileContainerStyle,
  sectionHeaderSizeStyle
} from '../style/GitStageStyle';
import { Git } from '../tokens';
import { GitExtension } from '../model';
import { hiddenButtonStyle } from '../style/ActionButtonStyle';
import { ActionButton } from './ActionButton';
import { addIcon, trashIcon, discardIcon } from '../style/icons';
import { TranslationBundle } from '@jupyterlab/translation';
import { UseSignal } from '@jupyterlab/apputils';
import { FixedSizeList } from 'react-window';
import {
  listStyle,
  sectionButtonContainerStyle,
  stashFileStyle,
  stashEntryMessageStyle,
  stashContainerStyle
} from '../style/GitStashStyle';
import { FilePath } from './FilePath';
import { stopPropagationWrapper } from '../utils';
import { classes } from 'typestyle';

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
  stash: Git.IStash[];

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
   * The application language translator.
   */
  trans: TranslationBundle;

  /**
   * Branch corresponding to the stash
   */
  branch: string;

  /**
   * message corresponding to the stash
   */
  message: string;
}

/**
 * Dropdown for each entry in the stash
 */
const GitStashEntry: React.FunctionComponent<IGitStashEntryProps> = (
  props: IGitStashEntryProps
) => {
  const [showStashFiles, setShowStashFiles] = React.useState(false);

  const nFiles = props.files.length;
  const canToggle = (props.collapsible ?? false) && nFiles > 0;
  const onToggle = () => {
    if (canToggle) {
      setShowStashFiles(!showStashFiles);
    }
  };
  const stashEntryLabel = props.trans.__(
    '%1 (on %2)',
    props.message,
    props.branch
  );

  return (
    <div className={sectionFileContainerStyle}>
      <div
        className={classes(
          'jp-AccordionPanel-title',
          showStashFiles && nFiles > 0 ? 'lm-mod-expanded' : null,
          sectionAreaStyle
        )}
        onClick={onToggle}
      >
        {props.collapsible && (
          <button
            type="button"
            className={classes(
              'lm-AccordionPanel-titleCollapser',
              changeStageButtonStyle
            )}
            aria-expanded={canToggle ? showStashFiles : undefined}
            aria-label={stashEntryLabel}
            disabled={!canToggle}
          >
            <caretDownIcon.react tag="span" />
          </button>
        )}
        <span className="lm-AccordionPanel-titleLabel">
          <span className={stashEntryMessageStyle}>{stashEntryLabel}</span>
        </span>
        {props.actions && (
          <div
            className={classes(
              'jp-AccordionPanel-toolbar',
              sectionButtonContainerStyle
            )}
          >
            {props.actions}
          </div>
        )}
      </div>
      {showStashFiles && (
        <FixedSizeList
          className={listStyle}
          height={Math.max(
            Math.min(props.height - HEADER_HEIGHT, nFiles * ITEM_HEIGHT),
            ITEM_HEIGHT
          )}
          itemCount={nFiles}
          innerElementType="ul"
          itemData={props?.files}
          itemKey={(index, data) => data[index]}
          itemSize={ITEM_HEIGHT}
          width={'auto'}
          style={{ margin: 0, paddingLeft: 0 }}
        >
          {({ index }) => {
            const file = props.files[index];
            return (
              <li className={stashFileStyle}>
                <FilePath filepath={file} />
              </li>
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
  const [stashIsLoading, setStashIsLoading] = React.useState(true);

  const nStash = props.stash?.length ?? 0;
  const canToggle = (props.collapsible ?? false) && nStash > 0;
  const onToggle = () => {
    if (canToggle) {
      setShowStash(!showStash);
    }
  };
  const stashLabel = props.trans.__('Stash');

  const gitStashPop = React.useCallback(
    async (index: number): Promise<void> => {
      try {
        await props.model.popStash(index);
      } catch (err) {
        console.error(err);
      }
    },
    [props.model]
  );

  const gitStashDrop = React.useCallback(
    async (index: number): Promise<void> => {
      try {
        await props.model.dropStash(index);
      } catch (err) {
        console.error(err);
      }
    },
    [props.model]
  );

  const gitStashApply = React.useCallback(
    async (index: number): Promise<void> => {
      try {
        await props.model.applyStash(index);
      } catch (err) {
        console.error(err);
      }
    },
    [props.model]
  );

  return (
    <div className={classes(sectionFileContainerStyle, stashContainerStyle)}>
      <div
        className={classes(
          'jp-AccordionPanel-title',
          showStash && nStash > 0 ? 'lm-mod-expanded' : null,
          sectionAreaStyle
        )}
        onClick={onToggle}
      >
        {props.selectAllButton && props.selectAllButton}
        {props.collapsible && (
          <button
            type="button"
            className={classes(
              'lm-AccordionPanel-titleCollapser',
              changeStageButtonStyle
            )}
            aria-expanded={canToggle ? showStash : undefined}
            aria-label={stashLabel}
            disabled={!canToggle}
          >
            <caretDownIcon.react tag="span" />
          </button>
        )}
        <span className="lm-AccordionPanel-titleLabel">{stashLabel}</span>
        <div
          className={classes(
            'jp-AccordionPanel-toolbar',
            sectionButtonContainerStyle
          )}
        >
          {props.actions}
          <span
            className={nStash > 0 ? sectionHeaderSizeStyle : undefined}
            data-test-id="num-stashes"
            data-loading={stashIsLoading ? 'true' : 'false'}
          >
            {nStash > 0 ? nStash : ''}
          </span>
        </div>
      </div>

      <UseSignal signal={props.model.stashChanged}>
        {() => {
          if (!props.stash || !Array.isArray(props.stash)) {
            return null;
          }

          const nStash = props.stash.length;
          setStashIsLoading(false);
          return (
            props.model.stashChanged &&
            showStash &&
            nStash > 0 && (
              <>
                {props.stash.map(entry => (
                  <GitStashEntry
                    key={entry.index}
                    files={entry.files}
                    model={props.model}
                    index={entry.index}
                    branch={entry.branch}
                    trans={props.trans}
                    message={entry.message}
                    height={100}
                    collapsible={true}
                    actions={
                      <React.Fragment>
                        <ActionButton
                          className={hiddenButtonStyle}
                          icon={discardIcon}
                          title={props.trans.__('Pop stash entry')}
                          onClick={stopPropagationWrapper(() => {
                            gitStashPop(entry.index);
                          })}
                        />
                        <ActionButton
                          className={hiddenButtonStyle}
                          icon={addIcon}
                          title={props.trans.__('Apply stash entry')}
                          onClick={stopPropagationWrapper(() => {
                            gitStashApply(entry.index);
                          })}
                        />
                        <ActionButton
                          className={hiddenButtonStyle}
                          icon={trashIcon}
                          title={props.trans.__('Drop stash entry')}
                          onClick={stopPropagationWrapper(() => {
                            gitStashDrop(entry.index);
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
