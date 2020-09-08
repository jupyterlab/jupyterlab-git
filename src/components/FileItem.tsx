import * as React from 'react';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import {
  fileChangedLabelBrandStyle,
  fileChangedLabelInfoStyle,
  fileChangedLabelStyle,
  fileStyle,
  gitMarkBoxStyle,
  selectedFileChangedLabelStyle,
  selectedFileStyle
} from '../style/FileItemStyle';
import { Git } from '../tokens';
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
  contextMenu?: (file: Git.IStatusFile, event: React.MouseEvent) => void;
  file: Git.IStatusFile;
  markBox?: boolean;
  model: GitExtension;
  onDoubleClick: () => void;
  selected?: boolean;
  selectFile?: (file: Git.IStatusFile | null) => void;
  style: React.CSSProperties;
}

export interface IGitMarkBoxProps {
  fname: string;
  model: GitExtension;
  stage: string;
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
    const { file } = this.props;
    const status_code = file.status === 'staged' ? file.x : file.y;
    const status = this.getFileChangedLabel(status_code as any);

    return (
      <li
        className={this.getFileClass()}
        onClick={
          this.props.selectFile &&
          (() => this.props.selectFile(this.props.file))
        }
        onContextMenu={
          this.props.contextMenu &&
          (event => {
            this.props.contextMenu(this.props.file, event);
          })
        }
        onDoubleClick={this.props.onDoubleClick}
        style={this.props.style}
        title={`${this.props.file.to} ● ${status}`}
      >
        {this.props.markBox && (
          <GitMarkBox
            fname={this.props.file.to}
            stage={this.props.file.status}
            model={this.props.model}
          />
        )}
        <FilePath
          filepath={this.props.file.to}
          selected={this.props.selected}
        />
        {this.props.actions}
        <span className={this.getFileChangedLabelClass(this.props.file.y)}>
          {this.props.file.y === '?' ? 'U' : status_code}
        </span>
      </li>
    );
  }
}

export class GitMarkBox extends React.Component<IGitMarkBoxProps> {
  constructor(props: IGitMarkBoxProps) {
    super(props);
  }

  protected _onClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    // toggle will emit a markChanged signal
    this.props.model.toggleMark(this.props.fname);

    // needed if markChanged doesn't force an update of a parent
    this.forceUpdate();
  };

  protected _onDoubleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  render() {
    // idempotent, will only run once per file
    this.props.model.addMark(
      this.props.fname,
      this.props.stage !== 'untracked'
    );

    return (
      <input
        name="gitMark"
        className={gitMarkBoxStyle}
        type="checkbox"
        checked={this.props.model.getMark(this.props.fname)}
        onChange={this._onClick}
        onDoubleClick={this._onDoubleClick}
      />
    );
  }
}
