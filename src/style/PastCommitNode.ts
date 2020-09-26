import { style } from 'typestyle';

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

export const branchWrapperClass = style({
  display: 'flex',
  fontSize: '0.8em',
  marginLeft: '-5px'
});

export const branchClass = style({
  padding: '2px',
  // Special case as black, regardless of theme, because
  // backgrounds of colors are not based on theme either
  color: '#000000',
  border: 'var(--jp-border-width) solid #424242',
  borderRadius: '4px',
  margin: '3px'
});

export const remoteBranchClass = style({
  backgroundColor: '#ffcdd3'
});

export const localBranchClass = style({
  backgroundColor: '#b2ebf3'
});

export const workingBranchClass = style({
  backgroundColor: '#ffce83'
});

export const commitExpandedClass = style({
  backgroundColor: 'var(--jp-layout-color1)'
});

export const commitBodyClass = style({
  flex: 'auto'
});

export const iconButtonClass = style({
  width: '16px',
  height: '16px',

  /* top | right | bottom | left */
  margin: 'auto 8px auto auto'
});

export const expandIconButtonClass = style({
  backgroundImage: 'var(--jp-icon-caretdown)',
  backgroundSize: '20px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});

export const collapseIconButtonClass = style({
  backgroundImage: 'var(--jp-icon-caretup)',
  backgroundSize: '20px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});
