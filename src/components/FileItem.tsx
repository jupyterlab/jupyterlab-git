import { JupyterLab } from '@jupyterlab/application';

import {
  changeStageButtonStyle,
  changeStageButtonLeftStyle,
  discardFileButtonStyle
} from '../components_style/GitStageStyle'

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
  cancelDiscardButtonStyle,
  acceptDiscardButtonStyle,
  discardButtonStyle,
  sideBarExpandedFileLabelStyle
} from '../components_style/FileItemStyle';

import { classes } from 'typestyle';

import * as React from 'react';

export interface IFileItemProps {
  topRepoPath: string;
  file: any;
  stage: string;
  app: JupyterLab;
  refresh: any;
  moveFile: Function;
  discardFile: Function;
  moveFileIconClass: string;
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
  disableFile: boolean;
  toggleDisableFiles: Function;
  sideBarExpanded: boolean;
}

export interface IFileItemState {
  showDiscardWarning: boolean;
}

export class FileItem extends React.Component<IFileItemProps, IFileItemState> {
  constructor(props) {
    super(props);
    this.state = {
      showDiscardWarning: false
    };
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

  getFileChangedLabelClass(change: string) {
    if (change === 'M') {
      if (this.state.showDiscardWarning) {
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
      if (this.state.showDiscardWarning) {
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
    if (this.state.showDiscardWarning) {
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
    } else if (this.state.showDiscardWarning) {
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
    if (this.state.showDiscardWarning) {
      return classes(
        fileButtonStyle,
        changeStageButtonStyle,
        changeStageButtonLeftStyle,
        fileGitButtonStyle,
        this.props.moveFileIconClass
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
            this.props.moveFileIconClass
          );
    }
  }

  getDiscardFileIconClass() {
    if (this.state.showDiscardWarning) {
      return classes(
        fileButtonStyle,
        changeStageButtonStyle,
        fileGitButtonStyle,
        discardFileButtonStyle
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
            discardFileButtonStyle
          );
    }
  }

  toggleDiscardChanges() {
    this.setState({ showDiscardWarning: !this.state.showDiscardWarning }, () =>
      this.props.toggleDisableFiles()
    );
  }

  getDiscardWarningClass() {
    return discardWarningStyle;
  }

  render() {
    return (
      <div
        className={this.getFileClass()}
        onClick={() => this.props.updateSelectedFile(this.props.fileIndex)}
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
              this.props.file.to
            );
          }}
          onDoubleClick={() =>
            this.props.openFile(
              this.props.file.x,
              this.props.file.y,
              this.props.file.to,
              this.props.app
            )}
        >
          {this.props.extractFilename(this.props.file.to)}
          <span className={this.getFileChangedLabelClass(this.props.file.y)}>
          {this.getFileChangedLabel(this.props.file.y)}
          </span>
          {this.props.stage === 'Changed' && (
            <button
              className={`jp-Git-button ${this.getDiscardFileIconClass()}`}
              title={'Discard this change'}
              onClick={() => this.toggleDiscardChanges()}
            />
          )}
        </span>
        {this.state.showDiscardWarning && (
          <div className={this.getDiscardWarningClass()}>
            These changes will be gone forever
            <div>
              <button
                className={classes(
                  discardButtonStyle,
                  cancelDiscardButtonStyle
                )}
                onClick={() => this.toggleDiscardChanges()}
              >
                Cancel
              </button>
              <button
                className={classes(
                  discardButtonStyle,
                  acceptDiscardButtonStyle
                )}
                onClick={() => {
                  this.props.discardFile(
                    this.props.file.to,
                    this.props.topRepoPath,
                    this.props.refresh
                  ),
                    this.toggleDiscardChanges();
                }}
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}
