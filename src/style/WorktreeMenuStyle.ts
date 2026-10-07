import { style } from 'typestyle';

export const worktreeWrapperClass = style({
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)'
});

export const worktreePathClass = style({
  flex: '10 1 auto',
  fontSize: 'var(--jp-ui-font-size0)',
  color: 'var(--jp-ui-font-color2)',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  marginLeft: '4px'
});

export const worktreeStateClass = style({
  flex: '0 0 auto',
  fontSize: 'var(--jp-ui-font-size0)',
  color: 'var(--jp-ui-font-color2)',
  fontStyle: 'italic',
  marginLeft: '4px'
});

export const activeWorktreeDetailClass = style({
  color: 'inherit',
  opacity: 0.8
});

export const disabledListItemClass = style({
  opacity: 0.5,
  cursor: 'default'
});
