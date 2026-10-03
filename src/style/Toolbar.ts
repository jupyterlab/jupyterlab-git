import { style } from 'typestyle';
import type { NestedCSSProperties } from 'typestyle/lib/types';

export const panelToolbarClass = style({
  $nest: {
    // The `&.jp-Toolbar`-prefixed selectors need the extra specificity to win
    // over the core `.jp-Toolbar` and `.jp-Toolbar > .jp-Toolbar-item` rules
    '&.jp-Toolbar': {
      padding: '2px 8px',
      // Adapt the items to the width of the toolbar; the typestyle types do
      // not know these properties yet
      ...({
        containerName: 'jp-git-toolbar',
        containerType: 'inline-size'
      } as NestedCSSProperties)
    },
    // The items are laid out by this region of the toolbar shadow DOM, which
    // wraps them by default: they would overflow on the panel content below
    '&.jp-Toolbar::part(positioning-region)': {
      flex: '1 1 auto',
      flexWrap: 'nowrap',
      gap: '4px',
      minWidth: 0
    },
    // Unused regions, which would add the gap at both ends of the toolbar
    '&.jp-Toolbar::part(start), &.jp-Toolbar::part(end)': {
      display: 'none'
    },
    '&.jp-Toolbar > .jp-Toolbar-item': {
      alignItems: 'center'
    },
    '&.jp-Toolbar > .jp-git-toolbarRepository': {
      flex: '0 1 auto',
      minWidth: 0,
      overflow: 'hidden'
    },
    // Shrink well before the repository label but never collapse entirely
    '&.jp-Toolbar > .jp-git-toolbarBranch': {
      flex: '0 10000 auto',
      minWidth: '54px'
    }
  }
});

export const toolbarMenuWrapperClass = style({
  background: 'var(--jp-layout-color1)',
  borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)'
});

export const repoButtonLabelClass = style({
  flex: '0 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',

  $nest: {
    // Leave the room to the branch name in a narrow panel: only the icon of
    // the repository remains, with its name in the tooltip
    '@container jp-git-toolbar (max-width: 300px)': {
      display: 'none'
    }
  }
});

export const repoLabelClass = style({
  display: 'inline-flex',
  alignItems: 'center',
  flex: '0 1 auto',
  minWidth: 0,
  gap: '6px',
  height: '24px',
  padding: '0 4px',

  fontWeight: 600,

  $nest: {
    '& > span.jp-Icon': {
      width: '14px',
      height: '14px',
      flex: '0 0 auto'
    }
  }
});

export const repoButtonClass = style({
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  flex: '0 1 auto',
  minWidth: 0,
  gap: '4px',

  height: '24px',
  padding: '0 6px',

  fontSize: 'var(--jp-ui-font-size1)',
  fontWeight: 600,
  color: 'var(--jp-ui-font-color1)',

  border: 'none',
  borderRadius: '3px',
  background: 'transparent',
  cursor: 'pointer',

  $nest: {
    '&:hover': {
      backgroundColor: 'var(--jp-layout-color2)'
    },
    '&:active': {
      backgroundColor: 'var(--jp-layout-color3)'
    },
    '&:focus-visible': {
      outline: '2px solid var(--jp-brand-color1)',
      outlineOffset: '-2px'
    },
    '& > span.jp-Icon': {
      width: '14px',
      height: '14px',
      flex: '0 0 auto'
    }
  }
});

export const branchInfoClass = style({
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  // Shrink well before the repository label but never collapse entirely
  flex: '0 10000 auto',
  minWidth: '54px',
  gap: '4px',

  height: '18px',
  padding: '0 6px',

  fontSize: 'var(--jp-ui-font-size0)',
  color: 'var(--jp-ui-font-color1)',

  borderRadius: '9px',
  background: 'var(--jp-layout-color2)',

  $nest: {
    '& > span.jp-Icon': {
      width: '12px',
      height: '12px',
      flex: '0 0 auto'
    }
  }
});

export const branchNameClass = style({
  flex: '0 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 600
});

export const toolbarButtonClass = style({
  boxSizing: 'border-box',
  height: '24px',
  width: 'var(--jp-private-running-button-width) !important',

  margin: '0 !important',
  padding: '0px 6px !important',

  $nest: {
    '& span': {
      margin: 'auto',
      width: '16px'
    },
    '&:focus-visible': {
      outline: '2px solid var(--jp-brand-color1)',
      outlineOffset: '-2px'
    }
  }
});

export const badgeClass = style({
  $nest: {
    '& > .MuiBadge-badge': {
      top: 8,
      right: 5,
      backgroundColor: 'var(--jp-warn-color1)'
    }
  }
});
