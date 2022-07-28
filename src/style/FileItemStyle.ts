import { style } from 'typestyle';
import { NestedCSSProperties } from 'typestyle/lib/types';
import { actionButtonStyle, showButtonOnHover } from './ActionButtonStyle';

export const fileStyle = style(
  {
    userSelect: 'none',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    boxSizing: 'border-box',
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

export const selectedFileStyle = style(
  (() => {
    const styled: NestedCSSProperties = {
      color: 'white',
      background: 'var(--jp-brand-color1)',

      $nest: {
        '&:hover': {
          color: 'white',
          background: 'var(--jp-brand-color1) !important'
        },
        '&:hover .jp-icon-selectable[fill]': {
          fill: 'white'
        },
        '&:hover .jp-icon-selectable[stroke]': {
          stroke: 'white'
        },
        '& .jp-icon-selectable[fill]': {
          fill: 'white'
        },
        '& .jp-icon-selectable-inverse[fill]': {
          fill: 'var(--jp-brand-color1)'
        }
      }
    };

    styled.$nest[`& .${actionButtonStyle}:active`] = {
      backgroundColor: 'var(--jp-brand-color1)'
    };

    styled.$nest[`& .${actionButtonStyle}:hover`] = {
      backgroundColor: 'var(--jp-brand-color1)'
    };

    return styled;
  })()
);

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

export const fileChangedLabelWarnStyle = style({
  color: 'var(--jp-warn-color0)',
  fontWeight: 'bold'
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

export const gitMarkBoxStyle = style({
  flex: '0 0 auto'
});

export const checkboxLabelStyle = style({
  display: 'flex',
  alignItems: 'center'
});

export const checkboxLabelContainerStyle = style({
  display: 'flex',
  width: '100%'
});

export const checkboxLabelLastContainerStyle = style({
  display: 'flex',
  marginLeft: 'auto'
});
