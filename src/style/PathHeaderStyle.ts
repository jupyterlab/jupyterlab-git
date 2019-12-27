import { style, classes } from 'typestyle';
import { toolbarButtonStyle } from './common';

export const repoStyle = style({
  display: 'flex',
  flexDirection: 'row',
  backgroundColor: 'var(--jp-layout-color1)',
  lineHeight: 'var(--jp-private-running-item-height)',
  minHeight: '35px'
});

export const repoPathStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  marginRight: '4px',
  paddingLeft: '4px',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
  lineHeight: '33px'
});

export const refreshIcon = style({
  backgroundImage: 'var(--jp-icon-refresh)'
});
export const repoRefreshStyle = classes(toolbarButtonStyle, refreshIcon);

export const pushIcon = style({
  backgroundImage: 'var(--jp-icon-git-push)'
});
export const gitPushStyle = classes(toolbarButtonStyle, pushIcon);

export const pullIcon = style({
  backgroundImage: 'var(--jp-icon-git-pull)'
});
export const gitPullStyle = classes(toolbarButtonStyle, pullIcon);
