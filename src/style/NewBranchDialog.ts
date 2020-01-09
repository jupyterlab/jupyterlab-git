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

export const listWrapperClass = style({
  display: 'block',
  width: '100%',
  maxHeight: '400px',

  border: 'var(--jp-border-width) solid var(--jp-border-color2)',
  borderRadius: '3px',

  overflow: 'hidden',
  overflowY: 'scroll'
});

export const listItemClass = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',

  width: '100%',
  minHeight: '55px',

  /* top | right | bottom | left */
  padding: '4px 11px 4px 11px',

  fontSize: 'var(--jp-ui-font-size1)',
  lineHeight: '1.5em',
  textAlign: 'left',

  border: 'none',
  borderRadius: 0
});

export const activeListItemClass = style({
  color: 'white!important',

  backgroundColor: 'var(--jp-brand-color1)!important'
});

export const listItemContentClass = style({
  flexBasis: 0,
  flexGrow: 1,

  marginTop: 'auto',
  marginBottom: 'auto',
  marginRight: 'auto'
});

export const listItemDescClass = style({
  marginBottom: 'auto'
});

export const listItemIconClass = style({
  width: '16px',
  height: '16px',

  /* top | right | bottom | left */
  margin: 'auto 8px auto 0',

  backgroundImage: 'var(--jp-icon-git-branch)',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});

export const listItemTitleClass = style({
  fontWeight: 700
});

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
