import { style } from 'typestyle';

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
    },
  }
});
