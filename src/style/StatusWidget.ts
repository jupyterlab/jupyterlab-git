import { keyframes, style } from 'typestyle';

const fillAnimation = keyframes({
  to: { fillOpacity: 1 }
});

export const statusIconClass = style({
  $nest: {
    '& .jp-icon3': {
      animationName: fillAnimation,
      animationDuration: '1s'
    }
  }
});

const pathAnimation = keyframes({
  '0%': { fillOpacity: 1 },
  '50%': { fillOpacity: 0.6 },
  '100%': { fillOpacity: 1 }
});

export const statusAnimatedIconClass = style({
  $nest: {
    '& .jp-icon3': {
      animationName: pathAnimation,
      animationDuration: '2s',
      animationIterationCount: 'infinite'
    }
  }
});

export const badgeClass = style({
  $nest: {
    '& > .MuiBadge-badge': {
      top: 6,
      right: 15,
      backgroundColor: 'var(--jp-warn-color1)'
    }
  }
});

export const currentBranchNameClass = style({
  fontSize: 'var(--jp-ui-font-size1)',
  lineHeight: '100%'
});
