import { style } from 'typestyle';

export const branchMenuWrapperClass = style({
  marginTop: '6px',
  marginBottom: '10px'
});

export const branchMenuFilterClass = style({
  padding: '4px 11px 4px'
});

export const branchMenuFilterInputClass = style({
  boxSizing: 'border-box',
  width: 'calc(100% - 7.7em - 11px)', // full_width - button_width - right_margin
  height: '2em',

  marginRight: '11px',
  padding: '1px 7px 2px',

  color: 'var(--jp-ui-font-color0)',
  fontSize: 'var(--jp-ui-font-size1)',
  fontWeight: 300,

  borderRadius: '3px',
  border: 'var(--jp-border-width) solid var(--jp-border-color2)'
});

export const branchMenuFilterClearClass = style({});

export const branchMenuNewBranchButtonClass = style({
  boxSizing: 'border-box',
  width: '7.7em',
  height: '2em',

  color: 'white',
  fontSize: 'var(--jp-ui-font-size1)',

  backgroundColor: 'var(--jp-brand-color1)',
  border: '0',
  borderRadius: '3px'
});

export const branchMenuListWrapperClass = style({
  display: 'block',
  width: '100%'
});
