import { style } from 'typestyle';

export const historyDialogBoxStyle = style({
  flex: '1 1 auto',
  display: 'flex',
  flexDirection: 'column',

  minHeight: '200px',

  marginBlockStart: 0,
  marginBlockEnd: 0,
  paddingLeft: 0,

  listStyleType: 'none'
});

export const historyDialogBoxWrapperStyle = style({
  display: 'flex',
  height: '200px',
  overflowY: 'auto'
});

export const activeListItemClass = style({
  backgroundColor: 'var(--jp-brand-color1)!important',

  $nest: {
    '& .jp-icon-selectable[fill]': {
      fill: 'white'
    }
  }
});

export const commitHeaderBoldClass = style({
  color: 'white!important',
  fontWeight: '700'
});

export const commitItemBoldClass = style({
  color: 'white!important'
});

export const commitWrapperClass = style({
  flexGrow: 0,
  display: 'flex',
  flexShrink: 0,
  flexDirection: 'column',
  padding: '5px 0px 5px 10px',
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)'
});

export const commitHeaderClass = style({
  display: 'flex',
  color: 'var(--jp-ui-font-color2)',
  paddingBottom: '5px'
});

export const commitHeaderItemClass = style({
  width: '30%',

  paddingLeft: '0.5em',

  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  textAlign: 'left',

  $nest: {
    '&:first-child': {
      paddingLeft: 0
    }
  }
});

export const commitBodyClass = style({
  flex: 'auto'
});
