import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
import { FixedSizeList } from 'react-window';
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
  height: number;
  /**
   * Row renderer
   */
  rowRenderer: (
    file: Git.IStatusFile,
    style: React.CSSProperties
  ) => JSX.Element;
}

/**
 * Git stage component state
 */
export interface IGitStageState {
  showFiles: boolean;
}

export const GitStage: React.FunctionComponent<IGitStageProps> = (
  props: IGitStageProps
) => {
  const [showFiles, setShowFiles] = React.useState(true);
  const nFiles = props.files.length;

  const _renderList = ({
    index,
    style
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const file = props.files[index];
    return props.rowRenderer(file, style);
  };

  return (
    <div className={sectionFileContainerStyle}>
      <div className={sectionAreaStyle}>
        {props.collapsible && (
          <button
            className={changeStageButtonStyle}
            onClick={() => {
              if (nFiles > 0) {
                setShowFiles(!showFiles);
              }
            }}
          >
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
            Math.min(props.height, nFiles * ITEM_HEIGHT) - HEADER_HEIGHT,
            ITEM_HEIGHT
          )}
          itemCount={nFiles}
          itemData={props.files}
          itemKey={(index, data) => data[index].to}
          itemSize={ITEM_HEIGHT}
          width={'100%'}
          style={{ overflowX: 'visible' }}
        >
          {_renderList}
        </FixedSizeList>
      )}
    </div>
  );
};
