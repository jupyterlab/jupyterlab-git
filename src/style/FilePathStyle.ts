import { style } from 'typestyle';

export const fileIconStyle = style({
  flex: '0 0 auto',
  padding: '0px 8px',
  marginRight: '4px',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  height: '16px'
});

export const fileLabelStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  flex: '1 1 auto',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap'
});

export const folderLabelStyle = style({
  fontSize: 'var(--jp-ui-font-size0)',
  color: 'var(--jp-ui-font-color2)',
  margin: '0px 4px'
});
