import {
  JupyterLab
} from '@jupyterlab/application'

import {
  fileStyle,
  fileGitButtonStyle,
  fileLabelStyle,
  fileIconStyle,
  changeStageButtonStyle,
  fileButtonStyle,
  changeStageButtonRightStyle,
} from '../components_style/FileListStyle'

import {
  fileChangedLabelStyle,
  fileChangedLabelBrandStyle,
  fileChangedLabelInfoStyle,
  selectedFileStyle,
  selectedFileChangedLabelStyle
} from '../components_style/GitStageStyle'


import {
  classes 
} from 'typestyle/lib'

import * as React from 'react'

export interface IFileItemProps {
  topRepoPath: string
  file: any
  app: JupyterLab
  refresh: any
  moveFile: Function
  moveFileIconClass: string
  moveFileTitle: string
  openFile: Function
  extractFilename: Function
  contextMenu: Function
  parseFileExtension: Function
  selectedFile: number
  updateSelectedFile: Function
  fileIndex: number
} 

export class FileItem extends React.Component<IFileItemProps, {}> {
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
      return this.props.selectedFile === this.props.fileIndex ? (
        classes(fileChangedLabelStyle, fileChangedLabelBrandStyle, selectedFileChangedLabelStyle)
      ) :
      (classes(fileChangedLabelStyle, fileChangedLabelBrandStyle))
    } else {
      return this.props.selectedFile === this.props.fileIndex ? (
        classes(fileChangedLabelStyle, fileChangedLabelInfoStyle, selectedFileChangedLabelStyle)
      ) :
      (classes(fileChangedLabelStyle, fileChangedLabelInfoStyle))
    }
  }

  getClass() {
    return this.props.selectedFile === this.props.fileIndex ? (
      classes(fileStyle, selectedFileStyle)
    ) :
    (fileStyle)
  }

  render() {
    return (
      <div className={this.getClass()} onClick={() => this.props.updateSelectedFile(this.props.fileIndex)}>
        <button 
          className={`jp-Git-button 
                      ${fileButtonStyle} 
                      ${changeStageButtonStyle}
                      ${changeStageButtonRightStyle} 
                      ${fileGitButtonStyle} 
                      ${this.props.moveFileIconClass}
                    `} 
          title={this.props.moveFileTitle}
          onClick={() => {
            this.props.moveFile(this.props.file.to, this.props.topRepoPath, this.props.refresh)
            }
          }
        />
        <span className={`${fileIconStyle} ${this.props.parseFileExtension(this.props.file.to)}`} />
        <span 
          className={fileLabelStyle} 
          onContextMenu={(e) => {this.props.contextMenu(e, this.props.file.x, this.props.file.y, this.props.file.to)}} 
          onDoubleClick={() => this.props.openFile(this.props.file.x, this.props.file.y, this.props.file.to, this.props.app)}
        >
          {this.props.extractFilename(this.props.file.to)} 
        <span className={this.getFileChangedLabelClass(this.props.file.y)}>
          {this.getFileChangedLabel(this.props.file.y)}
        </span>
        </span>
      </div>
    )
  }
}