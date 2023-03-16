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
import { useEffect } from 'react';

// import { hiddenButtonStyle } from '../style/ActionButtonStyle';
// import { fileListWrapperClass } from '../style/FileListStyle';
import { ActionButton } from './ActionButton';
import {
  addIcon,
  discardIcon,
  removeIcon
} from '../style/icons';
import { TranslationBundle } from '@jupyterlab/translation';
// const HEADER_HEIGHT = 34;
// const ITEM_HEIGHT = 25;

export interface IGitStashProps {
    /**
     * Is this group collapsible
     */
    collapsible?: boolean;
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
}

interface IGitStashEntryProps {
    /**
     * Is this group collapsible
     */
    collapsible?: boolean;
    /**
     * Files correspodning to the stash
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

  return (
    <div>
        <div
          className={sectionAreaStyle}
          onClick={() => {
            if (props.collapsible && props.files.length > 0) {
              setShowStashFiles(!showStashFiles);
            }
          }}
        >
          <p>{props.index}</p>
          <ActionButton
            icon={addIcon}
            title={'Test'}
            onClick={()=>{
              console.log('hi');
            }}
          />
          <ActionButton
            icon={discardIcon}
            title={'Test'}
            onClick={()=>{
              console.log('hi');
            }}
          />
          <ActionButton
            icon={removeIcon}
            title={'Test'}
            onClick={()=>{
              console.log('hi');
            }}
          />
          {props.collapsible && (
            <button className={changeStageButtonStyle}>
              {showStashFiles && props.files.length > 0 ? (
                <caretDownIcon.react />
              ) : (
                <caretRightIcon.react />
              )}
            </button>
          )}
        </div>
      {showStashFiles && (<ul>
        {props.files.map((name) => (
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
  const nStash = props.stash.length;
  useEffect(()=>{
    console.log(props.collapsible);
  })

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
            title={'Clear'}
            onClick={()=>{
              console.log('hi');
            }}
          />
        
        </span>
      </div>
      
      {showStash && nStash > 0 && (
        props.stash?.map((entry) => (
          // each entry should have a dropdown
          <GitStashEntry
            files={entry.files}
            index={entry.index}
            height={100}
            collapsible={true}
          />
        ))
      )}
    </div>
  );
};
