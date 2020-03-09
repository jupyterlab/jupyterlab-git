import * as React from 'react';
import { classes } from 'typestyle';
import {
  fileIconStyle,
  fileLabelStyle,
  folderLabelStyle
} from '../style/FilePathStyle';
import { extractFilename, getFileIconClassName } from '../utils';

/**
 * FilePath component properties
 */
export interface IFilePathProps {
  /**
   * File path
   */
  filepath: string;
  /**
   * Is file selected? - impact style of the icon
   */
  selected?: boolean;
}

function getFileIconClass(props: IFilePathProps) {
  return classes(
    fileIconStyle,
    getFileIconClassName(props.filepath, props.selected)
  );
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
      <span className={getFileIconClass(props)} />
      <span className={fileLabelStyle}>
        {filename}
        <span className={folderLabelStyle}>{folder}</span>
      </span>
    </React.Fragment>
  );
};
