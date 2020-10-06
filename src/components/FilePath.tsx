import { DocumentRegistry } from '@jupyterlab/docregistry';
import { fileIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
import {
  fileIconStyle,
  fileLabelStyle,
  folderLabelStyle
} from '../style/FilePathStyle';
import { extractFilename } from '../utils';

/**
 * FilePath component properties
 */
export interface IFilePathProps {
  /**
   * File path
   */
  filepath: string;
  /**
   * File type
   */
  filetype: DocumentRegistry.IFileType;
}

export const FilePath: React.FunctionComponent<IFilePathProps> = (
  props: IFilePathProps
) => {
  const filename = extractFilename(props.filepath);
  const folder = props.filepath
    .slice(0, props.filepath.length - filename.length)
    .replace(/^\/|\/$/g, ''); // Remove leading and trailing '/'

  const icon = props.filetype.icon || fileIcon;

  return (
    <React.Fragment>
      <icon.react
        className={fileIconStyle}
        elementPosition="center"
        tag="span"
      />
      <span className={fileLabelStyle}>
        {filename}
        <span className={folderLabelStyle}>{folder}</span>
      </span>
    </React.Fragment>
  );
};
