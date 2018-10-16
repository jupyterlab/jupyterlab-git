import { JupyterLab } from '@jupyterlab/application';

import {
  changeStageButtonStyle,
  changeStageButtonLeftStyle,
  discardFileButtonStyle
} from '../componentsStyle/GitStageStyle';

import {
  fileStyle,
  selectedFileStyle,
  expandedFileStyle,
  disabledFileStyle,
  fileIconStyle,
  fileLabelStyle,
  fileChangedLabelStyle,
  selectedFileChangedLabelStyle,
  fileChangedLabelBrandStyle,
  fileChangedLabelInfoStyle,
  discardWarningStyle,
  fileButtonStyle,
  fileGitButtonStyle,
  discardFileButtonSelectedStyle,
  sideBarExpandedFileLabelStyle
} from '../componentsStyle/FileItemStyle';

import { classes } from 'typestyle';

import * as React from 'react';

import { showDialog, Dialog } from '@jupyterlab/apputils';

export interface IFileItemProps {
  topRepoPath: string;
  file: any;
  stage: string;
  app: JupyterLab;
  refresh: any;
  moveFile: Function;
  discardFile: Function;
  moveFileIconClass: Function;
  moveFileIconSelectedClass: string;
  moveFileTitle: string;
  openFile: Function;
  extractFilename: Function;
  contextMenu: Function;
  parseFileExtension: Function;
  parseSelectedFileExtension: Function;
  selectedFile: number;
  updateSelectedFile: Function;
  fileIndex: number;
  selectedStage: string;
  selectedDiscardFile: number;
  updateSelectedDiscardFile: Function;
  disableFile: boolean;
  toggleDisableFiles: Function;
  sideBarExpanded: boolean;
  currentTheme: string;
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

  getFileChangedLabel(change: string): string {
    if (change === 'M') {
      return 'Mod';
    } else if (change === 'A') {
      return 'Add';
    } else if (change === 'D') {
      return 'Rmv';
    } else if (change === 'R') {
      return 'Rnm';
    }
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

  getFileLableIconClass() {
    if (this.showDiscardWarning()) {
      return classes(
        fileIconStyle,
        this.props.parseFileExtension(this.props.file.to)
      );
    } else {
      return this.checkSelected()
        ? classes(
            fileIconStyle,
            this.props.parseSelectedFileExtension(this.props.file.to)
          )
        : classes(
            fileIconStyle,
            this.props.parseFileExtension(this.props.file.to)
          );
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

  getFileLabelClass() {
    return this.props.sideBarExpanded
      ? classes(fileLabelStyle, sideBarExpandedFileLabelStyle)
      : fileLabelStyle;
  }

  getMoveFileIconClass() {
    if (this.showDiscardWarning()) {
      return classes(
        fileButtonStyle,
        changeStageButtonStyle,
        changeStageButtonLeftStyle,
        fileGitButtonStyle,
        this.props.moveFileIconClass(this.props.currentTheme)
      );
    } else {
      return this.checkSelected()
        ? classes(
            fileButtonStyle,
            changeStageButtonStyle,
            changeStageButtonLeftStyle,
            fileGitButtonStyle,
            this.props.moveFileIconSelectedClass
          )
        : classes(
            fileButtonStyle,
            changeStageButtonStyle,
            changeStageButtonLeftStyle,
            fileGitButtonStyle,
            this.props.moveFileIconClass(this.props.currentTheme)
          );
    }
  }

  getDiscardFileIconClass() {
    if (this.showDiscardWarning()) {
      return classes(
        fileButtonStyle,
        changeStageButtonStyle,
        fileGitButtonStyle,
        discardFileButtonStyle(this.props.currentTheme)
      );
    } else {
      return this.checkSelected()
        ? classes(
            fileButtonStyle,
            changeStageButtonStyle,
            fileGitButtonStyle,
            discardFileButtonSelectedStyle
          )
        : classes(
            fileButtonStyle,
            changeStageButtonStyle,
            fileGitButtonStyle,
            discardFileButtonStyle(this.props.currentTheme)
          );
    }
  }

  getDiscardWarningClass() {
    return discardWarningStyle;
  }

  /**
   * Callback method discarding unstanged changes for selected file.
   * It shows modal asking for confirmation and when confirmed make
   * server side call to git checkout to discard changes in selected file.
   */
  discardSelectedFileChanges() {
    this.props.toggleDisableFiles();
    this.props.updateSelectedDiscardFile(this.props.fileIndex);
    return showDialog({
      title: 'Discard changes',
      body: `Are you sure you want to permanently discard changes to ${
        this.props.file.from
      }? This action cannot be undone.`,
      buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard' })]
    }).then(result => {
      if (result.button.accept) {
        this.props.discardFile(
          this.props.file.to,
          this.props.topRepoPath,
          this.props.refresh
        );
      }
      this.props.toggleDisableFiles();
      this.props.updateSelectedDiscardFile(-1);
    });
  }
  render() {
    return (
      <div
        className={this.getFileClass()}
        onClick={() =>
          this.props.updateSelectedFile(this.props.fileIndex, this.props.stage)
        }
      >
        <button
          className={`jp-Git-button ${this.getMoveFileIconClass()}`}
          title={this.props.moveFileTitle}
          onClick={() => {
            this.props.moveFile(
              this.props.file.to,
              this.props.topRepoPath,
              this.props.refresh
            );
          }}
        />
        <span className={this.getFileLableIconClass()} />
        <span
          className={this.getFileLabelClass()}
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
            this.props.openFile(
              this.props.file.x,
              this.props.file.y,
              this.props.file.to,
              this.props.app
            )
          }
        >
          {this.props.extractFilename(this.props.file.to)}
          <span className={this.getFileChangedLabelClass(this.props.file.y)}>
            {this.getFileChangedLabel(this.props.file.y)}
          </span>
          {this.props.stage === 'Changed' && (
            <button
              className={`jp-Git-button ${this.getDiscardFileIconClass()}`}
              title={'Discard this change'}
              onClick={() => {
                this.discardSelectedFileChanges();
              }}
            />
          )}
        </span>
      </div>
    );
  }
}
