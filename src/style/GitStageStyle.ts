import { style } from 'typestyle';
import { showButtonOnHover } from './ActionButtonStyle';

export const sectionFileContainerStyle = style({
  margin: '0',
  padding: '0',
  overflow: 'auto',

  $nest: {
    '& button:disabled': {
      opacity: 0.5
    }
  }
});

export const sectionAreaStyle = style(
  {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    margin: '4px 0px',
    padding: '4px',
    fontWeight: 600,
    borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
    letterSpacing: '1px',
    fontSize: '12px',

    $nest: {
      '&:hover': {
        backgroundColor: 'var(--jp-layout-color2)'
      }
    }
  },
  showButtonOnHover
);

export const sectionHeaderLabelStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  flex: '1 1 auto',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap'
});

export const sectionHeaderSizeStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  flex: '0 0 auto',
  whiteSpace: 'nowrap',
  borderRadius: '2px'
});

export const changeStageButtonStyle = style({
  flex: '0 0 auto',
  backgroundColor: 'transparent',
  height: '13px',
  width: '12px',
  border: 'none',
  outline: 'none',
  paddingLeft: '0px'
});
