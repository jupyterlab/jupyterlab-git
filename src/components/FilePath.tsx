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

function getFileIconClass(path: string): string {
  return getFileIconClassName(path);
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
      <span
        className={classes(
          fileIconStyle,
          'jp-git-icon',
          getFileIconClass(props.filepath),
          props.selected && 'jp-git-selected'
        )}
      />
      <span className={fileLabelStyle}>
        {filename}
        <span className={folderLabelStyle}>{folder}</span>
      </span>
    </React.Fragment>
  );
};
