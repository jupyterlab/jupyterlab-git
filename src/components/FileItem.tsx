import * as React from 'react';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { DefaultIconReact } from '@jupyterlab/ui-components';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import {
  disabledFileStyle,
  expandedFileStyle,
  fileChangedLabelBrandStyle,
  fileChangedLabelInfoStyle,
  fileChangedLabelStyle,
  fileIconStyle,
  fileLabelStyle,
  fileStyle,
  selectedFileChangedLabelStyle,
  selectedFileStyle,
  fileItemButtonStyle
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
  moveFileIconClass: string;
  moveFileIconSelectedClass: string;
  moveFileTitle: string;
  contextMenu: (
    event: any,
    typeX: string,
    typeY: string,
    file: string,
    index: number,
    stage: string
  ) => void;
  selectedFile: number;
  updateSelectedFile: (file: number, stage: string) => void;
  fileIndex: number;
  selectedStage: string;
  selectedDiscardFile: number;
  updateSelectedDiscardFile: (index: number) => void;
  disableFile: boolean;
  toggleDisableFiles: () => void;
  renderMime: IRenderMimeRegistry;
}

export class FileItem extends React.Component<IFileItemProps, {}> {
  constructor(props: IFileItemProps) {
    super(props);
  }

  checkSelected(): boolean {
    return (
      this.props.selectedFile === this.props.fileIndex &&
      this.props.selectedStage === this.props.stage
    );
  }

  getFileChangedLabel(change: keyof typeof STATUS_CODES): string {
    return STATUS_CODES[change];
  }

  showDiscardWarning(): boolean {
    return (
      this.props.selectedDiscardFile === this.props.fileIndex &&
      this.props.stage === 'Changed'
    );
  }

  getFileChangedLabelClass(change: string) {
    if (change === 'M') {
      if (this.showDiscardWarning()) {
        return classes(fileChangedLabelStyle, fileChangedLabelBrandStyle);
      } else {
        return this.checkSelected()
          ? classes(
              fileChangedLabelStyle,
              fileChangedLabelBrandStyle,
              selectedFileChangedLabelStyle
            )
          : classes(fileChangedLabelStyle, fileChangedLabelBrandStyle);
      }
    } else {
      if (this.showDiscardWarning()) {
        return classes(fileChangedLabelStyle, fileChangedLabelInfoStyle);
      } else {
        return this.checkSelected()
          ? classes(
              fileChangedLabelStyle,
              fileChangedLabelInfoStyle,
              selectedFileChangedLabelStyle
            )
          : classes(fileChangedLabelStyle, fileChangedLabelInfoStyle);
      }
    }
  }

  getFileLabelIconClass() {
    if (this.showDiscardWarning()) {
      return classes(fileIconStyle, parseFileExtension(this.props.file.to));
    } else {
      return this.checkSelected()
        ? classes(fileIconStyle, parseSelectedFileExtension(this.props.file.to))
        : classes(fileIconStyle, parseFileExtension(this.props.file.to));
    }
  }

  getFileClass() {
    if (!this.checkSelected() && this.props.disableFile) {
      return classes(fileStyle, disabledFileStyle);
    } else if (this.showDiscardWarning()) {
      classes(fileStyle, expandedFileStyle);
    } else {
      return this.checkSelected()
        ? classes(fileStyle, selectedFileStyle)
        : classes(fileStyle);
    }
  }

  /**
   * Callback method discarding unstaged changes for selected file.
   * It shows modal asking for confirmation and when confirmed make
   * server side call to git checkout to discard changes in selected file.
   */
  async discardSelectedFileChanges() {
    this.props.toggleDisableFiles();
    this.props.updateSelectedDiscardFile(this.props.fileIndex);
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
    this.props.toggleDisableFiles();
    this.props.updateSelectedDiscardFile(-1);
  }

  render() {
    const status =
      this.getFileChangedLabel(this.props.file.y as any) ||
      this.getFileChangedLabel(this.props.file.x as any);

    let diffButton = null;
    if (isDiffSupported(this.props.file.to)) {
      if (this.props.stage === 'Changed') {
        diffButton = this.createDiffButton({ specialRef: 'WORKING' });
      } else if (this.props.stage === 'Staged') {
        diffButton = this.createDiffButton({ specialRef: 'INDEX' });
      }
    }

    return (
      <li
        className={this.getFileClass()}
        onClick={() =>
          this.props.updateSelectedFile(this.props.fileIndex, this.props.stage)
        }
        onContextMenu={e => {
          this.props.contextMenu(
            e,
            this.props.file.x,
            this.props.file.y,
            this.props.file.to,
            this.props.fileIndex,
            this.props.stage
          );
        }}
        onDoubleClick={() =>
          openListedFile(
            this.props.file.x,
            this.props.file.y,
            this.props.file.to,
            this.props.model
          )
        }
        title={`${this.props.file.to} ● ${status}`}
      >
        <span className={this.getFileLabelIconClass()} />
        <span className={fileLabelStyle}>
          {extractFilename(this.props.file.to)}
        </span>
        {this.props.stage === 'Changed' && (
          <button
            className={classes(fileItemButtonStyle, 'jp-Git-button')}
            title={'Discard changes'}
            onClick={(
              event: React.MouseEvent<HTMLButtonElement, MouseEvent>
            ) => {
              event.stopPropagation();
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
            event.stopPropagation();
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

  /**
   * Creates a button element which is used to request diff from within the
   * Git panel.
   *
   * @param currentRef the ref to diff against the git 'HEAD' ref
   */
  private createDiffButton(currentRef: ISpecialRef): JSX.Element {
    return (
      <button
        className={classes(fileItemButtonStyle, 'jp-Git-button')}
        title={'Diff this file'}
        onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          event.stopPropagation();
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
