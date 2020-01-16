import { style } from 'typestyle';

// Toolbar styles

export const toolBarStyle = style({
  display: 'flex',
  flexDirection: 'row',
  backgroundColor: 'var(--jp-layout-color1)',
  lineHeight: 'var(--jp-private-running-item-height)',
  minHeight: '35px'
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

// Path styles

export const repoStyle = style({
  display: 'flex',
  flexDirection: 'row',
  margin: '4px 12px'
});

export const pinIconStyle = style({
  position: 'absolute',
  cursor: 'pointer',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  margin: '4px'
});

export const repoPinStyle = style({
  background: 'var(--jp-layout-color1)',
  position: 'relative',
  display: 'inline-block',
  width: '24px',
  height: '24px',
  flex: '0 0 auto',

  $nest: {
    input: {
      opacity: 0,
      height: 0,
      width: 0
    },

    'input:checked + span': {
      transform: 'rotate(-45deg)'
    },

    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    }
  }
});

export const repoPathStyle = style({
  flex: '1 1 auto',
  fontSize: 'var(--jp-ui-font-size1)',
  padding: '0px 4px 0px 4px',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
  lineHeight: '24px',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    }
  }
});

export const noRepoPathStyle = style({
  color: 'var(--jp-ui-font-color2)'
});

// Separator line style

export const separatorStyle = style({
  flex: '0 0 auto',
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)'
});
