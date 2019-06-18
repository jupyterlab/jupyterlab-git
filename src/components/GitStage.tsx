import { JupyterFrontEnd } from '@jupyterlab/application';

import { IGitStatusFileResult } from '../git';

import {
  sectionFileContainerStyle,
  sectionFileContainerDisabledStyle,
  sectionAreaStyle,
  sectionHeaderLabelStyle,
  changeStageButtonStyle,
  caretdownImageStyle,
  caretrightImageStyle,
  changeStageButtonLeftStyle,
  discardFileButtonStyle
} from '../componentsStyle/GitStageStyle';

import { FileItem } from './FileItem';

import { classes } from 'typestyle';

import * as React from 'react';

import { showDialog, Dialog } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

export interface IGitStageProps {
  heading: string;
  topRepoPath: string;
  files: any;
  app: JupyterFrontEnd;
  refresh: any;
  showFiles: boolean;
  displayFiles: Function;
  moveAllFiles: Function;
  discardAllFiles: Function;
  discardFile: Function;
  moveFile: Function;
  moveFileIconClass: string;
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
  renderMime: IRenderMimeRegistry;
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

  /**
   * Callback method discarding all unstanged changes.
   * It shows modal asking for confirmation and when confirmed make
   * server side call to git checkout to discard all unstanged changes.
   */
  discardAllChanges() {
    this.toggleDiscardChanges();
    return showDialog({
      title: 'Discard all changes',
      body: `Are you sure you want to permanently discard changes to all files? This action cannot be undone.`,
      buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard' })]
    }).then(result => {
      if (result.button.accept) {
        this.props.discardAllFiles(this.props.topRepoPath, this.props.refresh);
      }
      this.toggleDiscardChanges();
    });
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
            className={`${
              this.props.moveFileIconClass
            } ${changeStageButtonStyle}
               ${changeStageButtonLeftStyle}`}
            title={this.props.moveAllFilesTitle}
            onClick={() =>
              this.props.moveAllFiles(
                this.props.topRepoPath,
                this.props.refresh
              )
            }
          />
          {this.props.heading === 'Changed' && (
            <button
              disabled={this.checkContents()}
              className={classes(
                changeStageButtonStyle,
                discardFileButtonStyle
              )}
              title={'Discard All Changes'}
              onClick={() => this.discardAllChanges()}
            />
          )}
        </div>
        {this.props.showFiles && (
          <div className={sectionFileContainerStyle}>
            {this.props.files.map(
              (file: IGitStatusFileResult, fileIndex: number) => {
                return (
                  <FileItem
                    key={fileIndex}
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
                    fileIndex={fileIndex}
                    selectedStage={this.props.selectedStage}
                    selectedDiscardFile={this.props.selectedDiscardFile}
                    updateSelectedDiscardFile={
                      this.props.updateSelectedDiscardFile
                    }
                    disableFile={this.props.disableFiles}
                    toggleDisableFiles={this.props.toggleDisableFiles}
                    sideBarExpanded={this.props.sideBarExpanded}
                    renderMime={this.props.renderMime}
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
