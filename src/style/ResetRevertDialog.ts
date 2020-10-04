import { style } from 'typestyle';

export const resetRevertDialogClass = style({
  height: 'auto',
  width: '380px',

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

  cursor: 'pointer',

  border: '0',
  borderRadius: '3px',

  $nest: {
    '&:disabled': {
      cursor: 'default'
    }
  }
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

export const submitButtonClass = style({
  backgroundColor: 'var(--md-blue-500)',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--md-blue-600)'
    },
    '&:active': {
      backgroundColor: 'var(--md-blue-700)'
    },
    '&:disabled': {
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

export const commitFormClass = style({
  display: 'flex',
  flexWrap: 'wrap',

  marginTop: 'auto',
  padding: 0,

  alignItems: 'flex-start',

  backgroundColor: 'var(--jp-layout-color1)'
});

export const commitSummaryClass = style({
  width: '100%',
  height: '1.5em',

  marginBottom: '1em',
  padding: 'var(--jp-code-padding)',

  outline: 'none',
  overflowX: 'auto',

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

export const commitDescriptionClass = style({
  width: '100%',

  marginBottom: '1em',
  padding: 'var(--jp-code-padding)',

  outline: 'none',
  overflowX: 'auto',
  resize: 'none',

  color: 'var(--jp-ui-font-color1)',
  fontSize: 'var(--jp-ui-font-size1)',
  fontWeight: 300,

  backgroundColor: 'var(--jp-layout-color1)',
  border: 'var(--jp-border-width) solid var(--jp-border-color2)',
  borderRadius: '3px',

  $nest: {
    '&:focus': {
      outline: 'none',
      border: 'var(--jp-border-width) solid var(--jp-brand-color1)'
    },
    '&:active': {
      outline: 'none',
      border: 'var(--jp-border-width) solid var(--jp-brand-color1)'
    },
    '&::placeholder': {
      color: 'var(--jp-ui-font-color3)'
    },
    '&::-webkit-input-placeholder': {
      color: 'var(--jp-ui-font-color3)'
    },
    '&::-moz-placeholder': {
      color: 'var(--jp-ui-font-color3)'
    },
    '&::-ms-input-placeholder': {
      color: 'var(--jp-ui-font-color3)'
    }
  }
});
