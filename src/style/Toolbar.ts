import { style } from 'typestyle';

export const toolbarClass = style({
  display: 'flex',
  flexDirection: 'column',

  backgroundColor: 'var(--jp-layout-color1)',
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)'
});

export const toolbarNavClass = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'nowrap',

  padding: '4px 8px',
  gap: '6px',

  fontSize: 'var(--jp-ui-font-size1)',
  color: 'var(--jp-ui-font-color1)',
  backgroundColor: 'var(--jp-layout-color1)'
});

export const repoBranchColumnClass = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  flex: '0 1 auto',
  minWidth: 0,
  gap: '2px'
});

export const toolbarMenuWrapperClass = style({
  background: 'var(--jp-layout-color1)',
  borderTop: 'var(--jp-border-width) solid var(--jp-border-color2)'
});

export const repoButtonLabelClass = style({
  flex: '0 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
});

export const repoLabelClass = style({
  display: 'inline-flex',
  alignItems: 'center',
  flex: '0 1 auto',
  minWidth: 0,
  gap: '6px',
  height: '24px',
  padding: '0 4px',

  fontWeight: 600,

  $nest: {
    '& > span.jp-Icon': {
      width: '14px',
      height: '14px',
      flex: '0 0 auto'
    }
  }
});

export const repoButtonClass = style({
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  flex: '0 1 auto',
  minWidth: 0,
  gap: '4px',

  height: '24px',
  padding: '0 6px',

  fontSize: 'var(--jp-ui-font-size1)',
  fontWeight: 600,
  color: 'var(--jp-ui-font-color1)',

  border: 'none',
  borderRadius: '3px',
  background: 'transparent',
  cursor: 'pointer',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    },
    '&:active': {
      backgroundColor: 'var(--jp-layout-color3)'
    },
    '&:focus-visible': {
      outline: '2px solid var(--jp-brand-color1)',
      outlineOffset: '-2px'
    },
    '& > span.jp-Icon': {
      width: '14px',
      height: '14px',
      flex: '0 0 auto'
    }
  }
});

export const branchInfoClass = style({
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  flex: '0 1 auto',
  minWidth: 0,
  gap: '4px',

  height: '18px',
  padding: '0 6px',

  fontSize: 'var(--jp-ui-font-size0)',
  color: 'var(--jp-ui-font-color1)',

  borderRadius: '9px',
  background: 'var(--jp-layout-color2)',

  $nest: {
    '& > span.jp-Icon': {
      width: '12px',
      height: '12px',
      flex: '0 0 auto'
    }
  }
});

export const branchNameClass = style({
  flex: '0 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 600
});

export const branchWarningButtonClass = style({
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  maxWidth: '100%',
  height: '18px',
  padding: '0 6px',
  fontSize: 'var(--jp-ui-font-size0)',
  color: 'var(--jp-warn-color2)',
  border: '1px solid var(--jp-warn-color1)',
  borderRadius: '9px',
  background: 'var(--jp-layout-color2)',
  cursor: 'pointer',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color3)'
    },
    '&:focus-visible': {
      outline: '2px solid var(--jp-brand-color1)',
      outlineOffset: '-2px'
    },
    '& svg': {
      width: '12px',
      height: '12px',
      flex: '0 0 auto'
    }
  }
});

export const branchWarningTextClass = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 600
});

export const toolbarButtonClass = style({
  boxSizing: 'border-box',
  height: '24px',
  width: 'var(--jp-private-running-button-width) !important',

  margin: '0 !important',
  padding: '0px 6px !important',

  $nest: {
    '& span': {
      margin: 'auto',
      width: '16px'
    },
    '&:focus-visible': {
      outline: '2px solid var(--jp-brand-color1)',
      outlineOffset: '-2px'
    }
  }
});

export const spacer = style({
  flex: '1 1 auto'
});

export const badgeClass = style({
  $nest: {
    '& > .MuiBadge-badge': {
      top: 8,
      right: 5,
      backgroundColor: 'var(--jp-warn-color1)'
    }
  }
});
