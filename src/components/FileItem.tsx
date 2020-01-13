import * as React from 'react';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import {
  fileChangedLabelBrandStyle,
  fileChangedLabelInfoStyle,
  fileChangedLabelStyle,
  fileStyle,
  selectedFileChangedLabelStyle,
  selectedFileStyle
} from '../style/FileItemStyle';
import { Git } from '../tokens';
import { openListedFile } from '../utils';
import { FilePath } from './FilePath';

// Git status codes https://git-scm.com/docs/git-status
export const STATUS_CODES = {
  M: 'Modified',
  A: 'Added',
  D: 'Deleted',
  R: 'Renamed',
  C: 'Copied',
  U: 'Updated',
  '?': 'Untracked',
  '!': 'Ignored'
};

export interface IFileItemProps {
  actions?: React.ReactElement;
  contextMenu: (event: React.MouseEvent) => void;
  file: Git.IStatusFile;
  model: GitExtension;
  selected: boolean;
  selectFile: (file: Git.IStatusFile | null) => void;
}

export class FileItem extends React.Component<IFileItemProps> {
  getFileChangedLabel(change: keyof typeof STATUS_CODES): string {
    return STATUS_CODES[change];
  }

  getFileChangedLabelClass(change: string) {
    if (change === 'M') {
      return this.props.selected
        ? classes(
            fileChangedLabelStyle,
            fileChangedLabelBrandStyle,
            selectedFileChangedLabelStyle
          )
        : classes(fileChangedLabelStyle, fileChangedLabelBrandStyle);
    } else {
      return this.props.selected
        ? classes(
            fileChangedLabelStyle,
            fileChangedLabelInfoStyle,
            selectedFileChangedLabelStyle
          )
        : classes(fileChangedLabelStyle, fileChangedLabelInfoStyle);
    }
  }

  getFileClass() {
    return this.props.selected
      ? classes(fileStyle, selectedFileStyle)
      : fileStyle;
  }

  render() {
    const status =
      this.getFileChangedLabel(this.props.file.y as any) ||
      this.getFileChangedLabel(this.props.file.x as any);

    return (
      <li
        className={this.getFileClass()}
        onClick={() => this.props.selectFile(this.props.file)}
        onContextMenu={event => {
          this.props.selectFile(this.props.file);
          this.props.contextMenu(event);
        }}
        onDoubleClick={() => {
          openListedFile(this.props.file, this.props.model);
        }}
        title={`${this.props.file.to} ● ${status}`}
      >
        <FilePath
          filepath={this.props.file.to}
          selected={this.props.selected}
        />
        {this.props.actions}
        <span className={this.getFileChangedLabelClass(this.props.file.y)}>
          {this.props.file.y === '?'
            ? 'U'
            : this.props.file.y.trim() || this.props.file.x}
        </span>
      </li>
    );
  }
}
