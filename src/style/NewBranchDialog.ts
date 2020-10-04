import { style } from 'typestyle';

export const branchDialogClass = style({
  minHeight: '460px',
  width: '400px',

  color: 'var(--jp-ui-font-color1)!important',

  borderRadius: '3px!important',

  backgroundColor: 'var(--jp-layout-color1)!important'
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

  backgroundColor: 'var(--jp-layout-color1)',

  $nest: {
    svg: {
      fill: 'var(--jp-ui-font-color1)'
    },
    '&:hover': {
      backgroundColor: 'var(--jp-border-color2)'
    },
    '&:active': {
      backgroundColor: 'var(--jp-border-color2)'
    }
  }
});

export const titleWrapperClass = style({
  boxSizing: 'border-box',
  position: 'relative',

  padding: '15px',

  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)'
});

export const titleClass = style({
  fontWeight: 700
});

export const contentWrapperClass = style({
  padding: '15px',

  $nest: {
    '> p': {
      marginBottom: '7px'
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

export const filterWrapperClass = style({
  padding: 0,
  paddingBottom: '4px'
});

export const filterClass = style({
  boxSizing: 'border-box',
  display: 'inline-block',
  position: 'relative',

  width: '100%',

  marginRight: '11px',

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

export const listWrapperClass = style({
  boxSizing: 'border-box',
  display: 'block',
  border: 'var(--jp-border-width) solid var(--jp-border-color2)',
  borderRadius: '3px',
  paddingTop: 0,
  paddingBottom: 0
});

export const listItemClass = style({
  flexDirection: 'row',
  flexWrap: 'wrap',

  width: '100%',

  /* top | right | bottom | left */
  padding: '4px 11px 4px 11px!important',

  fontSize: 'var(--jp-ui-font-size1)',
  lineHeight: '1.5em'
});

export const activeListItemClass = style({
  color: 'white!important',

  backgroundColor: 'var(--jp-brand-color1)!important',

  $nest: {
    '& .jp-icon-selectable[fill]': {
      fill: 'white'
    }
  }
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
  margin: 'auto 8px auto 0'
});

export const listItemTitleClass = style({});

export const listItemBoldTitleClass = style({
  fontWeight: 700
});

export const errorMessageClass = style({
  color: '#ff0000'
});

export const actionsWrapperClass = style({
  padding: '15px!important',

  borderTop: 'var(--jp-border-width) solid var(--jp-border-color2)'
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
  backgroundColor: 'var(--md-grey-500)',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--md-grey-600)'
    },
    '&:active': {
      backgroundColor: 'var(--md-grey-700)'
    }
  }
});

export const createButtonClass = style({
  backgroundColor: 'var(--md-blue-500)',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--md-blue-600)'
    },
    '&:active': {
      backgroundColor: 'var(--md-blue-700)'
    },
    '&:disabled': {
      cursor: 'default',
      color: 'var(--jp-ui-inverse-font-color0)',
      backgroundColor: 'var(--jp-layout-color3)'
    },
    '&:disabled:hover': {
      backgroundColor: 'var(--jp-layout-color3)'
    },
    '&:disabled:active': {
      backgroundColor: 'var(--jp-layout-color3)'
    }
  }
});
