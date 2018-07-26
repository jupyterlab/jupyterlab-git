import { style, keyframes } from 'typestyle';

export const newBranchInputAreaStyle = style({
  display: 'inline-block',
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
  height: '13px',
  margin: '0',
  padding: '0',
  verticalAlign: 'middle',
  animationDuration: '0.5s',
  animationTimingFunction: 'ease-out',
  animationName: slideAnimation
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
  backgroundColor: 'var(--jp-icon-brand-color1)'
});

export const cancelNewBranchButtonStyle = style({
  backgroundImage: 'var(--jp-clear-white)',
  backgroundColor: 'var(--jp-layout-color4)'
});
