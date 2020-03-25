import { style } from 'typestyle';

export const fileIconStyle = style({
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '16px',
  flex: '0 0 auto',
  marginRight: '4px',
  minHeight: '16px',
  padding: '0px 8px'
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
