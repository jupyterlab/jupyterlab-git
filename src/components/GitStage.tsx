import * as React from 'react';
import { classes } from 'typestyle';
import {
  caretdownImageStyle,
  caretrightImageStyle,
  changeStageButtonStyle,
  sectionHeaderSizeStyle,
  sectionAreaStyle,
  sectionFileContainerStyle,
  sectionHeaderLabelStyle
} from '../style/GitStageStyle';

/**
 * Git stage component properties
 */
export interface IGitStageProps {
  /**
   * Actions component to display at the far left of the stage
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
            className={classes(
              changeStageButtonStyle,
              showFiles && props.nFiles > 0
                ? caretdownImageStyle
                : caretrightImageStyle
            )}
            onClick={() => {
              if (props.nFiles > 0) {
                setShowFiles(!showFiles);
              }
            }}
          />
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
