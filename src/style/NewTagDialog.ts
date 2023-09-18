import { style } from 'typestyle';

export const tagDialogClass = style({
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

export const listItemDescClass = style({
  marginBottom: 'auto',
  whiteSpace: 'break-spaces'
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

export const historyDialogBoxStyle = style({
  flex: '1 1 auto',
  display: 'flex',
  flexDirection: 'column',

  minHeight: '200px',

  marginBlockStart: 0,
  marginBlockEnd: 0,
  paddingLeft: 0,

  listStyleType: 'none'
});

export const historyDialogBoxWrapperStyle = style({
  display: 'flex',
  height: '200px',
  overflowY: 'auto'
});

export const activeListItemClass = style({
  backgroundColor: 'var(--jp-brand-color1)!important',

  $nest: {
    '& .jp-icon-selectable[fill]': {
      fill: 'white'
    }
  }
});

export const commitHeaderBoldClass = style({
  color: 'white!important',
  fontWeight: '700'
});

export const commitItemBoldClass = style({
  color: 'white!important'
});

export const commitWrapperClass = style({
  flexGrow: 0,
  display: 'flex',
  flexShrink: 0,
  flexDirection: 'column',
  padding: '5px 0px 5px 10px',
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)'
});

export const commitHeaderClass = style({
  display: 'flex',
  color: 'var(--jp-ui-font-color2)',
  paddingBottom: '5px'
});

export const commitHeaderItemClass = style({
  width: '30%',

  paddingLeft: '0.5em',

  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  textAlign: 'left',

  $nest: {
    '&:first-child': {
      paddingLeft: 0
    }
  }
});

export const commitBodyClass = style({
  flex: 'auto'
});
