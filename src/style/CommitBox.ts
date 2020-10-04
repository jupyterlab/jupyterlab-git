import { style } from 'typestyle';

export const commitFormClass = style({
  display: 'flex',
  flexWrap: 'wrap',

  marginTop: 'auto',
  padding: '8px',
  paddingTop: '1em',

  alignItems: 'flex-start',

  backgroundColor: 'var(--jp-layout-color1)',
  borderTop: 'var(--jp-border-width) solid var(--jp-border-color2)'
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

export const commitButtonClass = style({
  width: '100%',
  height: '2em',

  marginBottom: '0.5em',

  color: 'white',
  fontSize: 'var(--jp-ui-font-size1)',

  cursor: 'pointer',

  backgroundColor: 'var(--md-blue-500)',
  border: '0',
  borderRadius: '3px',

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
