import { style } from 'typestyle';

export const panelWrapperClass = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflowY: 'auto'
});

export const panelMainClass = style({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto'
});

export const warningTextClass = style({
  fontSize: 'var(--jp-ui-font-size1)',
  lineHeight: 'var(--jp-content-line-height)',
  margin: '13px 11px 4px 11px',
  textAlign: 'left'
});

export const repoButtonClass = style({
  alignSelf: 'center',
  boxSizing: 'border-box',

  height: '28px',
  width: '200px',
  marginTop: '5px',
  border: '0',
  borderRadius: '3px',

  color: 'white',
  fontSize: 'var(--jp-ui-font-size1)',

  backgroundColor: 'var(--md-blue-500)',
  $nest: {
    '&:hover': {
      backgroundColor: 'var(--md-blue-600)'
    },
    '&:active': {
      backgroundColor: 'var(--md-blue-700)'
    }
  }
});
