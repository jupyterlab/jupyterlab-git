import { style } from 'typestyle';

export const fileListWrapperClass = style({
  height: 'inherit',
  minHeight: '150px',

  overflow: 'hidden',
  overflowY: 'auto'
});

export const unmergedRowStyle = style({
  color: 'var(--jp-warn-color0) !important'
});
