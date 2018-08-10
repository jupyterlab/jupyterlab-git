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
  fontSize: 'var(--jp-ui-font-size)',
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
  margin: '0px 2px',
  fontWeight: 600,
  backgroundColor: 'transparent',
  lineHeight: 'var(--jp-private-running-shutdown-button-height)',
  transition: 'background-color 0.1s ease',
  borderRadius: '2px',
  height: '12px',
  width: '12px',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
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

export function discardFileButtonStyle(isLight: string) {
  if(isLight === 'true') {
    return style({
      backgroundImage: 'var(--jp-icon-discard-file)',
      marginLeft: '6px',
      backgroundSize: '120%'
    });
  } else {
    return style({
      backgroundImage: 'var(--jp-icon-discard-file-white)',
      marginLeft: '6px',
      backgroundSize: '120%'
    });
  }
}

export const discardAllWarningStyle = style({
  height: '40px !important',

  $nest: {
    '& button': {
      marginTop: '5px'
    }
  }
});

export const caretdownImageStyle = style({
  backgroundImage: 'var(--jp-image-caretdown)'
});

export const caretrightImageStyle = style({
  backgroundImage: 'var(--jp-image-caretright)'
});

export const changeStageButtonLeftStyle = style({
  float: 'left'
});
