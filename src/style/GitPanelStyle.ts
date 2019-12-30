import { style } from 'typestyle';

export const panelContainerStyle = style({
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  height: '100%',
  color: 'var(--jp-ui-font-color1)',
  background: 'var(--jp-layout-color1)',
  fontSize: 'var(--jp-ui-font-size1)'
});

export const panelWarningStyle = style({
  textAlign: 'center',
  marginTop: '9px'
});

export const findRepoButtonStyle = style({
  color: 'white',
  backgroundColor: 'var(--jp-brand-color1)',
  marginTop: '5px'
});
