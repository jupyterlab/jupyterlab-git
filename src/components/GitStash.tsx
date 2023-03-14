import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
// import { FixedSizeList, ListChildComponentProps } from 'react-window';
import {
  changeStageButtonStyle,
  sectionAreaStyle,
  sectionFileContainerStyle,
  sectionHeaderLabelStyle,
  sectionHeaderSizeStyle
} from '../style/GitStageStyle';
import { Git } from '../tokens';

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
    // selectAllButton?: React.ReactElement; 
}

interface IGitStashEntryProps {
    /**
     * Is this group collapsible
     */
    collapsible?: boolean;
    /**
     * Files in the group
     */
    files: string[];
    /**
     * Group title
     */
    index: number;
    /**
     * HTML element height
     */
    height: number;
    /**
     * Optional select all element
     */
    // selectAllButton?: React.ReactElement;
}

/**
 * Dropdown for each entry in the stash
 */
const GitStashEntry: React.FunctionComponent<
  IGitStashEntryProps
> = (
  props: IGitStashEntryProps
) => {
  return (
    <div>
      <div>{props.index}</div>
      <ul>
        {props.files.map((name) => (
          <li>{name}</li>
        ))}
      </ul>
    </div>
  )
}
  
export const GitStash: React.FunctionComponent<IGitStashProps> = (
  props: IGitStashProps
) => {
  const [showStash, setShowStash] = React.useState(true);
  const nStash = props.stash.length;


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
        {/* {props.selectAllButton && props.selectAllButton} */}
        {props.collapsible && (
          <button className={changeStageButtonStyle}>
            {showStash && nStash > 0 ? (
              <caretDownIcon.react />
            ) : (
              <caretRightIcon.react />
            )}
          </button>
        )}
        <span className={sectionHeaderLabelStyle}>Stash</span>
        {/* {props.actions} */}
        <span className={sectionHeaderSizeStyle}>({nStash})</span>
      </div>
      
      {showStash && nStash > 0 && (
        props.stash?.map((entry) => (
          // each entry should have a dropdown
          <GitStashEntry
            files={entry.files}
            index={entry.index}
            height={100}
          />
        ))
      )}
    </div>
  );
};
