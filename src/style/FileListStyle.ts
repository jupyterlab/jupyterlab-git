import { style } from 'typestyle';

export const fileListWrapperClass = style({
  height: 'auto',
  minHeight: '150px',
  maxHeight: '400px',
  paddingBottom: '40px',

  overflow: 'hidden',
  overflowY: 'scroll'
});

export const moveFileUpButtonStyle = style({
  backgroundImage: 'var(--jp-icon-move-file-up)'
});

export const moveFileDownButtonStyle = style({
  backgroundImage: 'var(--jp-icon-move-file-down)'
});

export const moveFileUpButtonSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-move-file-up-hover)'
});

export const moveFileDownButtonSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-move-file-down-hover)'
});
