import * as React from 'react';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import { hiddenButtonStyle } from '../style/ActionButtonStyle';
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
import { ActionButton } from './ActionButton';
import { isDiffSupported } from './diff/Diff';
import { openDiffView } from './diff/DiffWidget';
import { ISpecialRef } from './diff/model';
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

export interface IFileItemSharedProps {
  model: GitExtension;
  renderMime: IRenderMimeRegistry;
  selectFile: (file: Git.IStatusFile | null) => void;
}

export interface IFileItemProps extends IFileItemSharedProps {
  contextMenu: (event: React.MouseEvent) => void;
  discardFile: (file: string) => Promise<void>;
  file: Git.IStatusFile;
  moveFile: (file: string) => Promise<void>;
  moveFileTitle: string;
  selected: boolean;
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

  /**
   * Callback method discarding unstaged changes for selected file.
   * It shows modal asking for confirmation and when confirmed make
   * server side call to git checkout to discard changes in selected file.
   */
  discardSelectedFileChanges = async () => {
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
  };

  render() {
    const status =
      this.getFileChangedLabel(this.props.file.y as any) ||
      this.getFileChangedLabel(this.props.file.x as any);

    let diffButton = null;
    if (isDiffSupported(this.props.file.to)) {
      if (this.props.file.status === 'unstaged') {
        diffButton = this._createDiffButton({ specialRef: 'WORKING' });
      } else if (this.props.file.status === 'staged') {
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
        <FilePath
          filepath={this.props.file.to}
          selected={this.props.selected}
        />
        {this.props.file.status === 'unstaged' && (
          <ActionButton
            className={hiddenButtonStyle}
            iconName={'git-discard'}
            title={'Discard changes'}
            onClick={this.discardSelectedFileChanges}
          />
        )}
        {diffButton}
        <ActionButton
          className={hiddenButtonStyle}
          iconName={
            this.props.file.status === 'staged' ? 'git-remove' : 'git-add'
          }
          title={this.props.moveFileTitle}
          onClick={() => {
            this.props.moveFile(this.props.file.to);
          }}
        />
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
  private _createDiffButton(currentRef: ISpecialRef): JSX.Element {
    return (
      <ActionButton
        className={hiddenButtonStyle}
        iconName={'git-diff'}
        title={'Diff this file'}
        onClick={async () => {
          try {
            await openDiffView(
              this.props.file.to,
              this.props.model,
              {
                previousRef: { gitRef: 'HEAD' },
                currentRef: { specialRef: currentRef.specialRef }
              },
              this.props.renderMime
            );
          } catch (reason) {
            console.error(
              `Fail to open diff view for ${this.props.file.to}.\n${reason}`
            );
          }
        }}
      />
    );
  }
}
