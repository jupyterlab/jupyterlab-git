import * as React from 'react';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { DefaultIconReact } from '@jupyterlab/ui-components';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import {
  fileChangedLabelBrandStyle,
  fileChangedLabelInfoStyle,
  fileChangedLabelStyle,
  fileIconStyle,
  fileLabelStyle,
  fileStyle,
  fileItemButtonStyle,
  folderLabelStyle,
  selectedFileChangedLabelStyle,
  selectedFileStyle
} from '../style/FileItemStyle';
import { Git } from '../tokens';
import {
  extractFilename,
  openListedFile,
  parseFileExtension,
  parseSelectedFileExtension
} from '../utils';
import { isDiffSupported } from './diff/Diff';
import { openDiffView } from './diff/DiffWidget';
import { ISpecialRef } from './diff/model';

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
  file: Git.IStatusFileResult;
  stage: string;
  model: GitExtension;
  moveFile: (file: string) => Promise<void>;
  discardFile: (file: string) => Promise<void>;
  moveFileTitle: string;
  contextMenu: (event: React.MouseEvent) => void;
  selected: boolean;
  selectFile: (file: Git.IStatusFileResult | null) => void;
  renderMime: IRenderMimeRegistry;
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

  getFileLabelIconClass() {
    return this.props.selected
      ? classes(fileIconStyle, parseSelectedFileExtension(this.props.file.to))
      : classes(fileIconStyle, parseFileExtension(this.props.file.to));
  }

  getFileClass() {
    return this.props.selected
      ? classes(fileStyle, selectedFileStyle)
      : classes(fileStyle);
  }

  /**
   * Callback method discarding unstaged changes for selected file.
   * It shows modal asking for confirmation and when confirmed make
   * server side call to git checkout to discard changes in selected file.
   */
  async discardSelectedFileChanges() {
    const result = await showDialog({
      title: 'Discard changes',
      body: `Are you sure you want to permanently discard changes to ${
        this.props.file.from
      }? This action cannot be undone.`,
      buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard' })]
    });
    if (result.button.accept) {
      this.props.discardFile(this.props.file.to);
    }
  }

  render() {
    const status =
      this.getFileChangedLabel(this.props.file.y as any) ||
      this.getFileChangedLabel(this.props.file.x as any);

    let diffButton = null;
    if (isDiffSupported(this.props.file.to)) {
      if (this.props.stage === 'Changed') {
        diffButton = this._createDiffButton({ specialRef: 'WORKING' });
      } else if (this.props.stage === 'Staged') {
        diffButton = this._createDiffButton({ specialRef: 'INDEX' });
      }
    }

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
        <span className={this.getFileLabelIconClass()} />
        <span className={fileLabelStyle}>
          {this._showPath(this.props.file.to)}
        </span>
        {this.props.stage === 'Changed' && (
          <button
            className={classes(fileItemButtonStyle, 'jp-Git-button')}
            title={'Discard changes'}
            onClick={(
              event: React.MouseEvent<HTMLButtonElement, MouseEvent>
            ) => {
              this.discardSelectedFileChanges();
            }}
          >
            <DefaultIconReact tag="span" name="git-discard" />
          </button>
        )}
        {diffButton}
        <button
          className={classes(fileItemButtonStyle, 'jp-Git-button')}
          title={this.props.moveFileTitle}
          onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            this.props.moveFile(this.props.file.to);
          }}
        >
          <DefaultIconReact
            tag="span"
            name={this.props.stage === 'Staged' ? 'git-remove' : 'git-add'}
          />
        </button>
        <span className={this.getFileChangedLabelClass(this.props.file.y)}>
          {this.props.file.y === '?'
            ? 'U'
            : this.props.file.y.trim() || this.props.file.x}
        </span>
      </li>
    );
  }

  private _showPath(path: string): React.ReactElement {
    const filename = extractFilename(path);
    const folder = path
      .slice(0, path.length - filename.length)
      .replace(/^\/|\/$/g, ''); // Remove leading and trailing '/'

    return (
      <React.Fragment>
        {filename}
        <span className={folderLabelStyle}>{folder}</span>
      </React.Fragment>
    );
  }

  /**
   * Creates a button element which is used to request diff from within the
   * Git panel.
   *
   * @param currentRef the ref to diff against the git 'HEAD' ref
   */
  private _createDiffButton(currentRef: ISpecialRef): JSX.Element {
    return (
      <button
        className={classes(fileItemButtonStyle, 'jp-Git-button')}
        title={'Diff this file'}
        onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          openDiffView(
            this.props.file.to,
            this.props.model,
            {
              previousRef: { gitRef: 'HEAD' },
              currentRef: { specialRef: currentRef.specialRef }
            },
            this.props.renderMime
          ).catch(reason => {
            console.error(
              `Fail to open diff view for ${this.props.file.to}.\n${reason}`
            );
          });
        }}
      >
        <DefaultIconReact tag="span" name="git-diff" />
      </button>
    );
  }
}
