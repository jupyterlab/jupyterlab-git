import { style } from 'typestyle';

export const remoteDialogClass = style({
  color: 'var(--jp-ui-font-color1)!important',

  borderRadius: '3px!important',

  backgroundColor: 'var(--jp-layout-color1)!important'
});

export const remoteDialogInputClass = style({
  display: 'flex',
  flexDirection: 'column',
  $nest: {
    '& > input': {
      marginTop: '10px',
      lineHeight: '20px'
    }
  }
});

export const existingRemoteListClass = style({
  marginTop: '1.5rem',
  listStyle: 'none',
  padding: '0px'
});

export const existingRemoteItemClass = style({
  marginTop: '2px',
  display: 'flex',
  columnGap: '5px'
});
