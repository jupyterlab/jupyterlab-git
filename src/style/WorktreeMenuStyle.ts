import { style } from 'typestyle';

export const worktreeButtonWrapperClass = style({
  padding: '4px 11px 4px',
  display: 'flex',
  justifyContent: 'flex-end'
});

export const newWorktreeButtonClass = style({
  boxSizing: 'border-box',

  height: '2em',
  flex: '0 0 auto',

  padding: '0 8px',

  color: 'white',
  fontSize: 'var(--jp-ui-font-size1)',

  backgroundColor: 'var(--md-blue-500)',
  border: '0',
  borderRadius: '3px',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--md-blue-600)'
    },
    '&:active': {
      backgroundColor: 'var(--md-blue-700)'
    }
  }
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
