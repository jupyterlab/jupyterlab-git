import { style } from 'typestyle';

/**
 * Pill-shaped count badge inserted into the AccordionPanel title bar by
 * `GitAccordionRenderer.createSectionTitle`.
 *
 * The badge is mounted inside the title's `.jp-AccordionPanel-toolbar`
 * slot whenever one exists (the toolbar slot is right-aligned via JL's CSS
 * `margin-left: auto`); the `margin-left: auto` declared here is the
 * fallback that right-aligns the badge when the title has no toolbar slot
 * (so the chip stays on the right regardless of section variant).
 *
 * Tuned to match the inner-section badges (`sectionHeaderSizeStyle`) so that
 * counts on outer accordion titles and inner section headers feel like the
 * same component.
 */
export const sectionCountBadgeClass = style({
  flex: '0 0 auto',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '18px',
  height: '16px',
  padding: '0 6px',
  marginLeft: 'auto',

  fontSize: 'var(--jp-ui-font-size0)',
  fontWeight: 600,
  lineHeight: 1,
  letterSpacing: 0,
  whiteSpace: 'nowrap',

  color: 'var(--jp-ui-inverse-font-color0)',
  backgroundColor: 'var(--jp-layout-color3)',
  borderRadius: '10px'
});
