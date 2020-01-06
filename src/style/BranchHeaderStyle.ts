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

export const openHistorySideBarButtonStyle = style({
  width: '50%',
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

export const branchHeaderCenterContent = style({
  paddingLeft: '10px',
  paddingRight: '10px',
  flex: 'auto',
  width: '50%'
});
