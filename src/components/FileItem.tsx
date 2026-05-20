import { TranslationBundle } from '@jupyterlab/translation';
import * as React from 'react';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import {
  checkboxLabelContainerStyle,
  checkboxLabelLastContainerStyle,
  checkboxLabelStyle,
  fileChangedLabelAddedStyle,
  fileChangedLabelDeletedStyle,
  fileChangedLabelInfoStyle,
  fileChangedLabelModifiedStyle,
  fileChangedLabelStyle,
  fileStyle,
  gitMarkBoxStyle,
  selectedFileChangedLabelStyle,
  selectedFileStyle
} from '../style/FileItemStyle';
import { fileLabelStyle } from '../style/FilePathStyle';
import { Git } from '../tokens';
import { FilePath } from './FilePath';

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
  /**
   * Whether the checkbox is checked
   */
  checked: boolean;
}

/**
 * Render the selection box in simple mode
 */
class GitMarkBox extends React.PureComponent<IGitMarkBoxProps> {
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
        checked={this.props.checked}
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
  actions?: React.ReactNode;
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
   * Callback when the row is clicked with no modifier keys.
   *
   * Used for the row's primary action (e.g. opening a diff). Modifier
   * key clicks remain dedicated to multi-selection and skip this handler.
   * Not invoked in mark-box (simple staging) mode where a plain click
   * toggles the file's mark instead.
   */
  onClick?: (file: Git.IStatusFile) => void;
  /**
   * Is the file selected?
   */
  selected?: boolean;
  /**
   * Callback to select file(s)
   */
  setSelection?: (
    file: Git.IStatusFile,
    options?: { singleton?: boolean; group?: boolean }
  ) => void;
  /**
   * Optional style class
   */
  className?: string;
  /**
   * Inline styling for the windowing
   */
  style?: React.CSSProperties;
  /**
   * The application language translator.
   */
  trans: TranslationBundle;
  /**
   * Callback to implement shift-click for simple staging
   */
  markUntilFile?: (file: Git.IStatusFile) => void;
  /**
   * whether the GitMarkBox is checked
   */
  checked?: boolean;
}

export class FileItem extends React.PureComponent<IFileItemProps> {
  constructor(props: IFileItemProps) {
    super(props);
  }

  protected _onClick = (event: React.MouseEvent<HTMLInputElement>): void => {
    if (this.props.markBox) {
      if (event.shiftKey) {
        this.props.markUntilFile!(this.props.file);
      } else {
        this.props.model.toggleMark(this.props.file.to);
        this.props.setSelection!(this.props.file, { singleton: true });
      }
    } else {
      if (event.ctrlKey || event.metaKey) {
        this.props.setSelection!(this.props.file);
      } else if (event.shiftKey) {
        this.props.setSelection!(this.props.file, { group: true });
      } else {
        this.props.setSelection!(this.props.file, { singleton: true });
        this.props.onClick?.(this.props.file);
      }
    }
  };

  protected _getFileChangedLabel(
    change: string,
    trans: TranslationBundle
  ): string {
    return Private.get_status(change, trans) || trans.__('Unmodified');
  }

  protected _getFileChangedLabelClass(change: string): string {
    // Map each porcelain status code to a semantic color (green for new
    // content, red for removed, warn for modified/renamed, info for
    // anything else). `!` is only emitted for unmerged conflicts here,
    // so it gets the deleted/error color rather than warn.
    let colorStyle: string;
    switch (change) {
      case 'A':
      case 'U':
        colorStyle = fileChangedLabelAddedStyle;
        break;
      case 'D':
      case '!':
        colorStyle = fileChangedLabelDeletedStyle;
        break;
      case 'M':
      case 'R':
        colorStyle = fileChangedLabelModifiedStyle;
        break;
      default:
        colorStyle = fileChangedLabelInfoStyle;
    }
    return this.props.selected
      ? classes(fileChangedLabelStyle, colorStyle, selectedFileChangedLabelStyle)
      : classes(fileChangedLabelStyle, colorStyle);
  }

  protected _getFileClass(): string {
    const baseClass = this.props.selected
      ? classes(fileStyle, selectedFileStyle)
      : fileStyle;

    return this.props.className
      ? `${baseClass} ${this.props.className}`
      : baseClass;
  }

  render(): JSX.Element {
    const { file } = this.props;
    const status_code = file.status === 'staged' ? file.x : file.y;
    // Letter shown in the status badge: `!` for unmerged conflicts, `U`
    // for untracked, otherwise the staged or unstaged porcelain code.
    const badge_code =
      file.status === 'unmerged'
        ? '!'
        : file.y === '?'
        ? 'U'
        : status_code;
    const status =
      file.status === 'unmerged'
        ? this.props.trans.__('Conflicted')
        : this._getFileChangedLabel(status_code as any, this.props.trans);

    return (
      <div
        data-test-selected={this.props.selected}
        data-test-checked={this.props.checked}
        className={this._getFileClass()}
        onClick={this._onClick}
        onContextMenu={
          this.props.contextMenu &&
          (event => {
            this.props.contextMenu!(this.props.file, event);
          })
        }
        onDoubleClick={this.props.onDoubleClick}
        style={this.props.style}
        title={this.props.trans.__(`%1 • ${status}`, this.props.file.to)}
      >
        <div className={checkboxLabelContainerStyle}>
          <div className={checkboxLabelStyle + ' ' + fileLabelStyle}>
            {this.props.markBox && (
              <GitMarkBox
                fname={this.props.file.to}
                stage={this.props.file.status}
                model={this.props.model}
                checked={this.props.checked ?? false}
              />
            )}
            <FilePath
              filepath={this.props.file.to}
              filetype={this.props.file.type}
            />
          </div>
          <div className={checkboxLabelLastContainerStyle}>
            {this.props.actions}
            <span className={this._getFileChangedLabelClass(badge_code)}>
              {badge_code}
            </span>
          </div>
        </div>
      </div>
    );
  }
}

namespace Private {
  let i18nCodes: Record<string, string> | null = null;
  export function get_status(code: string, trans: TranslationBundle): string {
    if (!i18nCodes) {
      // Git status codes https://git-scm.com/docs/git-status
      i18nCodes = {
        M: trans.__('Modified'),
        A: trans.__('Added'),
        D: trans.__('Deleted'),
        R: trans.__('Renamed'),
        C: trans.__('Copied'),
        U: trans.__('Updated'),
        B: trans.__('Behind'),
        '?': trans.__('Untracked'),
        '!': trans.__('Ignored')
      };
    }
    return i18nCodes[code];
  }
}
