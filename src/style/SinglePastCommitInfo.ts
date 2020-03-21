import { style } from 'typestyle';

export const commitClass = style({
  flex: '0 0 auto',
  width: '100%',
  fontSize: '12px',
  marginBottom: '10px',
  marginTop: '5px'
});

export const commitOverviewNumbersClass = style({
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

export const commitDetailClass = style({
  flex: '1 1 auto',
  margin: '0',
  overflow: 'auto'
});

export const commitDetailHeaderClass = style({
  paddingBottom: '0.5em',
  fontSize: '13px',
  fontWeight: 'bold'
});

export const commitDetailFileClass = style({
  display: 'flex',
  flexDirection: 'row',
  color: 'var(--jp-ui-font-color1)',
  height: 'var(--jp-private-running-item-height)',
  lineHeight: 'var(--jp-private-running-item-height)',
  whiteSpace: 'nowrap',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    },
    '&:active': {
      backgroundColor: 'var(--jp-layout-color3)'
    }
  }
});

export const iconClass = style({
  display: 'inline-block',
  width: '13px',
  height: '13px',
  right: '10px'
});

export const insertionsIconClass = style({
  $nest: {
    '.jp-icon3': {
      fill: '#00dc00'
    }
  }
});

export const deletionsIconClass = style({
  $nest: {
    '.jp-icon3': {
      fill: '#ff0000'
    }
  }
});

export const diffIconClass = style({
  backgroundColor: 'transparent',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundImage: 'var(--jp-icon-diff)',
  border: 'none',
  outline: 'none',
  width: '2px'
});

export const revertButtonClass = style({
  backgroundImage: 'var(--jp-icon-rewind)',
  marginLeft: '6px'
});

export const fileListClass = style({
  paddingLeft: 0
});

export const actionButtonClass = style({
  float: 'right'
});
