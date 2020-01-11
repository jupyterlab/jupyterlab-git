import { style } from 'typestyle';

export const fileStyle = style({
  display: 'flex',
  flexDirection: 'row',
  color: 'var(--jp-ui-font-color1)',
  lineHeight: 'var(--jp-private-running-item-height)',
  paddingLeft: '4px',
  listStyleType: 'none',

  $nest: {
    '&:hover': {
      backgroundColor: 'rgba(153,153,153,.1)'
    },
    '&:hover .jp-Git-button': {
      visibility: 'visible'
    }
  }
});

export const selectedFileStyle = style({
  color: 'white',
  background: 'var(--jp-brand-color1)',

  $nest: {
    '&:hover': {
      color: 'white',
      background: 'var(--jp-brand-color1) !important'
    },
    '&:hover .jp-Git-button .jp-icon3[fill]': {
      fill: 'var(--jp-layout-color2)'
    },
    '&:hover .jp-Git-button .jp-icon3[stroke]': {
      stroke: 'var(--jp-layout-color2)'
    }
  }
});

export const expandedFileStyle = style({
  height: '75px'
});

export const disabledFileStyle = style({
  opacity: 0.5
});

export const fileIconStyle = style({
  flex: '0 0 auto',
  padding: '0px 8px',
  marginRight: '4px',
  verticalAlign: 'baseline',
  backgroundSize: '16px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
});

export const fileLabelStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  flex: '1 1 auto',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  borderRadius: '2px',
  transition: 'background-color 0.1s ease',

  $nest: {
    '&:focus': {
      backgroundColor: 'var(--jp-layout-color3)'
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
  visibility: 'hidden',
  display: 'inline'
});

export const fileItemButtonStyle = style({
  flex: '0 0 auto',
  background: 'none',
  lineHeight: '0px',
  padding: '0px 4px',
  width: '16px',
  border: 'none',
  outline: 'none',
  visibility: 'hidden',

  $nest: {
    '&:hover': {
      outline: 'none',
      visibility: 'visible'
    }
  }
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
