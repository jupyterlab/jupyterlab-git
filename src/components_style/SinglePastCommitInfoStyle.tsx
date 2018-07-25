import { style } from 'typestyle';

export const commitStyle = style({
  flex: '0 0 auto',
  width: '100%',
  paddingLeft: '10px',
  fontSize: '12px',
  marginBottom: '10px'
});

export const headerStyle = style({
  backgroundColor: 'var(--md-green-500)',
  color: 'white',
  display: 'inline-block',
  width: '100%',
  height: '30px'
});

export const commitNumberLabelStyle = style({
  float: 'right',
  paddingRight: '19px',
  fontWeight: 'bold',
  display: 'inline-block'
});

export const commitAuthorLabelStyle = style({
  fontSize: '10px'
});

export const commitAuthorIconStyle = style({
  backgroundImage: 'var(--jp-Git-icon-author)',
  display: 'inline-block',
  height: '9px',
  width: '9px'
});

export const commitLabelDateStyle = style({
  fontSize: '13px',
  display: 'inline-block'
});

export const commitLabelMessageStyle = style({
  fontSize: '13px',
  textAlign: 'left',
  paddingRight: '10px'
});

export const commitDetailStyle = style({
  flex: '1 1 auto',
  margin: '0',
  paddingLeft: '10px',
  overflow: 'auto'
});

export const commitDetailHeader = style({
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
  fontSize: '13px',
  fontWeight: 'bold'
});

export const commitDetailFileStyle = style({
  display: 'flex',
  flexDirection: 'row',
  color: 'var(--jp-ui-font-color1)',
  height: 'var(--jp-private-running-item-height)',
  lineHeight: 'var(--jp-private-running-item-height)',
  whiteSpace: 'nowrap'
});

export const commitDetailFilePathStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  flex: '1 1 auto',
  marginRight: '4px',
  paddingLeft: '4px',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  borderRadius: '2px',
  transition: 'background-color 0.1s ease'
});

export const iconStyle = style({
  display: 'inline-block',
  width: '30px',
  height: '13px',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '15px',
  right: '10px'
});

export const numberofChangedFilesStyle = style({
  backgroundImage: 'var(--jp-icon-file)'
});

export const insertionIconStyle = style({
  backgroundImage: 'var(--jp-icon-insertions-made)'
});

export const deletionIconStyle = style({
  backgroundImage: 'var(--jp-icon-deletions-made)'
});

export const numberOfDeletionsStyle = style({
  position: 'absolute',
  right: '12px',
  width: '15px',
  marginTop: '1px'
});

export const numberOfInsertionsStyle = style({
  position: 'absolute',
  right: '50px',
  width: '15px',
  marginTop: '1px'
});
