import { style } from 'typestyle';

export const toolbarButtonStyle = style({
  width: 'var(--jp-private-running-button-width)',
  background: 'var(--jp-layout-color1)',
  border: 'none',
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
