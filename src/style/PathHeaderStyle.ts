import { style } from 'typestyle';

export const pinIconStyle = style({
  position: 'absolute',
  cursor: 'pointer',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0
});

export const repoStyle = style({
  display: 'flex',
  flexDirection: 'row',
  backgroundColor: 'var(--jp-layout-color1)',
  lineHeight: 'var(--jp-private-running-item-height)',
  minHeight: '35px'
});

export const repoPinStyle = style({
  background: 'var(--jp-layout-color1)',
  position: 'relative',
  display: 'inline-block',
  width: '24px',
  height: '24px',
  margin: 'auto 5px auto 5px',

  $nest: {
    input: {
      opacity: 0,
      height: 0,
      width: 0,

      $nest: {
        '&:checked': {
          opacity: 10
        }
      }
    },

    'input:checked + svg': {
      fill: 'var(--jp-brand-color1)'
    },

    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    }
  }
  // // width: 'var(--jp-private-running-button-width)',

  // border: 'none',
  // boxSizing: 'border-box',
  // outline: 'none',
  // // padding: '0px 6px',

  // $nest: {
  //   '&:active': {
  //     backgroundColor: 'var(--jp-layout-color3)'
  //   }
  // }
});

export const repoPinnedStyle = style({
  $nest: {
    '.jp-icon3': {
      fill: 'var(--jp-brand-color1)'
    }
  }
});

export const repoPathStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  marginRight: '4px',
  paddingLeft: '4px',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
  lineHeight: '33px',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    }
  }
});

export const repoRefreshStyle = style({
  width: 'var(--jp-private-running-button-width)',
  background: 'var(--jp-layout-color1)',
  border: 'none',
  backgroundImage: 'var(--jp-icon-refresh)',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  boxSizing: 'border-box',
  outline: 'none',
  padding: '0px 6px',
  margin: 'auto 5px auto 5px',
  height: '24px',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    },
    '&:active': {
      backgroundColor: 'var(--jp-layout-color3)'
    }
  }
});

export const gitPushStyle = style({
  width: 'var(--jp-private-running-button-width)',
  background: 'var(--jp-layout-color1)',
  border: 'none',
  backgroundImage: 'var(--jp-icon-git-push)',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  boxSizing: 'border-box',
  outline: 'none',
  padding: '0px 6px',
  margin: 'auto 5px auto 5px',
  height: '24px',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    },
    '&:active': {
      backgroundColor: 'var(--jp-layout-color3)'
    }
  }
});

export const gitPullStyle = style({
  width: 'var(--jp-private-running-button-width)',
  background: 'var(--jp-layout-color1)',
  border: 'none',
  backgroundImage: 'var(--jp-icon-git-pull)',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  boxSizing: 'border-box',
  outline: 'none',
  padding: '0px 6px',
  margin: 'auto 5px auto auto',
  height: '24px',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    },
    '&:active': {
      backgroundColor: 'var(--jp-layout-color3)'
    }
  }
});
