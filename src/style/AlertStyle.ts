import { style } from 'typestyle';

export const alertStyle = style({
  $nest: {
    '& .MuiAlert-filledError': {
      display: 'flex',
      alignItems: 'center',
      color: '#fff',
      fontWeight: '500'
    }
  }
});
