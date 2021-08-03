import { style } from 'typestyle';

export const selectedHistoryFileStyle = style({
  minHeight: '48px',

  top: 0,
  position: 'sticky',

  flexGrow: 0,
  flexShrink: 0,

  overflowX: 'hidden',

  backgroundColor: 'var(--jp-toolbar-active-background)'
});

export const noHistoryFoundStyle = style({
  display: 'flex',
  justifyContent: 'center',

  padding: '10px 0',

  color: 'var(--jp-ui-font-color2)'
});

export const historySideBarStyle = style({
  display: 'flex',
  flexDirection: 'column',

  minHeight: '400px',

  marginBlockStart: 0,
  marginBlockEnd: 0,
  paddingLeft: 0,

  overflowY: 'auto'
});
