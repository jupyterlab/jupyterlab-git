import { style } from 'typestyle';

export const pastCommitNodeStyle = style({
  flexGrow: 0,
  display: 'flex',
  flexShrink: 0,
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
  backgroundColor: 'var(--jp-layout-color1)'
});

export const pastCommitHeaderItemStyle = style({});

export const pastCommitBodyStyle = style({
  flex: 'auto'
});

export const expandButtonIconClass = style({
  width: '16px',
  height: '16px',

  /* top | right | bottom | left */
  margin: 'auto 8px auto 0'
});

export const expandIconClass = style({
  backgroundImage: 'var(--jp-icon-caretdown)',
  backgroundSize: '20px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});

export const collapseIconClass = style({
  backgroundImage: 'var(--jp-icon-caretup)',
  backgroundSize: '20px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});
