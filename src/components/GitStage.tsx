import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
import {
  changeStageButtonStyle,
  sectionAreaStyle,
  sectionFileContainerStyle,
  sectionHeaderLabelStyle,
  sectionHeaderSizeStyle
} from '../style/GitStageStyle';

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
   * Group title
   */
  heading: string;
  /**
   * Number of files in the group
   */
  nFiles: number;
}

/**
 * Git stage component state
 */
export interface IGitStageState {
  showFiles: boolean;
}

export const GitStage: React.FunctionComponent<IGitStageProps> = (
  props: React.PropsWithChildren<IGitStageProps>
) => {
  const [showFiles, setShowFiles] = React.useState(true);

  return (
    <div className={sectionFileContainerStyle}>
      <div className={sectionAreaStyle}>
        {props.collapsible && (
          <button
            className={changeStageButtonStyle}
            onClick={() => {
              if (props.nFiles > 0) {
                setShowFiles(!showFiles);
              }
            }}
          >
            {showFiles && props.nFiles > 0 ? (
              <caretDownIcon.react />
            ) : (
              <caretRightIcon.react />
            )}
          </button>
        )}
        <span className={sectionHeaderLabelStyle}>{props.heading}</span>
        {props.actions}
        <span className={sectionHeaderSizeStyle}>({props.nFiles})</span>
      </div>
      {showFiles && (
        <ul className={sectionFileContainerStyle}>{props.children}</ul>
      )}
    </div>
  );
};
