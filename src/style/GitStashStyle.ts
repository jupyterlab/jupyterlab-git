import { style } from 'typestyle';
import type { NestedCSSProperties } from 'typestyle/lib/types';
import { sectionAreaStyle } from './GitStageStyle';

export const stashContainerStyle = style(
  (() => {
    const styled: NestedCSSProperties = { $nest: {} };

    styled.$nest[`& > .${sectionAreaStyle}`] = {
      margin: 0
    };
    return styled;
  })()
);

export const sectionHeaderLabelStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  flex: '1 1 auto',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  display: 'flex',
  justifyContent: 'space-between'
});

export const sectionButtonContainerStyle = style({
  display: 'flex'
});

export const stashFileStyle = style({
  display: 'flex',
  padding: '0 4px'
});

export const listStyle = style({
  overflowX: 'hidden',
  $nest: {
    '&>*': {
      margin: 0,
      padding: 0
    }
  }
});
export const stashEntryMessageStyle = style({
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  display: 'inline-block',
  maxWidth: 'calc(100% - 100px)' // Adjust this value based on the space required for the action buttons
});
