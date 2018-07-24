import { style } from 'typestyle';

export const repoStyle = style({
  display: 'flex',
  flexDirection: 'row',
  backgroundColor: 'var(--jp-layout-color1)',
  lineHeight: 'var(--jp-private-running-item-height)',
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
});

export const repoPathStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  marginRight: '4px',
  paddingLeft: '4px',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
  lineHeight: '33px'
});

export const repoRefreshStyle = style({
  width: 'var(--jp-private-running-button-width)',
  background: 'var(--jp-layout-color1)',
  border: 'none',
  backgroundImage: 'var(--jp-icon-refresh)',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  outline: 'none',

  $nest: {
    '&:hover': {
      backgroundColor: 'lightgray'
    },
    '&:active': {
      backgroundColor: 'lightgray',
      boxShadow: '0 1px #666',
      transform: 'translateY(0.5px)'
    }
  }
});

export const repoIconStyle = style({
  padding: '0px 8px',
  marginRight: '4px',
  marginLeft: '8px',
  backgroundSize: '15px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundImage: 'var(--jp-icon-home)'
});

export const arrowStyle = style({
  backgroundImage: 'var(--jp-path-arrow-right)',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  width: '18px',
  backgroundSize: '18px',
  verticalAlign: 'middle',
  lineHeight: '33px'
});

export const gitRepoPathContainerStyle = style({
  display: 'inline-flex',
  verticalAlign: 'middle',
  lineHeight: '33px'
});

export const directoryStyle = style({
  paddingLeft: '5px'
});
