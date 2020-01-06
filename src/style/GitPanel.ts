import { style } from 'typestyle';

export const panelWrapperClass = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflowY: 'auto'
});

export const warningWrapperClass = style({
  marginTop: '9px',
  textAlign: 'center'
});

export const repoButtonClass = style({
  marginTop: '5px',
  color: 'white',
  backgroundColor: 'var(--jp-brand-color1)'
});

export const tabsClass = style({
  $nest: {
    'button:last-of-type': {
      borderRight: 'none'
    }
  }
});

export const tabClass = style({
  width: '50%',
  minWidth: '0!important',
  maxWidth: '50%!important',

  backgroundColor: 'var(--jp-layout-color2)!important',

  borderBottom:
    'var(--jp-border-width) solid var(--jp-border-color2)!important',
  borderRight: 'var(--jp-border-width) solid var(--jp-border-color2)!important',

  $nest: {
    span: {
      textTransform: 'none'
    }
  }
});

export const selectedTabClass = style({
  backgroundColor: 'var(--jp-layout-color1)!important'
});

export const tabIndicatorClass = style({
  height: '3px!important',

  backgroundColor: 'var(--jp-brand-color1)!important',
  transition: 'none!important'
});
