import {
  JupyterLab
} from '@jupyterlab/application'

import {
  fileStyle,
  expandedFileStyle,
  fileGitButtonStyle,
  fileLabelStyle,
  fileIconStyle,
  changeStageButtonStyle,
  fileButtonStyle,
  changeStageButtonLeftStyle,
  discardFileButtonStyle,
  discardFileButtonSelectedStyle,
} from '../components_style/FileListStyle'

import {
  fileChangedLabelStyle,
  fileChangedLabelBrandStyle,
  fileChangedLabelInfoStyle,
  selectedFileStyle,
  selectedFileChangedLabelStyle
} from '../components_style/GitStageStyle'

import {
  discardWarningStyle,
  discardWarningSelectedStyle,
  cancelDiscardButtonStyle,
  acceptDiscardButtonStyle,
  discardButtonStyle
} from '../components_style/FileItemStyle'

import {
  classes 
} from 'typestyle/lib'

import * as React from 'react'

export interface IFileItemProps {
  topRepoPath: string
  file: any
  stage: string
  app: JupyterLab
  refresh: any
  moveFile: Function
  discardFile: Function
  moveFileIconClass: string
  moveFileIconSelectedClass: string
  moveFileTitle: string
  openFile: Function
  extractFilename: Function
  contextMenu: Function
  parseFileExtension: Function
  parseSelectedFileExtension: Function
  selectedFile: number
  updateSelectedFile: Function
  fileIndex: number
  selectedStage: string
} 

export interface IFileItemState {
  showDiscardWarning: boolean
}

export class FileItem extends React.Component<IFileItemProps, IFileItemState> {
  constructor(props) {
    super(props)
    this.state = {
      showDiscardWarning: false
    }
  }

  checkSelected() : boolean {
    return this.props.selectedFile === this.props.fileIndex 
          && this.props.selectedStage === this.props.stage
  }

  getFileChangedLabel(change: string) : string {
    if(change === 'M') {
      return 'Mod'
    } else if(change === 'A') {
      return 'Add'
    } else if(change === 'D') {
      return 'Rmv'
    } else if(change === 'R') {
      return 'Rnm'
    } 
  }

  getFileChangedLabelClass(change: string) {
    if(change === 'M') {
      return this.checkSelected() ? 
        classes(fileChangedLabelStyle, fileChangedLabelBrandStyle, selectedFileChangedLabelStyle)
      : 
        classes(fileChangedLabelStyle, fileChangedLabelBrandStyle)
    } else {
      return this.checkSelected() ? 
        classes(fileChangedLabelStyle, fileChangedLabelInfoStyle, selectedFileChangedLabelStyle)
      :
        classes(fileChangedLabelStyle, fileChangedLabelInfoStyle)
    }
  }

  getFileLableIconClass() {
    return this.checkSelected() ? 
      classes(fileIconStyle, this.props.parseSelectedFileExtension(this.props.file.to))
    : 
      classes(fileIconStyle, this.props.parseFileExtension(this.props.file.to))
  }

  getFileLableClass() {
    return this.checkSelected() ?
      this.state.showDiscardWarning ?  
        classes(fileStyle, expandedFileStyle, selectedFileStyle)
      :
        classes(fileStyle, selectedFileStyle)
    : 
      this.state.showDiscardWarning ?  
        classes(fileStyle, expandedFileStyle)
      :
        classes(fileStyle)
  }

  getMoveFileIconClass() {
    return this.checkSelected() ? 
      classes(fileButtonStyle, changeStageButtonStyle, changeStageButtonLeftStyle, fileGitButtonStyle, this.props.moveFileIconSelectedClass)
    : 
      classes(fileButtonStyle, changeStageButtonStyle, changeStageButtonLeftStyle, fileGitButtonStyle, this.props.moveFileIconClass)
  }

  getDiscardFileIconClass() {
    return this.checkSelected() ? 
      classes(fileButtonStyle, changeStageButtonStyle, fileGitButtonStyle, discardFileButtonSelectedStyle)
    :
      classes(fileButtonStyle, changeStageButtonStyle, fileGitButtonStyle, discardFileButtonStyle)
  }

  discardChanges() {
    this.setState({showDiscardWarning: !this.state.showDiscardWarning})
  }

  cancelDiscard() {
    this.setState({showDiscardWarning: false})
  }

  getDiscardWarningClass() {
    return this.checkSelected() ?
      classes(discardWarningStyle, discardWarningSelectedStyle)
    :
      discardWarningStyle
  }

  render() {
    return (
      <div className={this.getFileLableClass()} onClick={() => this.props.updateSelectedFile(this.props.fileIndex)}>
        <button 
          className={`jp-Git-button ${this.getMoveFileIconClass()}`} 
          title={this.props.moveFileTitle}
          onClick={() => {
            this.props.moveFile(this.props.file.to, this.props.topRepoPath, this.props.refresh)
            }
          }
        />
        <span className={this.getFileLableIconClass()} />
        <span 
          className={fileLabelStyle} 
          onContextMenu={(e) => {this.props.contextMenu(e, this.props.file.x, this.props.file.y, this.props.file.to)}} 
          onDoubleClick={() => this.props.openFile(this.props.file.x, this.props.file.y, this.props.file.to, this.props.app)}
        >
          {this.props.extractFilename(this.props.file.to)} 
        <span className={this.getFileChangedLabelClass(this.props.file.y)}>
          {this.getFileChangedLabel(this.props.file.y)}
        </span>
        {this.props.stage === 'Changed' &&
          <button 
            className={`jp-Git-button ${this.getDiscardFileIconClass()}`} 
            title={'Discard this change'}
            onClick={() => this.discardChanges()}
          />
        }
        </span>
        {this.state.showDiscardWarning && 
          <div className={this.getDiscardWarningClass()}>
            These changes will be gone forever
            <div>
              <button className={classes(discardButtonStyle, cancelDiscardButtonStyle)} onClick={() => this.cancelDiscard()}>
                Cancel
              </button>
              <button className={classes(discardButtonStyle, acceptDiscardButtonStyle)} onClick={() => {
                this.props.discardFile(this.props.file.to, this.props.topRepoPath, this.props.refresh)
                  } 
                }
              >
                Discard
              </button>
            </div>
          </div>
        }
      </div>
    )
  }
}