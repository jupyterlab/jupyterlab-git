import { style } from 'typestyle';
import type { NestedCSSProperties } from 'typestyle/lib/types';
import { actionButtonStyle, showButtonOnHover } from './ActionButtonStyle';

// Status indicator: a colored, bold monospace letter showing the git
// status code. The 10 + 18 + 6 = 34px total footprint matches the
// section header count chip so row action buttons align with header
// buttons; the 18px inline-flex slot keeps every letter in the same
// vertical column regardless of glyph width.
export const fileChangedLabelStyle = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '18px',
  height: '18px',
  marginLeft: '10px',
  marginRight: '6px',
  fontFamily: 'var(--jp-code-font-family)',
  fontSize: 'var(--jp-ui-font-size0)',
  fontWeight: 600
});

// Semantic per-status color overrides applied on top of the base badge.
export const fileChangedLabelAddedStyle = style({
  color: 'var(--jp-success-color1)'
});

export const fileChangedLabelDeletedStyle = style({
  color: 'var(--jp-error-color1)'
});

export const fileChangedLabelModifiedStyle = style({
  color: 'var(--jp-warn-color1)'
});

export const fileChangedLabelInfoStyle = style({
  color: 'var(--jp-info-color1)'
});

export const selectedFileChangedLabelStyle = style({
  color: 'white !important'
});

export const fileStyle = style(
  {
    userSelect: 'none',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    boxSizing: 'border-box',
    color: 'var(--jp-ui-font-color1)',
    cursor: 'pointer',
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

    styled.$nest![`& .${actionButtonStyle}:active`] = {
      backgroundColor: 'var(--jp-brand-color1)'
    };

    styled.$nest![`& .${actionButtonStyle}:hover`] = {
      backgroundColor: 'var(--jp-brand-color1)'
    };

    return styled;
  })()
);

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
  marginLeft: 'auto',
  // Don't shrink so long file names truncate instead of clipping the status.
  flexShrink: 0,
  overflow: 'hidden'
});
