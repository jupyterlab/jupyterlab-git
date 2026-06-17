import { style } from 'typestyle';
import type { NestedCSSProperties } from 'typestyle/lib/types';
import { hiddenButtonStyle, showButtonOnHover } from './ActionButtonStyle';

export const sectionAreaStyle = style(
  {
    cursor: 'pointer',
    minHeight: '24px',
    paddingRight: '4px !important',

    $nest: {
      '&:hover': {
        backgroundColor: 'var(--jp-layout-color2)'
      },
      '& .lm-AccordionPanel-titleLabel': {
        userSelect: 'none'
      }
    }
  },
  showButtonOnHover
);

export const sectionFileContainerStyle = style(
  (() => {
    const styled: NestedCSSProperties = {
      margin: '0',
      padding: '0',
      overflow: 'auto',
      $nest: {}
    };

    const focus = `&:focus-within .${sectionAreaStyle} .${hiddenButtonStyle}`;
    styled.$nest![focus] = {
      display: 'block'
    };
    const hoverSelector = `&:hover .${sectionAreaStyle} .${hiddenButtonStyle}`;
    styled.$nest![hoverSelector] = {
      display: 'block'
    };
    return styled;
  })()
);

export const sectionHeaderLabelStyle = style({
  flex: '1 1 auto',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  userSelect: 'none'
});

export const sectionHeaderSizeStyle = style({
  flex: '0 0 auto',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '18px',
  height: '16px',
  padding: '0 6px',
  marginLeft: '4px',

  fontSize: 'var(--jp-ui-font-size0)',
  fontWeight: 600,
  lineHeight: 1,
  letterSpacing: 0,
  whiteSpace: 'nowrap',

  color: 'var(--jp-ui-inverse-font-color0)',
  backgroundColor: 'var(--jp-layout-color3)',
  borderRadius: '10px'
});

export const changeStageButtonStyle = style({
  flex: '0 0 auto',
  backgroundColor: 'transparent',
  border: 'none',
  outline: 'none',
  padding: 0,
  margin: 0,
  height: '16px',
  cursor: 'pointer'
});

export const sectionHeaderActionsStyle = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  flex: '0 0 auto',
  height: '100%'
});
