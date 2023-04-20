import { style } from 'typestyle';

export const imageDiffWidgetClass = style({
  overflow: 'visible'
});

export const labelsClass = style({
  display: 'flex',
  alignItems: 'center'
});

export const referenceLabelClass = style({
  color: 'var(--jp-ui-font-color1)',
  fontWeight: 'bold',
  backgroundColor: 'var(--jp-diff-deleted-color0)',
  padding: '3px',
  paddingRight: '7px',
  flexGrow: 1,
  maxWidth: '50%',
  overflow: 'hidden'
});

export const challengerLabelClass = style({
  color: 'var(--jp-ui-font-color1)',
  fontWeight: 'bold',
  backgroundColor: 'var(--jp-diff-added-color0)',
  padding: '3px',
  paddingRight: '7px',
  flexGrow: 1,
  maxWidth: '50%',
  overflow: 'hidden'
});

export const tabsClass = style({
  borderTop: '1px solid var(--jp-border-color2)',
  color: 'var(--jp-ui-font-color1)'
});

export const tabClass = style({
  minHeight: '15px',

  borderBottom:
    'var(--jp-border-width) solid var(--jp-border-color3)!important',
  borderRight: 'var(--jp-border-width) solid var(--jp-border-color3)!important',

  $nest: {
    span: {
      textTransform: 'none'
    }
  }
});

export const tabIndicatorClass = style({
  height: '2px!important',
  top: '0!important',
  bottom: 'unset!important',
  backgroundColor: 'var(--jp-brand-color1)!important',
  transition: 'none!important'
});

export const twoUpView = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-evenly',
  gap: '5px',
  padding: '0px 8px!important',
  overflow: 'scroll'
});

export const imageCol = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  color: 'var(--jp-ui-font-color2)'
});

export const emptyRefImage = style({
  backgroundImage:
    'repeating-linear-gradient(-45deg, var(--jp-diff-deleted-color1), var(--jp-diff-deleted-color1) 3px, transparent 3px, transparent 10px)'
});

export const emptyChallImage = style({
  backgroundImage:
    'repeating-linear-gradient(-45deg, var(--jp-diff-added-color1), var(--jp-diff-added-color1) 3px, transparent 3px, transparent 10px)'
});

export const referenceImageClass = style({
  width: 'auto',
  maxHeight: '500px!important',
  border: '5px solid var(--jp-diff-deleted-color0)',
  maxWidth: '400px!important'
});

export const challengerImageClass = style({
  width: 'auto',
  maxHeight: '500px',
  border: '5px solid var(--jp-diff-added-color0)',
  maxWidth: '400px'
});

export const slider = style({
  padding: '5px 0',
  margin: '0px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '8px'
});

export const sliderReferenceCircle = style({
  color: 'var(--jp-diff-deleted-color0)'
});

export const sliderChallengerCircle = style({
  color: 'var(--jp-diff-added-color0)'
});

export const swipeContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  overflowX: 'scroll',
  padding: '0px 40px'
});

export const swipeBackground = style({
  position: 'relative',
  width: '100%',
  height: '510px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

export const swipeImage = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  opacity: 1,
  margin: 'auto',
  height: '500px',
  width: 'auto',
  maxWidth: '800px',
  objectFit: 'scale-down'
});

export const swipeReferenceImage = style({
  border: '5px solid var(--jp-diff-deleted-color0)'
});

export const swipeChallengerImage = style({
  border: '5px solid var(--jp-diff-added-color0)'
});

export const onionSkinContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  overflow: 'scroll',
  padding: '0px 10px'
});

export const onionSkinImageContainer = style({
  position: 'relative',
  height: '510px',
  width: '100%'
});

export const onionSkinImage = style({
  width: 'auto',
  height: '500px',
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  margin: 'auto',
  maxWidth: '800px',
  objectFit: 'scale-down',
  backgroundColor: 'var(--jp-layout-color0)'
});

export const onionSkinReferenceImage = style({
  opacity: 1,
  border: '5px solid var(--jp-diff-deleted-color0)'
});

export const onionSkinChallengerImage = style({
  opacity: 0,
  border: '5px solid var(--jp-diff-added-color0)'
});
