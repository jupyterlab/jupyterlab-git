import { style } from 'typestyle';

export const pastCommitNodeStyle = style({
  flexGrow: 0,
  display: 'flex',
  flexDirection: 'column',
  padding: '10px',
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)'
});

export const pastCommitHeaderStyle = style({
  display: 'flex',
  justifyContent: 'space-between',
  color: 'var(--jp-ui-font-color2)',
  paddingBottom: '5px'
});

export const branchesStyle = style({
  display: 'flex',
  fontSize: '0.8em',
  marginLeft: '-5px'
});

export const branchStyle = style({
  padding: '2px',
  // Special case as black, regardless of theme, because
  // backgrounds of colors are not based on theme either
  color: '#000000de',
  border: 'var(--jp-border-width) solid #424242',
  borderRadius: '4px',
  margin: '3px'
});

export const remoteBranchStyle = style({
  backgroundColor: '#ffcdd3'
});

export const localBranchStyle = style({
  backgroundColor: '#b2ebf3'
});

export const workingBranchStyle = style({
  backgroundColor: '#ffce83'
});

export const pastCommitExpandedStyle = style({
  backgroundColor: '#f9f9f9'
});

export const pastCommitHeaderItemStyle = style({});

export const collapseStyle = style({
  color: '#1a76d2',
  float: 'right'
});

export const pastCommitBodyStyle = style({
  flex: 'auto'
});
