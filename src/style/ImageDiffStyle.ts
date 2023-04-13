import { style } from 'typestyle';

export const tabsClass = style({
  $nest: {
    'button:last-of-type': {
      borderRight: 'none'
    }
  }
});

export const tabClass = style({
  minHeight: '15px',
  flexGrow: 1,

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
