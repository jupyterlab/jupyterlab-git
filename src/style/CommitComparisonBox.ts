import { style } from 'typestyle';

export const commitComparisonBoxStyle = style({
  flex: '0 0 auto',
  display: 'flex',
  flexDirection: 'column',

  marginBlockStart: 0,
  marginBlockEnd: 0,
  paddingLeft: 0,

  overflowY: 'auto',

  borderTop: 'var(--jp-border-width) solid var(--jp-border-color2)'
});

export const commitComparisonDiffStyle = style({
  paddingLeft: 10
});
