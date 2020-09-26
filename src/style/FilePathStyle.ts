import { style } from 'typestyle';

export const fileIconStyle = style({
  flex: '0 0 auto',
  height: '16px',
  width: '16px',
  marginRight: '4px'
});

export const fileLabelStyle = style({
  flex: '1 1 auto',
  fontSize: 'var(--jp-ui-font-size1)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
});

export const folderLabelStyle = style({
  color: 'var(--jp-ui-font-color2)',
  fontSize: 'var(--jp-ui-font-size0)',
  margin: '0px 4px'
});
