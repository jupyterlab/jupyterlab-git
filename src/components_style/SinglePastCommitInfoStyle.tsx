import { style } from 'typestyle';

export const commitStyle = style({
  flex: '0 0 auto',
  width: '100%',
  paddingLeft: '10px',
  fontSize: '12px',
  marginBottom: '10px'
});

export const headerStyle = style({
  backgroundColor: 'var(--md-green-500)',
  color: 'white',
  display: 'inline-block',
  width: '100%',
  height: '30px'
});

export const commitNumberLabelStyle = style({
  float: 'right',
  paddingRight: '19px',
  fontWeight: 'bold',
  display: 'inline-block'
});

export const commitAuthorLabelStyle = style({
  fontSize: '10px'
});

export const commitAuthorIconStyle = style({
  backgroundImage: 'var(--jp-Git-icon-author)',
  display: 'inline-block',
  height: '9px',
  width: '9px'
});

export const commitLabelDateStyle = style({
  fontSize: '13px',
  display: 'inline-block'
});

export const commitLabelMessageStyle = style({
  fontSize: '13px',
  textAlign: 'left',
  paddingRight: '10px'
});

export const commitOverviewNumbers = style({
  fontSize: '13px',
  fontWeight: 'bold',
  paddingTop: '5px',
  $nest: {
    '& span': {
      marginLeft: '5px'
    },
    '& span:nth-of-type(1)': {
      marginLeft: '0px'
    }
  }
});

export const commitDetailStyle = style({
  flex: '1 1 auto',
  margin: '0',
  paddingLeft: '10px',
  overflow: 'auto'
});

export const commitDetailHeader = style({
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
  fontSize: '13px',
  fontWeight: 'bold'
});

export const commitDetailFileStyle = style({
  display: 'flex',
  flexDirection: 'row',
  color: 'var(--jp-ui-font-color1)',
  height: 'var(--jp-private-running-item-height)',
  lineHeight: 'var(--jp-private-running-item-height)',
  whiteSpace: 'nowrap'
});

export const commitDetailFilePathStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  flex: '1 1 auto',
  marginRight: '4px',
  paddingLeft: '4px',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  borderRadius: '2px',
  transition: 'background-color 0.1s ease'
});

export const iconStyle = style({
  display: 'inline-block',
  width: '20px',
  height: '13px',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '15px',
  right: '10px'
});

export const numberofChangedFilesStyle = style({
  backgroundImage: 'var(--jp-icon-file)'
});

export function insertionIconStyle(isLight: string) {
  if (isLight === 'true') {
    return style({
      backgroundImage: 'var(--jp-icon-insertions-made)'
    });
  } else {
    return style({
      backgroundImage: 'var(--jp-icon-insertions-made-white)'
    });
  }
}

export function deletionIconStyle(isLight: string) {
  if (isLight === 'true') {
    return style({
      backgroundImage: 'var(--jp-icon-deletions-made)'
    });
  } else {
    return style({
      backgroundImage: 'var(--jp-icon-deletions-made-white)'
    });
  }
}

export function revertButtonStyle(isLight: string) {
  if (isLight === 'true') {
    return style({
      backgroundImage: 'var(--jp-icon-rewind)',
      marginLeft: '6px',
      backgroundSize: '120%'
    });
  } else {
    return style({
      backgroundImage: 'var(--jp-icon-rewind-white)',
      marginLeft: '6px',
      backgroundSize: '120%'
    });
  }
}

export const numberOfDeletionsStyle = style({
  position: 'absolute',
  right: '12px',
  width: '15px',
  marginTop: '1px'
});

export const numberOfInsertionsStyle = style({
  position: 'absolute',
  right: '50px',
  width: '15px',
  marginTop: '1px'
});

export const WarningLabel = style({
  padding: '5px 1px 5px 0'
});

export const MessageInput = style({
  boxSizing: 'border-box',
  width: '95%',
  marginBottom: '7px'
});

export const Button = style({
  outline: 'none',
  border: 'none',
  color: 'var(--jp-layout-color0)'
});

export const ResetDeleteDisabledButton = style({
  backgroundColor: 'var(--jp-error-color2)'
});

export const ResetDeleteButton = style({
  backgroundColor: 'var(--jp-error-color1)'
});

export const CancelButton = style({
  backgroundColor: 'var(--jp-layout-color4)',
  marginRight: '4px'
});
