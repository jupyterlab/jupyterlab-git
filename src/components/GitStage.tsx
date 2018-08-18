import { JupyterLab } from '@jupyterlab/application';

import { GitStatusFileResult } from '../git';

import {
  sectionFileContainerStyle,
  sectionFileContainerDisabledStyle,
  sectionAreaStyle,
  sectionHeaderLabelStyle,
  changeStageButtonStyle,
  caretdownImageStyle,
  caretrightImageStyle,
  changeStageButtonLeftStyle,
  discardFileButtonStyle,
  discardAllWarningStyle
} from '../componentsStyle/GitStageStyle';

import {
  cancelDiscardButtonStyle,
  acceptDiscardButtonStyle,
  discardButtonStyle,
  discardWarningStyle
} from '../componentsStyle/FileItemStyle';

import { FileItem } from './FileItem';

import { classes } from 'typestyle';

import * as React from 'react';

export interface IGitStageProps {
  heading: string;
  topRepoPath: string;
  files: any;
  app: JupyterLab;
  refresh: any;
  showFiles: boolean;
  displayFiles: Function;
  moveAllFiles: Function;
  discardAllFiles: Function;
  discardFile: Function;
  moveFile: Function;
  moveFileIconClass: Function;
  moveFileIconSelectedClass: string;
  moveAllFilesTitle: string;
  moveFileTitle: string;
  openFile: Function;
  extractFilename: Function;
  contextMenu: Function;
  parseFileExtension: Function;
  parseSelectedFileExtension: Function;
  selectedFile: number;
  updateSelectedFile: Function;
  selectedStage: string;
  selectedDiscardFile: number;
  updateSelectedDiscardFile: Function;
  disableFiles: boolean;
  toggleDisableFiles: Function;
  updateSelectedStage: Function;
  isDisabled: boolean;
  disableOthers: Function;
  sideBarExpanded: boolean;
  currentTheme: string;
}

export interface IGitStageState {
  showDiscardWarning: boolean;
}

export class GitStage extends React.Component<IGitStageProps, IGitStageState> {
  constructor(props: IGitStageProps) {
    super(props);
    this.state = {
      showDiscardWarning: false
    };
  }

  checkContents() {
    if (this.props.files.length > 0) {
      return false;
    } else {
      return true;
    }
  }

  checkDisabled() {
    return this.props.isDisabled
      ? classes(sectionFileContainerStyle, sectionFileContainerDisabledStyle)
      : sectionFileContainerStyle;
  }

  toggleDiscardChanges() {
    this.setState({ showDiscardWarning: !this.state.showDiscardWarning }, () =>
      this.props.disableOthers()
    );
  }

  render() {
    return (
      <div className={this.checkDisabled()}>
        <div className={sectionAreaStyle}>
          <span className={sectionHeaderLabelStyle}>
            {this.props.heading}({this.props.files.length})
          </span>
          {this.props.files.length > 0 && (
            <button
              className={
                this.props.showFiles
                  ? `${changeStageButtonStyle} ${caretdownImageStyle}`
                  : `${changeStageButtonStyle} ${caretrightImageStyle}`
              }
              onClick={() => this.props.displayFiles()}
            />
          )}
          <button
            disabled={this.checkContents()}
            className={`${this.props.moveFileIconClass(
              this.props.currentTheme
            )} ${changeStageButtonStyle} 
               ${changeStageButtonLeftStyle}`}
            title={this.props.moveAllFilesTitle}
            onClick={() =>
              this.props.moveAllFiles(
                this.props.topRepoPath,
                this.props.refresh
              )}
          />
          {this.props.heading === 'Changed' && (
            <button
              disabled={this.checkContents()}
              className={classes(
                changeStageButtonStyle,
                discardFileButtonStyle(this.props.currentTheme)
              )}
              title={'Discard All Changes'}
              onClick={() => this.toggleDiscardChanges()}
            />
          )}
        </div>
        {this.props.showFiles && (
          <div className={sectionFileContainerStyle}>
            {this.state.showDiscardWarning && (
              <div
                className={classes(discardAllWarningStyle, discardWarningStyle)}
              >
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
                      this.props.discardAllFiles(
                        this.props.topRepoPath,
                        this.props.refresh
                      );
                      this.toggleDiscardChanges();
                    }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
            {this.props.files.map(
              (file: GitStatusFileResult, file_index: number) => {
                return (
                  <FileItem
                    key={file_index}
                    topRepoPath={this.props.topRepoPath}
                    stage={this.props.heading}
                    file={file}
                    app={this.props.app}
                    refresh={this.props.refresh}
                    moveFile={this.props.moveFile}
                    discardFile={this.props.discardFile}
                    moveFileIconClass={this.props.moveFileIconClass}
                    moveFileIconSelectedClass={
                      this.props.moveFileIconSelectedClass
                    }
                    moveFileTitle={this.props.moveFileTitle}
                    openFile={this.props.openFile}
                    extractFilename={this.props.extractFilename}
                    contextMenu={this.props.contextMenu}
                    parseFileExtension={this.props.parseFileExtension}
                    parseSelectedFileExtension={
                      this.props.parseSelectedFileExtension
                    }
                    selectedFile={this.props.selectedFile}
                    updateSelectedFile={this.props.updateSelectedFile}
                    fileIndex={file_index}
                    selectedStage={this.props.selectedStage}
                    selectedDiscardFile={this.props.selectedDiscardFile}
                    updateSelectedDiscardFile={
                      this.props.updateSelectedDiscardFile
                    }
                    disableFile={this.props.disableFiles}
                    toggleDisableFiles={this.props.toggleDisableFiles}
                    sideBarExpanded={this.props.sideBarExpanded}
                    currentTheme={this.props.currentTheme}
                  />
                );
              }
            )}
          </div>
        )}
      </div>
    );
  }
}
