import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
// import { FixedSizeList, ListChildComponentProps } from 'react-window';
import {
  changeStageButtonStyle,
  sectionAreaStyle,
  sectionFileContainerStyle,
  sectionHeaderLabelStyle,
} from '../style/GitStageStyle';
import { Git } from '../tokens';
import { GitExtension } from '../model';
// import { hiddenButtonStyle } from '../style/ActionButtonStyle';
// import { fileListWrapperClass } from '../style/FileListStyle';
import { ActionButton } from './ActionButton';
import {
  addIcon,
  discardIcon,
  removeIcon
} from '../style/icons';
import { TranslationBundle } from '@jupyterlab/translation';
// import { CellDiffWidget } from 'nbdime/lib/diff/widget';
// const HEADER_HEIGHT = 34;
// const ITEM_HEIGHT = 25;
import { UseSignal } from '@jupyterlab/apputils';


export interface IGitStashProps {
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
  stopPropagationWrapper: (fn: React.EventHandler<React.MouseEvent>) => React.EventHandler<React.MouseEvent>;
}

interface IGitStashEntryProps {

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
  stopPropagationWrapper: (fn: React.EventHandler<React.MouseEvent>) => React.EventHandler<React.MouseEvent>;
}

/**
 * Dropdown for each entry in the stash
 */
const GitStashEntry: React.FunctionComponent<
  IGitStashEntryProps
> = (
  props: IGitStashEntryProps
) => {
  const [showStashFiles, setShowStashFiles] = React.useState(false);
  /** Git Stash Pop */
  const gitStashPop = async (index:number): Promise<void> => {
    console.log('Call Git Stash Pop', index);
    
    await props.model.stash_pop(index);
  }
  /** Git Stash Drop */
  const gitStashDrop = async (index:number): Promise<void> => {
    console.log('Call Git Stash Drop', index);
    
    const response = await props.model.stash_drop(index);
    console.log({response});
  }
  /** Git Stash Apply */
  const gitStashApply = async (index:number): Promise<void> => {
    console.log('Call Git Stash Apply', index);
    
    await props.model.stash_apply(index);
  }

  return (
    <div>

        <div
          className={sectionAreaStyle}
          onClick={() => {
            if (props.collapsible && props?.files.length > 0) {
              setShowStashFiles(!showStashFiles);
              console.log('toggle setShowStashFiles')
            }
          }}
        >
          <p>{props.message.split(' ')[1]} (on {props.branch})</p>
          <ActionButton
            icon={addIcon}
            title={'Pop'}
            onClick={props.stopPropagationWrapper(() => {
                console.log('Pop It ');
                gitStashPop(props.index)
            }
            )}
          />
          <ActionButton
            icon={discardIcon}
            title={'Drop'}
            onClick={props.stopPropagationWrapper(() => {
              console.log('Drop it');
              gitStashDrop(props.index)
          }
          )}
          />
          <ActionButton
            icon={removeIcon}
            title={'Apply'}
            onClick={props.stopPropagationWrapper(() => {
              gitStashApply(props.index)
          }
          )}
          />

          {props.collapsible && (
            <button className={changeStageButtonStyle}>
              {showStashFiles && props?.files.length > 0 ? (
                <caretDownIcon.react />
              ) : (
                <caretRightIcon.react />
              )}
            </button>
          )}
        </div>
      {showStashFiles && (<ul>
        {props?.files.map((name) => (
          <li>{name}
          
          </li>
        ))}
      </ul>)}
    </div>
  )
}
  
export const GitStash: React.FunctionComponent<IGitStashProps> = (
  props: IGitStashProps
) => {
  const [showStash, setShowStash] = React.useState(true);
  const nStash = props && props.stash ? props.stash.length : 0;

  const gitStashClear = async (): Promise<void> => {
    await props.model.stash_drop('clear');
  }
  
  // const gitStash = async (): Promise<void> => {
  //   await props.model.stash();
  // }


  const gitStashApplyLatest = async (): Promise<void> => {
    await props.model.stash_apply(0);
  }

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
        <span className={sectionHeaderLabelStyle}>Stash ({nStash})
         <ActionButton
            icon={discardIcon}
            title={'Clear the entire stash'}
            onClick={props.stopPropagationWrapper(() => {
              gitStashClear()
          }
          )}/>
         <ActionButton
            icon={discardIcon}
            title={'Apply the latest stash'}
            onClick={props.stopPropagationWrapper(() => {
              gitStashApplyLatest()
          }
          )}/>
        </span>
      </div>

      <UseSignal signal={props.model.stashChanged}>
      {() => 
        props.model.stashChanged && (<div>Hello Chicken</div>)
      }
      </UseSignal>
      
      {showStash && nStash > 0 && (
        props.stash?.map((entry) => (
          // each entry should have a dropdown
          <GitStashEntry
            files={entry.files}
            model={props.model}
            index={entry.index}
            branch={entry.branch}
            message={entry.message}
            height={100}
            collapsible={true}
            stopPropagationWrapper={props.stopPropagationWrapper}
          />
        ))
      )}
    </div>
  );
};
