import { style, keyframes } from 'typestyle';

export const newBranchInputAreaStyle = style({
  verticalAlign: 'middle'
});

export const slideAnimation = keyframes({
  from: {
    width: '0',
    left: '0'
  },
  to: {
    width: '84px',
    left: '0'
  }
});

export const newBranchBoxStyle = style({
  width: '84px',
  height: '17px',
  boxSizing: 'border-box',
  margin: '0',
  padding: '2px',
  verticalAlign: 'middle',
  animationDuration: '0.5s',
  animationTimingFunction: 'ease-out',
  animationName: slideAnimation,
  outline: 'none',

  $nest: {
    '&:focus': {
      border: '1px var(--jp-brand-color2) solid'
    }
  }
});

export const buttonStyle = style({
  backgroundSize: '100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  width: '17px',
  height: '17px',
  verticalAlign: 'middle',
  outline: 'none',
  border: 'none'
});

export const newBranchButtonStyle = style({
  backgroundImage: 'var(--jp-icon-plus-white)',
  backgroundColor: 'var(--jp-brand-color1)'
});

export const cancelNewBranchButtonStyle = style({
  backgroundImage: 'var(--jp-icon-clear-white)',
  backgroundColor: 'var(--jp-layout-color4)'
});
