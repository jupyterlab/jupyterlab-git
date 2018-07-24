import { style } from 'typestyle';

export const historySideBarStyle = style({
  height: '100vh',
  visibility: 'hidden',
  width: '0px',
  opacity: 0,
  position: 'fixed',
  backgroundColor: 'var(--jp-layout-color2)',
  transition: 'width 0.5s ease, visibility 0.5s ease, opacity 0.5s ease',
  '-webkit-transition': 'width 0.5s ease, visibility 0.5s ease, opacity 0.5s ease',
  '-moz-transition': 'width 0.5s ease, visibility 0.5s ease, opacity 0.5s ease',
  left: '33px',
  top: '70px',

  $nest: {
    '&:first-child': {
      paddingTop: '14px'
    }
  }
});

export const historySideBarExpandedStyle = style({
  width: '50px',
  visibility: 'visible',
  opacity: 1
});