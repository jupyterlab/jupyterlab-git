import { style } from 'typestyle';

export const branchStyle = style({
  zIndex: 1,
  height: '100px',
  textAlign: 'center',
  overflowY: 'auto'
});

export const smallBranchStyle = style({
  height: '35px'
});

export const expandedBranchStyle = style({
  height: '500px'
});

export const openHistorySideBarButtonStyle = style({
  backgroundColor: 'var(--jp-layout-color3)',
  width: '50px',
  height: '15px',
  position: 'fixed',
  left: '33px',
  outline: 'none',
  border: 'none',
  color: '#FFFFFF'
});

export const openHistorySideBarIconStyle = style({
  backgroundImage: 'var(--jp-caret-right-white)',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '100%',
  width: '8px',
  height: '8px'
});

export const branchLabelStyle = style({
  fontSize: 'var(--jp-ui-font-size1)',
  marginTop: '5px',
  marginBottom: '5px',
  display: 'inline-block'
});

export const branchIconStyle = style({
  backgroundImage: 'var(--jp-Git-icon-branch)',
  display: 'inline-block',
  height: '14px',
  width: '14px',
  margin: '6px 10px -2px 0px',
  backgroundRepeat: 'no-repeat'
});

export const branchDropdownStyle = style({
  backgroundImage: 'var(--jp-image-caretdownwhite)',
  backgroundColor: 'transparent',
  flex: '0 0 auto',
  verticalAlign: 'middle',
  border: 'var(--md-grey-700)',
  borderRadius: '0',
  outline: 'none',
  width: '11px',
  height: '11px',
  marginTop: '8px',
  marginBottom: '2px',
  textIndent: '20px',
  '-webkit-appearance': 'none',
  '-moz-appearance': 'none'
});

export const headerButtonStyle = style({
  color: 'var(--jp-content-link-color)',
  fontSize: '10px',
  marginLeft: '5px'
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

  $nest: {
    '&:focus': {
      outline: 'none'
    }
  }
});
