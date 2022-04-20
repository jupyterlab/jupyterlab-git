import { style } from 'typestyle';

export const clickableSpanStyle = style({
  cursor: 'pointer'
});

export const commitComparisonBoxStyle = style({
  display: 'flex',
  flexDirection: 'column',

  minHeight: '200px',

  marginBlockStart: 0,
  marginBlockEnd: 0,
  paddingLeft: 0,

  overflowY: 'auto',

  $nest: {
    '& button:disabled': {
      opacity: 0.5
    }
  }
});

export const commitComparisonBoxDetailStyle = style({
  maxHeight: '25%',
  overflowY: 'hidden'
});

export const commitComparisonBoxChangedFileListStyle = style({
  maxHeight: '100%'
});
