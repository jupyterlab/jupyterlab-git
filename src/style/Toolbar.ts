import { style } from 'typestyle';

export const toolbarClass = style({
  display: 'flex',
  flexDirection: 'row',

  minHeight: '35px',
  lineHeight: 'var(--jp-private-running-item-height)',

  backgroundColor: 'var(--jp-layout-color1)'
});

export const repoPathClass = style({
  marginRight: '4px',
  paddingLeft: '4px',

  lineHeight: '33px',
  verticalAlign: 'middle',

  overflow: 'hidden',

  fontSize: 'var(--jp-ui-font-size1)',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
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

export const branchButtonClass = style({
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
