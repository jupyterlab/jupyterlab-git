import {
  JupyterLab
} from '@jupyterlab/application'

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
} from '../components_style/FileListStyle'

import {
  cancelDiscardButtonStyle,
  acceptDiscardButtonStyle,
  discardButtonStyle,
  discardWarningStyle
} from '../components_style/FileItemStyle'

import {
  FileItem
} from './FileItem'

import {
  classes 
} from 'typestyle/lib'

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
  discardAllFiles: Function
  discardFile: Function
  moveFile: Function
  moveFileIconClass: string
  moveFileIconSelectedClass: string
  moveAllFilesTitle: string
  moveFileTitle: string
  openFile: Function
  extractFilename: Function
  contextMenu: Function
  parseFileExtension: Function
  parseSelectedFileExtension: Function
  selectedStage: string
  updateSelectedStage: Function
  isDisabled: boolean
  disableOthers: Function
} 

export interface IGitStageState {
  selectedFile: number
  showDiscardWarning: boolean
  disableFiles: boolean
}

export class GitStage extends React.Component<IGitStageProps, IGitStageState> {
  constructor(props) {
    super(props)
    this.state = {
      selectedFile: -1,
      showDiscardWarning: false,
      disableFiles: false
    }
  }

  checkContents() {
    if(this.props.files.length > 0) {
      return false
    } else {
      return true
    }
  }

  checkDisabled() {
    return this.props.isDisabled ? 
      classes(sectionFileContainerStyle, sectionFileContainerDisabledStyle)
    :
      sectionFileContainerStyle
  }

  updateSelectedFile = (file: any) => {
    this.setState(
      {selectedFile: file},
      () => this.props.updateSelectedStage(this.props.heading)
    )
  }

  toggleDiscardChanges() {
    this.setState(
      {showDiscardWarning: !this.state.showDiscardWarning},
      () => this.props.disableOthers()
    )
  }

  toggleDisableFiles = () : void => {
    this.setState({disableFiles: !this.state.disableFiles})
  }

  render() {
    return (
      <div className={this.checkDisabled()}>
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
          disabled={this.checkContents()}
          className={`${this.props.moveFileIconClass} ${changeStageButtonStyle} 
                      ${changeStageButtonLeftStyle}` } 
          title={this.props.moveAllFilesTitle}
          onClick={() => this.props.moveAllFiles(this.props.topRepoPath, this.props.refresh)} 
        />
        {this.props.heading === 'Changed' &&
          <button 
            disabled={this.checkContents()}
            className={classes(changeStageButtonStyle, discardFileButtonStyle)}
            title={'Discard All Changes'}
            onClick={() => this.toggleDiscardChanges()} 
          />
        }
      </div>
      <ToggleDisplay show={this.props.showFiles}>
        <div className={sectionFileContainerStyle}>
          {this.state.showDiscardWarning && 
            <div className={classes(discardAllWarningStyle, discardWarningStyle)}>
              These changes will be gone forever
              <div>
                <button className={classes(discardButtonStyle, cancelDiscardButtonStyle)} onClick={() => this.toggleDiscardChanges()}>
                  Cancel
                </button>
                <button className={classes(discardButtonStyle, acceptDiscardButtonStyle)} onClick={() => {
                  this.props.discardAllFiles(this.props.topRepoPath, this.props.refresh)
                  this.toggleDiscardChanges()
                    } 
                  }
                >
                  Discard
                </button>
              </div>
            </div>
          }
          {this.props.files.map((file, file_index) => {
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
                moveFileIconSelectedClass={this.props.moveFileIconSelectedClass}
                moveFileTitle={this.props.moveFileTitle}
                openFile={this.props.openFile}
                extractFilename={this.props.extractFilename}
                contextMenu={this.props.contextMenu}
                parseFileExtension={this.props.parseFileExtension}
                parseSelectedFileExtension={this.props.parseSelectedFileExtension}
                selectedFile={this.state.selectedFile}
                updateSelectedFile={this.updateSelectedFile}
                fileIndex={file_index}
                selectedStage={this.props.selectedStage}
                disableFile={this.state.disableFiles}
                toggleDisableFiles={this.toggleDisableFiles}
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