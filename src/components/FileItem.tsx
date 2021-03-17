import { TranslationBundle } from '@jupyterlab/translation';
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

/**
 * File marker properties
 */
interface IGitMarkBoxProps {
  /**
   * Filename
   */
  fname: string;
  /**
   * Git repository model
   */
  model: GitExtension;
  /**
   * File status
   */
  stage: Git.Status;
}

/**
 * Render the selection box in simple mode
 */
class GitMarkBox extends React.PureComponent<IGitMarkBoxProps> {
  protected _onClick = (): void => {
    // toggle will emit a markChanged signal
    this.props.model.toggleMark(this.props.fname);

    // needed if markChanged doesn't force an update of a parent
    this.forceUpdate();
  };

  protected _onDoubleClick = (
    event: React.MouseEvent<HTMLInputElement>
  ): void => {
    event.stopPropagation();
  };

  render(): JSX.Element {
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

/**
 * File item properties
 */
export interface IFileItemProps {
  /**
   * Action buttons on the file
   */
  actions?: React.ReactElement;
  /**
   * Callback to open a context menu on the file
   */
  contextMenu?: (file: Git.IStatusFile, event: React.MouseEvent) => void;
  /**
   * File model
   */
  file: Git.IStatusFile;
  /**
   * Is the file marked?
   */
  markBox?: boolean;
  /**
   * Git repository model
   */
  model: GitExtension;
  /**
   * Callback on double click
   */
  onDoubleClick: () => void;
  /**
   * Is the file selected?
   */
  selected?: boolean;
  /**
   * Callback to select the file
   */
  selectFile?: (file: Git.IStatusFile | null) => void;
  /**
   * Inline styling for the windowing
   */
  style: React.CSSProperties;
  /**
   * The application language translator.
   */
  trans: TranslationBundle;
}

export class FileItem extends React.PureComponent<IFileItemProps> {
  constructor(props: IFileItemProps) {
    super(props);
  }
  protected _getFileChangedLabel(change: keyof typeof STATUS_CODES): string {
    return STATUS_CODES[change];
  }

  protected _getFileChangedLabelClass(change: string): string {
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

  protected _getFileClass(): string {
    return this.props.selected
      ? classes(fileStyle, selectedFileStyle)
      : fileStyle;
  }

  render(): JSX.Element {
    const { file } = this.props;
    const status_code = file.status === 'staged' ? file.x : file.y;
    const status = this._getFileChangedLabel(status_code as any);

    return (
      <div
        className={this._getFileClass()}
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
        title={this.props.trans.__(`%1 ● ${status}`, this.props.file.to)}
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
          filetype={this.props.file.type}
        />
        {this.props.actions}
        <span className={this._getFileChangedLabelClass(this.props.file.y)}>
          {this.props.file.y === '?' ? 'U' : status_code}
        </span>
      </div>
    );
  }
}
