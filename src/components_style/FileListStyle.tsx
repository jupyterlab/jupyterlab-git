import { style } from 'typestyle';

export function moveFileUpButtonStyle(isLight: string) {
  if (isLight === 'true' || isLight === undefined) {
    return style({
      backgroundImage: 'var(--jp-icon-move-file-up)'
    });
  } else {
    return style({
      backgroundImage: 'var(--jp-icon-move-file-up-white)'
    });
  }
}

export function moveFileDownButtonStyle(isLight: string) {
  if (isLight === 'true' || isLight === undefined) {
    return style({
      backgroundImage: 'var(--jp-icon-move-file-down)'
    });
  } else {
    return style({
      backgroundImage: 'var(--jp-icon-move-file-down-white)'
    });
  }
}

export const moveFileUpButtonSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-move-file-up-hover)'
});

export const moveFileDownButtonSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-move-file-down-hover)'
});

export const notebookFileIconStyle = style({
  backgroundImage: 'var(--jp-icon-book)'
});

export const consoleFileIconStyle = style({
  backgroundImage: 'var(--jp-icon-terminal)'
});

export const terminalFileIconStyle = style({
  backgroundImage: 'var(--jp-icon-terminal)'
});

export const folderFileIconStyle = style({
  backgroundImage: 'var(--jp-icon-directory)'
});

export const genericFileIconStyle = style({
  backgroundImage: 'var(--jp-icon-file)'
});

export const yamlFileIconStyle = style({
  backgroundImage: 'var(--jp-icon-yaml)'
});

export const markdownFileIconStyle = style({
  backgroundImage: 'var(--jp-icon-markdown)'
});

export const imageFileIconStyle = style({
  backgroundImage: 'var(--jp-icon-image)'
});

export const spreadsheetFileIconStyle = style({
  backgroundImage: 'var(--jp-icon-spreadsheet)'
});

export const jsonFileIconStyle = style({
  backgroundImage: 'var(--jp-icon-json)'
});

export const pythonFileIconStyle = style({
  backgroundImage: 'var(--jp-icon-python)'
});

export const kernelFileIconStyle = style({
  backgroundImage: 'var(--jp-icon-r)'
});

export const notebookFileIconSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-book-selected)'
});

export const consoleFileIconSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-terminal-selected)'
});

export const terminalFileIconSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-terminal-selected)'
});

export const folderFileIconSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-directory-selected)'
});

export const genericFileIconSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-file-selected)'
});

export const yamlFileIconSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-yaml-selected)'
});

export const markdownFileIconSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-markdown-selected)'
});

export const imageFileIconSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-image-selected)'
});

export const spreadsheetFileIconSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-spreadsheet-selected)'
});

export const jsonFileIconSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-json-selected)'
});

export const pythonFileIconSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-python-selected)'
});

export const kernelFileIconSelectedStyle = style({
  backgroundImage: 'var(--jp-icon-r-selected)'
});
