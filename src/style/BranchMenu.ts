import { style } from 'typestyle';
import { showButtonOnHover } from './ActionButtonStyle';

export const nameClass = style({
  flex: '1 1 auto',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap'
});

export const wrapperClass = style({
  marginTop: '6px',
  marginBottom: '0',

  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)'
});

export const filterWrapperClass = style({
  padding: '4px 11px 4px',
  display: 'flex'
});

export const filterClass = style({
  flex: '1 1 auto',
  boxSizing: 'border-box',
  display: 'inline-block',
  position: 'relative',
  fontSize: 'var(--jp-ui-font-size1)'
});

export const filterInputClass = style({
  boxSizing: 'border-box',

  width: '100%',
  height: '2em',

  /* top | right | bottom | left */
  padding: '1px 18px 2px 7px',

  color: 'var(--jp-ui-font-color1)',
  fontSize: 'var(--jp-ui-font-size1)',
  fontWeight: 300,

  backgroundColor: 'var(--jp-layout-color1)',

  border: 'var(--jp-border-width) solid var(--jp-border-color2)',
  borderRadius: '3px',

  $nest: {
    '&:active': {
      border: 'var(--jp-border-width) solid var(--jp-brand-color1)'
    },
    '&:focus': {
      border: 'var(--jp-border-width) solid var(--jp-brand-color1)'
    }
  }
});

export const filterClearClass = style({
  position: 'absolute',
  right: '5px',
  top: '0.6em',

  height: '1.1em',
  width: '1.1em',

  padding: 0,

  backgroundColor: 'var(--jp-inverse-layout-color4)',

  border: 'none',
  borderRadius: '50%',

  $nest: {
    svg: {
      width: '0.5em!important',
      height: '0.5em!important',

      fill: 'var(--jp-ui-inverse-font-color0)'
    },
    '&:hover': {
      backgroundColor: 'var(--jp-inverse-layout-color3)'
    },
    '&:active': {
      backgroundColor: 'var(--jp-inverse-layout-color2)'
    }
  }
});

export const newBranchButtonClass = style({
  boxSizing: 'border-box',

  width: '7.7em',
  height: '2em',
  flex: '0 0 auto',

  marginLeft: '5px',

  color: 'white',
  fontSize: 'var(--jp-ui-font-size1)',

  backgroundColor: 'var(--md-blue-500)',
  border: '0',
  borderRadius: '3px',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--md-blue-600)'
    },
    '&:active': {
      backgroundColor: 'var(--md-blue-700)'
    }
  }
});

export const listItemClass = style(
  {
    padding: '4px 11px!important'
  },
  showButtonOnHover
);

export const activeListItemClass = style({
  color: 'white!important',

  backgroundColor: 'var(--jp-brand-color1)!important',

  $nest: {
    '& .jp-icon-selectable[fill]': {
      fill: 'white'
    }
  }
});

export const listItemIconClass = style({
  width: '16px',
  height: '16px',

  marginRight: '4px'
});
