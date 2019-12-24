import { style } from 'typestyle';

// need to override font-size from user agent stylesheet
export const stagedCommitButtonStyle = style({
  backgroundColor: 'var(--jp-brand-color1)',
  backgroundImage: 'var(--jp-checkmark)',
  backgroundSize: '100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  border: '0',
  color: 'white',
  flex: '1 1 auto',
  fontSize: 'var(--jp-ui-font-size1)',
  height: 'calc(2 * (1.25em - 1px))',
  padding: 'calc(var(--jp-code-padding) + 1px) 7px',
  width: '40px'
});

export const stagedCommitButtonReadyStyle = style({
  opacity: 0.3
});

export const stagedCommitButtonDisabledStyle = style({
  backgroundColor: 'lightgray'
});

export const textInputStyle = style({
  outline: 'none'
});

export const stagedCommitStyle = style({
  resize: 'none',
  display: 'flex',
  alignItems: 'flex-start',
  margin: '8px'
});

// need to override font-size from user agent stylesheet
export const stagedCommitMessageStyle = style({
  backgroundColor: 'var(--jp-layout-color1)',
  border: 'var(--jp-border-width) solid var(--jp-border-color2)',
  color: 'var(--jp-ui-font-color0)',
  fontSize: 'var(--jp-ui-font-size1)',
  fontWeight: 300,
  flex: '20 1 auto',
  overflowX: 'auto',
  padding: 'var(--jp-code-padding)',
  resize: 'none',
  width: '75%',

  $nest: {
    '&:focus': {
      outline: 'none'
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
