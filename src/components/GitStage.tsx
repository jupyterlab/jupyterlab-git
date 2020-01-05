import { Dialog, showDialog } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import {
  caretdownImageStyle,
  caretrightImageStyle,
  changeStageButtonStyle,
  discardFileButtonStyle,
  sectionAreaStyle,
  sectionFileContainerDisabledStyle,
  sectionFileContainerStyle,
  sectionHeaderLabelStyle
} from '../style/GitStageStyle';
import { Git } from '../tokens';
import { FileItem } from './FileItem';

export interface IGitStageSharedProps {
  disableFiles: boolean;
  model: GitExtension;
  renderMime: IRenderMimeRegistry;
  selectedDiscardFile: number;
  selectedFile: number;
  selectedStage: string;
  toggleDisableFiles: () => void;
  updateSelectedDiscardFile: (index: number) => void;
  updateSelectedFile: (file: number, stage: string) => void;
  updateSelectedStage: (stage: string) => void;
}

export interface IGitStageProps extends IGitStageSharedProps {
  contextMenu: (
    event: any,
    typeX: string,
    typeY: string,
    file: string,
    index: number,
    stage: string
  ) => void;
  disableOthers: () => void;
  discardAllFiles: () => Promise<void>;
  discardFile: (file: string) => Promise<void>;
  displayFiles: () => void;
  files: Git.IStatusFileResult[];
  heading: string;
  isDisabled: boolean;
  moveAllFiles: () => Promise<void>;
  moveFile: (file: string) => Promise<void>;
  moveFileIconClass: string;
  moveFileIconSelectedClass: string;
  moveAllFilesTitle: string;
  moveFileTitle: string;
  showFiles: boolean;
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
   * Callback method discarding all unstaged changes.
   * It shows modal asking for confirmation and when confirmed make
   * server side call to git checkout to discard all unstaged changes.
   */
  async discardAllChanges() {
    this.toggleDiscardChanges();
    const result = await showDialog({
      title: 'Discard all changes',
      body: `Are you sure you want to permanently discard changes to all files? This action cannot be undone.`,
      buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard' })]
    });
    if (result.button.accept) {
      this.props.discardAllFiles();
    }
    this.toggleDiscardChanges();
  }

  render() {
    return (
      <div className={this.checkDisabled()}>
        <div className={sectionAreaStyle}>
          <button
            className={classes(
              changeStageButtonStyle,
              this.props.showFiles && this.props.files.length > 0
                ? caretdownImageStyle
                : caretrightImageStyle
            )}
            onClick={() => this.props.displayFiles()}
          />
          <span className={sectionHeaderLabelStyle}>{this.props.heading}</span>
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
          <button
            disabled={this.checkContents()}
            className={classes(
              this.props.moveFileIconClass,
              changeStageButtonStyle
            )}
            title={this.props.moveAllFilesTitle}
            onClick={() => this.props.moveAllFiles()}
          />
          <span className={sectionHeaderLabelStyle}>
            ({this.props.files.length})
          </span>
        </div>
        {this.props.showFiles && (
          <ul className={sectionFileContainerStyle}>
            {this.props.files.map(
              (file: Git.IStatusFileResult, fileIndex: number) => {
                return (
                  <FileItem
                    key={file.to}
                    stage={this.props.heading}
                    file={file}
                    model={this.props.model}
                    moveFile={this.props.moveFile}
                    discardFile={this.props.discardFile}
                    moveFileIconClass={this.props.moveFileIconClass}
                    moveFileIconSelectedClass={
                      this.props.moveFileIconSelectedClass
                    }
                    moveFileTitle={this.props.moveFileTitle}
                    contextMenu={this.props.contextMenu}
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
                    renderMime={this.props.renderMime}
                  />
                );
              }
            )}
          </ul>
        )}
      </div>
    );
  }
}
