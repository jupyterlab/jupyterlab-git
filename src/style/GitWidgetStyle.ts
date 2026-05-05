import { style } from 'typestyle';

export const gitWidgetStyle = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: '300px',
  color: 'var(--jp-ui-font-color1)',
  background: 'var(--jp-layout-color1)',
  fontSize: 'var(--jp-ui-font-size1)'
});

/**
 * Applied to each `PanelWithToolbar` accordion section. Lumino's default
 * `Panel` layout flows children in document order without sizing them — so
 * we make each section a flex column whose single ReactWidget child fills
 * the available space. Without this, AutoSizer inside `FileList` reports a
 * collapsed height and the file list gets cramped at the top of the section.
 */
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

/**
 * Applied to the React-rendered body of each accordion section so that the
 * inner React tree (panelWrapperClass) inherits a determined height and
 * flex context.
 */
export const sectionBodyStyle = style({
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column'
});
