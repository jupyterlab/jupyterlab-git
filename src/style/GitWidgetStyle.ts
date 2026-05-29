import { style } from 'typestyle';

export const gitWidgetStyle = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: '300px',
  color: 'var(--jp-ui-font-color1)',
  background: 'var(--jp-layout-color1)',
  fontSize: 'var(--jp-ui-font-size1)'
});

export const sectionStyle = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,

  $nest: {
    '& > .lm-Widget': {
      flex: '1 1 auto',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }
});

export const sectionBodyStyle = style({
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column'
});
