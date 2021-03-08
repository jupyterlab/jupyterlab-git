import { style } from 'typestyle';

export const headerGitIndicator = style({
  flex: '0 0 12px',
  borderLeft: 'var(--jp-border-width) solid var(--jp-border-color2)',
  textAlign: 'right'
});

export const itemGitIndicator = style({
  $debugName: 'jp-DirListing-itemGitIndicator',
  flex: '0 0 16px',
  textAlign: 'center',
  paddingLeft: '4px'
});

export const indicator = style({
  fontWeight: 'bold',
  borderRadius: '3px',
  width: '16px',
  display: 'inline-block',
  textAlign: 'center',
  color: 'white',
  fontSize: 'var(--jp-ui-font-size0)',
  padding: '1px 0'
});

export const modified = style({
  $nest: {
    '&:not(.jp-mod-selected)': {
      $nest: {
        '.jp-DirListing-itemText': {
          color: 'var(--md-blue-700)'
        }
      }
    }
  }
});

export const updated = style({
  $nest: {
    '&:not(.jp-mod-selected)': {
      $nest: {
        '.jp-DirListing-itemText': {
          color: 'var(--md-cyan-700)'
        }
      }
    }
  }
});

export const renamed = style({
  $nest: {
    '&:not(.jp-mod-selected)': {
      $nest: {
        '.jp-DirListing-itemText': {
          color: 'var(--md-purple-700)'
        }
      }
    }
  }
});

export const copied = style({
  $nest: {
    '&:not(.jp-mod-selected)': {
      $nest: {
        '.jp-DirListing-itemText': {
          color: 'var(--md-indigo-700)'
        }
      }
    }
  }
});

export const untracked = style({
  $nest: {
    '&:not(.jp-mod-selected)': {
      $nest: {
        '.jp-DirListing-itemText': {
          color: 'var(--md-red-700)'
        }
      }
    }
  }
});

export const added = style({
  $nest: {
    '&:not(.jp-mod-selected)': {
      $nest: {
        '.jp-DirListing-itemText': {
          color: 'var(--md-green-700)'
        }
      }
    }
  }
});

export const ignored = style({
  $nest: {
    '&:not(.jp-mod-selected)': {
      $nest: {
        '.jp-DirListing-itemText': {
          color: 'var(--md-grey-700)'
        }
      }
    }
  }
});

export const deleted = style({
  $nest: {
    '&:not(.jp-mod-selected)': {
      $nest: {
        '.jp-DirListing-itemText': {
          color: 'var(--md-grey-700)'
        }
      }
    },
    '.jp-DirListing-itemText': {
      textDecoration: 'line-through'
    }
  }
});

export const modifiedIndicator = style({
  backgroundColor: 'var(--md-blue-600)'
});

export const addedIndicator = style({
  backgroundColor: 'var(--md-green-600)'
});

export const deletedIndicator = style({
  backgroundColor: 'var(--md-red-600)'
});

export const renamedIndicator = style({
  backgroundColor: 'var(--md-purple-600)'
});

export const copiedIndicator = style({
  backgroundColor: 'var(--md-indigo-600)'
});

export const updatedIndicator = style({
  backgroundColor: 'var(--md-cyan-600)'
});

export const untrackedIndicator = style({
  backgroundColor: 'var(--md-grey-400)'
});

export const ignoredIndicator = style({
  backgroundColor: 'var(--md-grey-300)'
});
