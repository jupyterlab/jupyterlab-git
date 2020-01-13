import { style } from 'typestyle';

export const commitStyle = style({
  flex: '0 0 auto',
  width: '100%',
  fontSize: '12px',
  marginBottom: '10px',
  marginTop: '5px'
});

export const commitOverviewNumbers = style({
  fontSize: '13px',
  fontWeight: 'bold',
  paddingTop: '5px',
  $nest: {
    '& span': {
      marginLeft: '5px'
    },
    '& span:nth-of-type(1)': {
      marginLeft: '0px'
    }
  }
});

export const commitDetailStyle = style({
  flex: '1 1 auto',
  margin: '0',
  overflow: 'auto'
});

export const commitDetailHeader = style({
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

export const iconStyle = style({
  display: 'inline-block',
  width: '13px',
  height: '13px',
  right: '10px'
});

export const insertionsIconStyle = style({
  $nest: {
    '.jp-icon3': {
      fill: '#00dc00'
    }
  }
});

export const deletionsIconStyle = style({
  $nest: {
    '.jp-icon3': {
      fill: '#ff0000'
    }
  }
});

export const warningLabel = style({
  padding: '5px 1px 5px 0'
});

export const messageInput = style({
  boxSizing: 'border-box',
  width: '95%',
  marginBottom: '7px'
});

export const button = style({
  outline: 'none',
  border: 'none',
  color: 'var(--jp-layout-color0)'
});

export const resetDeleteDisabledButton = style({
  backgroundColor: 'var(--jp-error-color2)'
});

export const resetDeleteButton = style({
  backgroundColor: 'var(--jp-error-color1)'
});

export const cancelButton = style({
  backgroundColor: 'var(--jp-layout-color4)',
  marginRight: '4px'
});

export const fileList = style({
  paddingLeft: 0
});
