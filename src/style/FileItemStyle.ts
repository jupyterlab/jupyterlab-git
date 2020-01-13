import { style } from 'typestyle';
import { showButtonOnHover } from './ActionButtonStyle';

export const fileStyle = style(
  {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    color: 'var(--jp-ui-font-color1)',
    lineHeight: 'var(--jp-private-running-item-height)',
    padding: '0px 4px',
    listStyleType: 'none',

    $nest: {
      '&:hover': {
        backgroundColor: 'var(--jp-layout-color2)'
      }
    }
  },
  showButtonOnHover
);

export const selectedFileStyle = style({
  color: 'white',
  background: 'var(--jp-brand-color1)',

  $nest: {
    '&:hover': {
      color: 'white',
      background: 'var(--jp-brand-color1) !important'
    },
    '&:hover .jp-icon3[fill]': {
      fill: 'var(--jp-layout-color2)'
    },
    '&:hover .jp-icon3[stroke]': {
      stroke: 'var(--jp-layout-color2)'
    }
  }
});

export const fileChangedLabelStyle = style({
  fontSize: '10px',
  marginLeft: '5px'
});

export const selectedFileChangedLabelStyle = style({
  color: 'white !important'
});

export const fileChangedLabelBrandStyle = style({
  color: 'var(--jp-brand-color0)'
});

export const fileChangedLabelInfoStyle = style({
  color: 'var(--jp-info-color0)'
});

export const fileGitButtonStyle = style({
  display: 'none'
});

export const fileButtonStyle = style({
  marginTop: '5px'
});

export const discardButtonStyle = style({
  color: 'white'
});

export const discardFileButtonSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-discard-file-selected)',
  marginLeft: '6px'
});
