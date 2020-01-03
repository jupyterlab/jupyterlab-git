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
  borderBottomStyle: 'solid',
  borderBottomWidth: 'var(--jp-border-width)',
  borderBottomColor: 'var(--jp-border-color2)'
});

export const toolbarMenuButtonClass = style({
  boxSizing: 'border-box',
  width: '100%',

  padding: '4px 11px 4px',

  lineHeight: '1.5em',

  border: 'none',
  borderRadius: 0,

  textAlign: 'left',
  fontSize: 'var(--jp-ui-font-size1)',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    },
    '&:active': {
      backgroundColor: 'var(--jp-layout-color3)'
    }
  }
});

export const toolbarMenuButtonTitleClass = style({});

export const toolbarMenuButtonSubtitleClass = style({
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
  margin: 'auto 0 auto auto',

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

export const branchIconClass = style({
  background: 'var(--jp-layout-color1)',
  backgroundImage: 'var(--jp-icon-git-branch)',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});

export const refreshButtonClass = style({
  background: 'var(--jp-layout-color1)',
  backgroundImage: 'var(--jp-icon-refresh)',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});
