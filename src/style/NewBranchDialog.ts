import { style } from 'typestyle';

export const branchDialogClass = style({
  width: '400px',

  borderRadius: '3px!important'
});

export const closeButtonClass = style({
  position: 'absolute',
  top: '10px',
  right: '12px',

  height: '30px',
  width: '30px',

  padding: 0,

  border: 'none',
  borderRadius: '50%',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-toolbar-active-background)'
    },
    '&:active': {
      backgroundColor: 'var(--jp-toolbar-active-background)'
    }
  }
});

export const titleWrapperClass = style({
  boxSizing: 'border-box',
  position: 'relative',

  padding: '15px',

  borderBottom: 'var(--jp-border-width) solid #e0e0e0'
});

export const titleClass = style({
  fontWeight: 700
});

export const contentWrapperClass = style({
  padding: '15px',

  $nest: {
    '> p': {
      marginBottom: '10px'
    }
  }
});

export const nameInputClass = style({
  boxSizing: 'border-box',

  width: '100%',
  height: '2em',

  marginBottom: '16px',

  /* top | right | bottom | left */
  padding: '1px 18px 2px 7px',

  fontSize: 'var(--jp-ui-font-size1)',
  fontWeight: 300,

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

export const menuWrapperClass = style({});

export const menuListItemClass = style({});

export const menuListItemDescClass = style({});

export const menuListItemIconClass = style({});

export const menuListItemTitleClass = style({});

export const actionsWrapperClass = style({
  padding: '15px!important',

  borderTop: 'var(--jp-border-width) solid #e0e0e0'
});

export const buttonClass = style({
  boxSizing: 'border-box',

  width: '9em',
  height: '2em',

  color: 'white',
  fontSize: 'var(--jp-ui-font-size1)',

  border: '0',
  borderRadius: '3px'
});

export const cancelButtonClass = style({
  backgroundColor: 'var(--jp-inverse-layout-color4)'
});

export const createButtonClass = style({
  backgroundColor: 'var(--jp-brand-color1)'
});
