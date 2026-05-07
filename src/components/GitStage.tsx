import { caretDownIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
import { classes } from 'typestyle';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import {
  changeStageButtonStyle,
  sectionAreaStyle,
  sectionFileContainerStyle,
  sectionHeaderActionsStyle,
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
  actions?: React.ReactElement;
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
  /**
   * Optional select all element
   */
  selectAllButton?: React.ReactElement;
}

export const GitStage: React.FunctionComponent<IGitStageProps> = (
  props: IGitStageProps
) => {
  const [showFiles, setShowFiles] = React.useState(true);
  const nFiles = props.files.length;
  const canToggle = (props.collapsible ?? false) && nFiles > 0;

  const onToggle = () => {
    if (canToggle) {
      setShowFiles(!showFiles);
    }
  };

  return (
    <div className={sectionFileContainerStyle}>
      <div
        className={classes(
          'jp-AccordionPanel-title',
          showFiles && nFiles > 0 ? 'lm-mod-expanded' : null,
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
            aria-expanded={canToggle ? showFiles : undefined}
            aria-label={props.heading}
            disabled={!canToggle}
          >
            <caretDownIcon.react tag="span" />
          </button>
        )}
        <span className="lm-AccordionPanel-titleLabel">{props.heading}</span>
        {(nFiles > 0 || props.actions) && (
          <div
            className={classes(
              'jp-AccordionPanel-toolbar',
              sectionHeaderActionsStyle
            )}
          >
            {/* Render actions before the count so the count stays anchored
                on the right when hover-revealed actions appear. */}
            {props.actions}
            {nFiles > 0 && (
              <span className={sectionHeaderSizeStyle}>{nFiles}</span>
            )}
          </div>
        )}
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
