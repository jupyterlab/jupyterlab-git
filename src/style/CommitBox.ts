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

export const dirtyStagedFilesWarningBoxClass = style({
  marginBottom: '1em',
  padding: 'var(--jp-code-padding)',

  outline: 'none',
  overflowX: 'auto',

  border: 'var(--jp-border-width) solid var(--jp-border-color2)',
  borderRadius: '3px'
});

export const dirtyStagedFilesWarningBoxHeaderClass = style({
  fontWeight: 'bold',
  marginBottom: '0.5em',
  color: 'var(--jp-warn-color1)',
  padding: 0
});

export const dirtyStagedFilesWarningBoxContentClass = style({
  color: 'var(--jp-warn-color1)',
  padding: 0,
  $nest: {
    '&:last-child': {
      paddingBottom: 0
    }
  }
});

export const commitSummaryClass = style({
  height: '2em',

  marginBottom: '1em',
  padding: 'var(--jp-code-padding)',

  outline: 'none',
  overflowX: 'auto',

  border: 'var(--jp-border-width) solid var(--jp-border-color2)',
  borderRadius: '3px',

  $nest: {
    '&.Mui-error': {
      border: 'calc(2 * var(--jp-border-width)) solid var(--jp-error-color1)'
    }
  }
});

export const commitDescriptionClass = style({
  marginBottom: '1em',
  padding: 'var(--jp-code-padding) !important',

  outline: 'none',
  overflowX: 'auto',
  resize: 'none',

  border: 'var(--jp-border-width) solid var(--jp-border-color2)',
  borderRadius: '3px',

  $nest: {
    '&>*::placeholder': {
      color: 'var(--jp-ui-font-color3)'
    },
    '&>*::-webkit-input-placeholder': {
      color: 'var(--jp-ui-font-color3)'
    },
    '&>*::-moz-placeholder': {
      color: 'var(--jp-ui-font-color3)'
    },
    '&>*::-ms-input-placeholder': {
      color: 'var(--jp-ui-font-color3)'
    }
  }
});

export const commitButtonClass = style({
  color: 'var(--jp-ui-inverse-font-color1) !important',
  backgroundColor: 'var(--jp-brand-color1) !important',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-brand-color2) !important'
    }
  }
});

export const commitVariantSelector = style({
  flex: '0 0 20px',
  lineHeight: 'initial !important',

  $nest: {
    '& span': {
      lineHeight: '0'
    },
    '& .jp-icon3[fill]': {
      fill: 'var(--jp-ui-inverse-font-color1)'
    }
  }
});

export const commitInputWrapperClass = style({
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-around'
});

export const commitPaperClass = style({
  maxWidth: '250px'
});

export const commitVariantText = style({
  fontSize: 'var(--jp-ui-font-size1)',
  whiteSpace: 'break-spaces'
});

export const commitRoot = style({
  color: 'var(--jp-ui-font-color1) !important',
  fontSize: 'var(--jp-ui-font-size1) !important',
  fontFamily: 'var(--jp-ui-font-family) !important',
  backgroundColor: 'var(--jp-layout-color1) !important'
});

export const activeStyle = style({
  outline: 'none',
  border: 'var(--jp-border-width) solid var(--jp-brand-color1)'
});

export const disabledStyle = style({
  cursor: 'not-allowed !important',
  color: 'var(--jp-ui-font-color2) !important',
  backgroundColor: 'var(--jp-layout-color3) !important',
  // TypeScript does not know about the value with `!important` flag
  pointerEvents: 'auto !important' as any
});
