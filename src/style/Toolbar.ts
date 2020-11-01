import { style } from 'typestyle';

export const toolbarClass = style({
  display: 'flex',
  flexDirection: 'column',

  backgroundColor: 'var(--jp-layout-color1)'
});

export const toolbarNavClass = style({
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',

  minHeight: '35px',
  lineHeight: 'var(--jp-private-running-item-height)',

  backgroundColor: 'var(--jp-layout-color1)',

  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)'
});

export const toolbarMenuWrapperClass = style({
  background: 'var(--jp-layout-color1)'
});

export const toolbarMenuButtonClass = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',

  width: '100%',
  minHeight: '50px',

  /* top | right | bottom | left */
  padding: '4px 11px 4px 11px',

  fontSize: 'var(--jp-ui-font-size1)',
  lineHeight: '1.5em',
  color: 'var(--jp-ui-font-color1)',
  textAlign: 'left',

  border: 'none',
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
  borderRadius: 0,

  background: 'var(--jp-layout-color1)'
});

export const toolbarMenuButtonEnabledClass = style({
  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    },
    '&:active': {
      backgroundColor: 'var(--jp-layout-color3)'
    }
  }
});

export const toolbarMenuButtonIconClass = style({
  width: '16px',
  height: '16px',

  /* top | right | bottom | left */
  margin: 'auto 8px auto 0'
});

export const toolbarMenuButtonTitleWrapperClass = style({
  flexBasis: 0,
  flexGrow: 1,

  marginTop: 'auto',
  marginBottom: 'auto',
  marginRight: 'auto'
});

export const toolbarMenuButtonTitleClass = style({});

export const toolbarMenuButtonSubtitleClass = style({
  marginBottom: 'auto',

  fontWeight: 700
});

export const toolbarButtonClass = style({
  boxSizing: 'border-box',
  height: '24px',
  width: 'var(--jp-private-running-button-width)',

  margin: 'auto 0 auto 0',
  padding: '0px 6px',

  border: 'none',
  outline: 'none',

  $nest: {
    '&:disabled': {
      opacity: 0.4,
      background: 'none',
      cursor: 'not-allowed'
    },

    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    },
    '&:active': {
      backgroundColor: 'var(--jp-layout-color3)'
    },

    '& span': {
      // Set icon width and centers it
      margin: 'auto',
      width: '16px'
    }
  }
});

export const spacer = style({
  flex: '1 1 auto'
});

export const badgeClass = style({
  $nest: {
    '& > .MuiBadge-badge': {
      top: 12,
      right: 15,
      backgroundColor: 'var(--jp-warn-color1)'
    }
  }
});
