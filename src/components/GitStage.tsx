import {
  JupyterLab
} from '@jupyterlab/application'

import {
  sectionFileContainerStyle,
  sectionAreaStyle,
  sectionHeaderLabelStyle,
  changeStageButtonStyle,
  caretdownImageStyle,
  caretrightImageStyle,
  changeStageButtonRightStyle,
} from '../components_style/FileListStyle'

import {
  FileItem
} from './FileItem'

import * as React from 'react'

import ToggleDisplay from 'react-toggle-display'

export interface IGitStageProps {
  heading: string
  topRepoPath: string
  files: any
  app: JupyterLab
  refresh: any
  showFiles: boolean
  displayFiles: Function
  moveAllFiles: Function
  moveFile: Function
  moveFileIconClass: string
  moveAllFilesTitle: string
  moveFileTitle: string
  openFile: Function
  extractFilename: Function
  contextMenu: Function
  parseFileExtension: Function
} 

export interface IGitStageState {
  selectedFile: number
}

export class GitStage extends React.Component<IGitStageProps, IGitStageState> {
  constructor(props) {
    super(props)
    this.state = {selectedFile: -1}
  }

  checkDisabled() {
    if(this.props.files.length > 0) {
      return false
    } else {
      return true
    }
  }

  updateSelectedFile = (file: any) => {
    this.setState({selectedFile: file})
  }

  render() {
    return (
      <div className={sectionFileContainerStyle}>
      <div className={sectionAreaStyle} >
        <span className={sectionHeaderLabelStyle}> 
          {this.props.heading}({(this.props.files).length})
        </span>  
        <ToggleDisplay show={this.props.files.length > 0}>
        <button 
          className={this.props.showFiles ? 
            `${changeStageButtonStyle} ${caretdownImageStyle}` 
            : `${changeStageButtonStyle} ${caretrightImageStyle}`
          } 
          onClick={() => this.props.displayFiles()} 
        />
        </ToggleDisplay>
        <button 
          disabled={this.checkDisabled()}
          className={`${this.props.moveFileIconClass} ${changeStageButtonStyle} 
                      ${changeStageButtonRightStyle}` } 
          title={this.props.moveAllFilesTitle}
          onClick={() => this.props.moveAllFiles(this.props.topRepoPath, this.props.refresh)} 
        />
      </div>
      <ToggleDisplay show={this.props.showFiles}>
        <div className={sectionFileContainerStyle}>
          {this.props.files.map((file, file_index) => {
            return (
              <FileItem
                key={file_index}
                topRepoPath={this.props.topRepoPath}
                file={file}
                app={this.props.app}
                refresh={this.props.refresh}
                moveFile={this.props.moveFile}
                moveFileIconClass={this.props.moveFileIconClass}
                moveFileTitle={this.props.moveFileTitle}
                openFile={this.props.openFile}
                extractFilename={this.props.extractFilename}
                contextMenu={this.props.contextMenu}
                parseFileExtension={this.props.parseFileExtension}
                selectedFile={this.state.selectedFile}
                updateSelectedFile={this.updateSelectedFile}
                fileIndex={file_index}
              />
            )
          })
        }
        </div>
      </ToggleDisplay>
    </div>
    )
  }

}