import { style } from 'typestyle';

export const sectionFileContainerStyle = style({
  flex: '1 1 auto',
  margin: '0',
  padding: '0',
  overflow: 'auto',

  $nest: {
    '& button:disabled': {
      opacity: 0.5
    }
  }
});

export const sectionFileContainerDisabledStyle = style({
  opacity: 0.5
});

export const sectionAreaStyle = style({
  flex: '0 0 auto',
  margin: '4px 0px',
  padding: '4px 1px 4px 4px',
  fontWeight: 600,
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
  letterSpacing: '1px',
  fontSize: '12px'
});

export const sectionHeaderLabelStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  flex: '1 1 auto',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  borderRadius: '2px',
  transition: 'background-color 0.1s ease',

  $nest: {
    '&:hover': {
      backgroundColor: '0'
    },
    '&:focus': {
      backgroundColor: '0'
    }
  }
});

export const changeStageButtonStyle = style({
  fontWeight: 600,
  backgroundColor: 'transparent',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '14px',
  transition: 'background-color 0.1s ease',
  borderRadius: '2px',
  height: '13px',
  width: '12px',
  border: 'none',
  outline: 'none',

  $nest: {
    '&:hover': {
      backgroundColor: 'none',
      outline: 'none'
    },
    '&:focus': {
      border: 'none',
      boxShadow: 'none',
      backgroundColor: 'none'
    }
  }
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
