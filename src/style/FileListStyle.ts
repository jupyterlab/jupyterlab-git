import { style } from 'typestyle';

export const fileListWrapperClass = style({
  height: 'auto',
  minHeight: '150px',

  overflow: 'hidden',
  overflowY: 'auto'
});

export const notebookFileIconStyle = style({
  backgroundImage: 'var(--jp-icon-notebook)'
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
