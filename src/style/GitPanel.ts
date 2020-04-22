import { style } from 'typestyle';

export const panelWrapperClass = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflowY: 'auto'
});

export const warningWrapperClass = style({
  marginTop: '9px',
  textAlign: 'center',

  /* top | right | bottom | left */
  padding: '4px 11px 4px 11px!important',

  fontSize: 'var(--jp-ui-font-size1)',
  lineHeight: '1.5em'
});

export const warningTextClass = style({
  textAlign: 'left'
});

export const repoButtonClass = style({
  boxSizing: 'border-box',

  height: '2em',
  width: '12em',
  marginTop: '5px',

  color: 'white',
  fontSize: 'var(--jp-ui-font-size1)',

  backgroundColor: 'var(--jp-brand-color1)',
  border: '0',
  borderRadius: '3px'
});

export const tabsClass = style({
  minHeight: '36px!important',

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
  minHeight: '36px!important',

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
