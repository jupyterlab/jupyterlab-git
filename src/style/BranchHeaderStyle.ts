import { style } from 'typestyle';

export const branchStyle = style({
  zIndex: 1,
  textAlign: 'center',
  overflowY: 'auto',
  minHeight: 29
});

export const selectedHeaderStyle = style({
  borderTop: 'var(--jp-border-width) solid var(--jp-border-color2)',
  paddingBottom: 'var(--jp-border-width)'
});

export const unSelectedHeaderStyle = style({
  backgroundColor: 'var(--jp-layout-color2)',
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
  paddingTop: 'var(--jp-border-width)'
});

export const expandedBranchStyle = style({
  height: '500px'
});

export const openHistorySideBarButtonStyle = style({
  width: '50px',
  flex: 'initial',
  paddingLeft: '10px',
  paddingRight: '10px',
  borderRight: 'var(--jp-border-width) solid var(--jp-border-color2)'
});

export const historyLabelStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  marginTop: '5px',
  marginBottom: '5px',
  display: 'inline-block',
  fontWeight: 'normal'
});

export const branchLabelStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  marginTop: '5px',
  marginBottom: '5px',
  display: 'inline-block'
});

export const branchTrackingLabelStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  marginTop: '5px',
  marginBottom: '5px',
  display: 'inline-block',
  color: 'var(--jp-ui-font-color2)',
  fontWeight: 'normal'
});

export const branchDropdownButtonStyle = style({
  backgroundImage: 'var(--jp-icon-arrow-down)',
  backgroundSize: '100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  height: '18px',
  width: '18px',
  display: 'inline-block',
  verticalAlign: 'middle'
});

export const newBranchButtonStyle = style({
  backgroundImage: 'var(--jp-icon-plus)',
  backgroundSize: '100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  height: '18px',
  width: '18px',
  display: 'inline-block',
  verticalAlign: 'middle'
});

export const headerButtonDisabledStyle = style({
  opacity: 0.5
});

export const branchListItemStyle = style({
  listStyle: 'none',
  textAlign: 'left',
  marginLeft: '1em',
  color: 'var(--jp-ui-font-color1)'
});

export const stagedCommitButtonStyle = style({
  backgroundColor: 'var(--jp-brand-color1)',
  backgroundImage: 'var(--jp-checkmark)',
  backgroundSize: '100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  color: 'white',
  height: '42px',
  width: '40px',
  border: '0',
  flex: '1 1 auto'
});

export const stagedCommitButtonReadyStyle = style({
  opacity: 0.3
});

export const stagedCommitButtonDisabledStyle = style({
  backgroundColor: 'lightgray'
});

export const textInputStyle = style({
  outline: 'none'
});

export const stagedCommitStyle = style({
  resize: 'none',
  display: 'flex',
  alignItems: 'center',
  margin: '8px'
});

export const stagedCommitMessageStyle = style({
  width: '75%',
  fontWeight: 300,
  height: '32px',
  overflowX: 'auto',
  border: 'var(--jp-border-width) solid var(--jp-border-color2)',
  flex: '20 1 auto',
  resize: 'none',
  padding: '4px 8px',
  backgroundColor: 'var(--jp-layout-color1)',
  color: 'var(--jp-ui-font-color0)',

  $nest: {
    '&:focus': {
      outline: 'none'
    },
    '&::-webkit-input-placeholder': {
      color: 'var(--jp-ui-font-color3)'
    },
    '&::-moz-placeholder': {
      color: 'var(--jp-ui-font-color3)'
    },
    '&::-ms-input-placeholder': {
      color: 'var(--jp-ui-font-color3)'
    }
  }
});

export const branchHeaderCenterContent = style({
  paddingLeft: '5px',
  paddingRight: '5px',
  flex: 'auto'
});
