import * as React from 'react';
import { classes } from 'typestyle';
import {
  fileIconStyle,
  fileLabelStyle,
  folderLabelStyle
} from '../style/FilePathStyle';
import { extractFilename } from '../utils';
import { LabIcon } from '@jupyterlab/ui-components';
import { DocumentRegistry } from '@jupyterlab/docregistry';

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
  /**
   * Is file selected? - impact style of the icon
   */
  selected?: boolean;
}

export const FilePath: React.FunctionComponent<IFilePathProps> = (
  props: IFilePathProps
) => {
  const filename = extractFilename(props.filepath);
  const folder = props.filepath
    .slice(0, props.filepath.length - filename.length)
    .replace(/^\/|\/$/g, ''); // Remove leading and trailing '/'

  return (
    <React.Fragment>
      <LabIcon.resolveReact
        icon={props.filetype.icon}
        iconClass={classes(props.filetype.iconClass, fileIconStyle)}
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
