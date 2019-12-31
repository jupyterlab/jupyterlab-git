import { style } from 'typestyle';

export const branchStyle = style({
  zIndex: 1,
  textAlign: 'center',
  overflowY: 'auto',
  minHeight: 29
});

export const selectedHeaderStyle = style({
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

export const branchHeaderCenterContent = style({
  paddingLeft: '5px',
  paddingRight: '5px',
  flex: 'auto'
});
