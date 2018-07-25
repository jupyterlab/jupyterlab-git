import { style } from 'typestyle';

export const pastCommitNodeStyle = style({
  position: 'relative',
  color: 'var(--jp-ui-font-color1)',
  width: '36px',
  height: '36px',
  border: '2px solid #000',
  borderRadius: '50%',
  outline: 'none !important',
  margin: '-1px auto -1px auto',
  textAlign: 'center',
  lineHeight: '36px'
});

export const pastCommitWorkingNodeStyle = style({
  border: '2px dashed #000',
  borderRadius: '50%'
});

export const pastCommitContentStyle = style({
  fontFamily: 'Oswald'
});

export const pastCommitWorkingContentStyle = style({
  left: '-5px',
  backgroundColor: 'var(--jp-layout-color2)',
  height: '13px',
  position: 'absolute',
  lineHeight: '100%',
  marginTop: '11px'
});

export const pastCommitHeadContentStyle = style({
  left: '5%'
});

export const pastCommitNumberContentStyle = style({
  left: '38%'
});

export const pastCommitActiveContentStyle = style({
  color: 'var(--jp-brand-color2)'
});

export const pastCommitLineStyle = style({
  backgroundColor: '#000',
  height: '18px',
  width: '3px',
  margin: '0 auto'
});
