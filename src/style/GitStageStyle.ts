import { style } from 'typestyle';

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

export const sectionAreaStyle = style({
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
    },
    '&:hover .jp-Git-button': {
      display: 'block'
    }
  }
});

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
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '14px',
  transition: 'background-color 0.1s ease',
  height: '13px',
  width: '12px',
  border: 'none',
  outline: 'none'
});

export const discardFileButtonStyle = style({
  backgroundImage: 'var(--jp-icon-discard-file)',
  marginLeft: '6px',
  paddingRight: '1px'
});

export const diffFileButtonStyle = style({
  backgroundImage: 'var(--jp-icon-diff)',
  paddingLeft: '0px'
});

export const caretdownImageStyle = style({
  backgroundImage: 'var(--jp-image-caretdown)'
});

export const caretrightImageStyle = style({
  backgroundImage: 'var(--jp-image-caretright)'
});
