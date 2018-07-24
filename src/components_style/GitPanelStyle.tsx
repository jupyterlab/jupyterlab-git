import { style } from 'typestyle';

export const gitContainerStyle = style({
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  height: '100%'
});

export const gitPushedContentStyle = style({
  position: 'relative',
  left: '50px',
  '-webkit-transition': 'all 0.5s ease',
  '-moz-transition': 'all 0.5s ease',
  transition: 'all 0.5s ease',
  width: 'calc(100% - 50px)'
});
