import { style } from 'typestyle';

export const panelWrapperClass = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflowY: 'auto'
});

/**
 * Container for the accordion sections that replaced the previous
 * Changes / History tab strip.
 */
export const panelMainClass = style({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto'
});

export const warningTextClass = style({
  fontSize: 'var(--jp-ui-font-size1)',
  lineHeight: 'var(--jp-content-line-height)',
  margin: '13px 11px 4px 11px',
  textAlign: 'left'
});

export const repoButtonClass = style({
  alignSelf: 'center',
  boxSizing: 'border-box',

  height: '28px',
  width: '200px',
  marginTop: '5px',
  border: '0',
  borderRadius: '3px',

  color: 'white',
  fontSize: 'var(--jp-ui-font-size1)',

  backgroundColor: 'var(--md-blue-500)',
  $nest: {
    '&:hover': {
      backgroundColor: 'var(--md-blue-600)'
    },
    '&:active': {
      backgroundColor: 'var(--md-blue-700)'
    }
  }
});

/* Sub-tabs (Branches / Tags) inside the branch dropdown — kept because the
 * dropdown still surfaces these as inline tabs. */
export const tabsClass = style({
  minHeight: '34px!important',

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
  minHeight: '34px!important',

  color: 'var(--jp-ui-font-color2)!important',
  backgroundColor: 'var(--jp-layout-color2)!important',

  borderBottom:
    'var(--jp-border-width) solid var(--jp-border-color2)!important',
  borderRight: 'var(--jp-border-width) solid var(--jp-border-color2)!important',

  transition: 'background-color 120ms ease, color 120ms ease',

  // @ts-expect-error unknown value
  textTransform: 'none !important',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color1)!important',
      color: 'var(--jp-ui-font-color1)!important'
    }
  }
});

export const selectedTabClass = style({
  backgroundColor: 'var(--jp-layout-color1)!important',
  color: 'var(--jp-ui-font-color1)!important',
  fontWeight: 600
});

export const tabIndicatorClass = style({
  height: '3px!important',

  backgroundColor: 'var(--jp-brand-color1)!important',
  transition: 'none!important'
});
