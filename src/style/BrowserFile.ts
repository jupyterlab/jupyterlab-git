import { style } from 'typestyle';

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
