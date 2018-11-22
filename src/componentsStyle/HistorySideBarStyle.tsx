import { style } from 'typestyle';

export const historySideBarStyle = style({
  height: '100vh',
  visibility: 'hidden',
  width: '0px',
  opacity: 0,
  backgroundColor: 'var(--jp-layout-color2)',
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
