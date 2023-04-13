import { style } from 'typestyle';

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
