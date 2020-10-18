import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import {
  changeStageButtonStyle,
  sectionAreaStyle,
  sectionFileContainerStyle,
  sectionHeaderLabelStyle,
  sectionHeaderSizeStyle
} from '../style/GitStageStyle';
import { Git } from '../tokens';

const HEADER_HEIGHT = 34;
const ITEM_HEIGHT = 25;

/**
 * Git stage component properties
 */
export interface IGitStageProps {
  /**
   * Actions component to display at the far right of the stage
   */
  actions: React.ReactElement;
  /**
   * Is this group collapsible
   */
  collapsible?: boolean;
  /**
   * Files in the group
   */
  files: Git.IStatusFile[];
  /**
   * Group title
   */
  heading: string;
  /**
   * HTML element height
   */
  height: number;
  /**
   * Row renderer
   */
  rowRenderer: (props: ListChildComponentProps) => JSX.Element;
}

export const GitStage: React.FunctionComponent<IGitStageProps> = (
  props: IGitStageProps
) => {
  const [showFiles, setShowFiles] = React.useState(true);
  const nFiles = props.files.length;

  return (
    <div className={sectionFileContainerStyle}>
      <div
        className={sectionAreaStyle}
        onClick={() => {
          if (props.collapsible && nFiles > 0) {
            setShowFiles(!showFiles);
          }
        }}
      >
        {props.collapsible && (
          <button className={changeStageButtonStyle}>
            {showFiles && nFiles > 0 ? (
              <caretDownIcon.react />
            ) : (
              <caretRightIcon.react />
            )}
          </button>
        )}
        <span className={sectionHeaderLabelStyle}>{props.heading}</span>
        {props.actions}
        <span className={sectionHeaderSizeStyle}>({nFiles})</span>
      </div>
      {showFiles && nFiles > 0 && (
        <FixedSizeList
          height={Math.max(
            Math.min(props.height - HEADER_HEIGHT, nFiles * ITEM_HEIGHT),
            ITEM_HEIGHT
          )}
          itemCount={nFiles}
          itemData={props.files}
          itemKey={(index, data) => data[index].to}
          itemSize={ITEM_HEIGHT}
          style={{ overflowX: 'hidden' }}
          width={'auto'}
        >
          {props.rowRenderer}
        </FixedSizeList>
      )}
    </div>
  );
};
