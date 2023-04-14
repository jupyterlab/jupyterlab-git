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
  backgroundColor: 'var(--jp-git-diff-deleted-color)',
  padding: '3px',
  paddingRight: '7px',
  flexGrow: 1,
  maxWidth: '50%',
  overflow: 'hidden'
});

export const challengerLabelClass = style({
  color: 'var(--jp-ui-font-color1)',
  fontWeight: 'bold',
  backgroundColor: 'var(--jp-git-diff-added-color)',
  padding: '3px',
  paddingRight: '7px',
  flexGrow: 1,
  maxWidth: '50%',
  overflow: 'hidden'
});

export const tabsClass = style({
  borderTop: '1px solid var(--jp-border-color2)'
});

export const tabClass = style({
  minHeight: '15px',

  backgroundColor: 'var(--jp-layout-color2)!important',

  borderBottom:
    'var(--jp-border-width) solid var(--jp-border-color2)!important',
  borderRight: 'var(--jp-border-width) solid var(--jp-border-color2)!important',

  $nest: {
    span: {
      textTransform: 'none'
    }
  }
});

export const selectedTabClass = style({
  backgroundColor: 'var(--jp-layout-color1)!important'
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
  padding: '0px 8px!important'
});

export const imageCol = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  color: 'var(--jp-ui-font-color2)'
});

export const referenceImageClass = style({
  width: 'auto',
  maxHeight: '500px',
  border: '3px solid var(--jp-git-diff-deleted-color1)',
  overflow: 'scroll'
});

export const challengerImageClass = style({
  width: 'auto',
  maxHeight: '500px',
  border: '3px solid var(--jp-git-diff-added-color1)',
  overflow: 'scroll'
});

export const onionSkinContainer = style({
  width: '100%'
});

export const onionSkinImageContainer = style({
  position: 'relative',
  width: '100%',
  height: '500px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

export const onionSkinImage = style({
  width: 'auto',
  height: '500px',
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  opacity: 1,
  margin: 'auto',
  overflow: 'scroll'
});

export const onionSkinReferenceImage = style({
  opacity: 1
});

export const onionSkinChallengerImage = style({
  opacity: 0
});

export const onionSkinSlider = style({
  padding: '5px 0',
  margin: '0px 20px',
  opacity: 1
});
