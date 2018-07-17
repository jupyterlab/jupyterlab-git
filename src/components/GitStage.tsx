import {
  JupyterLab
} from '@jupyterlab/application'

import {
  fileStyle,
  fileGitButtonStyle,
  fileLabelStyle,
  fileIconStyle,

  sectionFileContainerStyle,

  sectionAreaStyle,
  sectionHeaderLabelStyle,

  changeStageButtonStyle,
  caretdownImageStyle,
  caretrightImageStyle,
  fileButtonStyle,
  changeStageButtonRightStyle
} from '../components_style/FileListStyle'

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
  moveAllFilesUp: Function
  moveAllFilesDown: Function
  moveFileUp: Function
  moveFileDown: Function
  moveFileUpIconClass: string
  moveFileDownIconClass: string
  moveAllFilesUpTitle: string
  moveAllFilesDownTitle: string
  moveFileUpTitle: string
  moveFileDownTitle: string
  openFile: Function
  extractFilename: Function
  contextMenu: Function
  parseFileExtension: Function
} 

export class GitStage extends React.Component<IGitStageProps, {}> {
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
        <button 
          className={`jp-Git-header-button ${this.props.moveFileUpIconClass} ${changeStageButtonStyle} ${changeStageButtonRightStyle}`} 
          title={this.props.moveAllFilesUpTitle}
          onClick={() => this.props.moveAllFilesUp(this.props.topRepoPath, this.props.refresh)} 
        />
        <button 
          className={`jp-Git-header-button ${this.props.moveFileDownIconClass} ${changeStageButtonStyle} ${changeStageButtonRightStyle}`} 
          title={this.props.moveAllFilesDownTitle}
          onClick={() => this.props.moveAllFilesDown(this.props.topRepoPath, this.props.refresh)}
        />
        </ToggleDisplay>
      </div>
      <ToggleDisplay show={this.props.showFiles}>
        <div className={sectionFileContainerStyle}>
          {this.props.files.map((file, file_index)=>
            <li className={fileStyle + ' ' + 'jp-Git-file'} key={file_index}>
            <span className={`${fileIconStyle} ${this.props.parseFileExtension(file.to)}`} />
            <span 
              className={fileLabelStyle} 
              onContextMenu={(e) => {this.props.contextMenu(e, file.x, file.y, file.to)}} 
              onDoubleClick={() => this.props.openFile(file.x, file.y, file.to, this.props.app)}
            >
              {this.props.extractFilename(file.to)} [{file.y}]
            </span>
            <button 
              className= {`${fileGitButtonStyle} ${fileButtonStyle} ${changeStageButtonStyle} ${changeStageButtonRightStyle} jp-Git-button ${this.props.moveFileDownIconClass}`} 
              title={this.props.moveFileUpTitle} 
              onClick={() => {
                this.props.moveFileDown(file.to, this.props.topRepoPath, this.props.refresh)
                }
              } 
            />
            <button 
              className= {`jp-Git-button ${fileButtonStyle} ${changeStageButtonStyle} ${changeStageButtonRightStyle} ${fileGitButtonStyle} ${this.props.moveFileUpIconClass}`} 
              title={this.props.moveFileDownTitle}
              onClick={() => {
                this.props.moveFileUp(file.to, this.props.topRepoPath, this.props.refresh)
                }
              }
            />
            </li>
          )}
        </div>
      </ToggleDisplay>
    </div>
    )
  }

}