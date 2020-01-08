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

  borderBottomStyle: 'solid',
  borderBottomWidth: 'var(--jp-border-width)',
  borderBottomColor: 'var(--jp-border-color2)'
});

export const toolbarMenuWrapperClass = style({
  background: 'var(--jp-layout-color1)',

  borderBottomStyle: 'solid',
  borderBottomWidth: 'var(--jp-border-width)',
  borderBottomColor: 'var(--jp-border-color2)'
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
  color: 'var(--jp-ui-font-color0)',
  textAlign: 'left',

  border: 'none',
  borderRadius: 0,

  background: 'var(--jp-layout-color1)',

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
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    },
    '&:active': {
      backgroundColor: 'var(--jp-layout-color3)'
    }
  }
});

export const pullButtonClass = style({
  marginLeft: 'auto',

  background: 'var(--jp-layout-color1)',
  backgroundImage: 'var(--jp-icon-git-pull)',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});

export const pushButtonClass = style({
  background: 'var(--jp-layout-color1)',
  backgroundImage: 'var(--jp-icon-git-push)',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});

export const refreshButtonClass = style({
  marginRight: '4px',

  background: 'var(--jp-layout-color1)',
  backgroundImage: 'var(--jp-icon-refresh)',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});

export const repoIconClass = style({
  backgroundImage: 'var(--jp-icon-git-repo)',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});

export const branchIconClass = style({
  backgroundImage: 'var(--jp-icon-git-branch)',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});

export const openMenuIconClass = style({
  backgroundImage: 'var(--jp-icon-caretdown)',
  backgroundSize: '20px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});

export const closeMenuIconClass = style({
  backgroundImage: 'var(--jp-icon-caretup)',
  backgroundSize: '20px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});
