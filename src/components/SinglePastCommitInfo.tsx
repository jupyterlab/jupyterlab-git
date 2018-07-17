import {
  JupyterLab
} from '@jupyterlab/application'
  
import {
  SingleCommitInfo, CommitModifiedFile
} from '../git'

import {
  parseFileExtension
} from './FileList'

import {
  commitStyle,
  headerStyle,

  commitNumberLabelStyle,
  commitAuthorLabelStyle,
  commitAuthorIconStyle,
  commitLabelDateStyle,
  commitLabelMessageStyle,
  commitSummaryLabelStyle,
  commitFilesChangedStyle,
  commitInsertionsMadeStyle,
  commitDeletionsMadeStyle,

  commitDeletionsMadeColorStyle,
  commitInsertionsMadeColorStyle,

  commitDetailStyle,
  commitDetailFileStyle,
  commitDetailFilePathStyle,

  iconStyle,
  iconWhiteStyle,
  directoryIconWhiteStyle,
  insertionIconColorStyle,
  insertionIconWhiteStyle,
  deletionIconColorStyle,
  deletionIconWhiteStyle,
  
  numberOfDeletionsStyle,
  numberOfInsertionsStyle,

  modificationsStyle
} from '../components_style/SinglePastCommitInfoStyle'

import {
  fileIconStyle
} from '../components_style/FileListStyle'

import * as React from 'react'

import '../../style/index.css'
  
export interface ISinglePastCommitInfoProps {
  num: string
  data: SingleCommitInfo
  info: string
  filesChanged: string,
  insertionCount :string,
  deletionCount: string,
  list: [CommitModifiedFile]
  app: JupyterLab
  diff: any
}

export class SinglePastCommitInfo extends React.Component<ISinglePastCommitInfoProps, {}>{
  constructor(props: ISinglePastCommitInfoProps) {
    super(props)
  }

  render() {
    console.log(this.props.list)
    return (
      <div>
        <div className={commitStyle}>
          <div className={headerStyle}>
            <span className={commitNumberLabelStyle}> 
              #{this.props.data.commit ? this.props.data.commit.substring(0, 7) : ''}
            </span>
            <span className={commitSummaryLabelStyle}> 
              <span className={commitFilesChangedStyle}> 
                <span className={` ${iconWhiteStyle} ${iconStyle} ${directoryIconWhiteStyle} `}/> 
                {this.props.filesChanged} 
              </span>
              <span className={commitInsertionsMadeStyle}> 
                <span className={` ${iconWhiteStyle} ${iconStyle} ${insertionIconWhiteStyle} `}/>  
                {this.props.insertionCount} 
              </span>
              <span className={commitDeletionsMadeStyle}> 
                <span className={` ${iconWhiteStyle} ${iconStyle} ${deletionIconWhiteStyle} `}/>  
                {this.props.deletionCount} 
              </span>
            </span>
          </div>
          <div className={commitAuthorLabelStyle}> 
            <span className={commitAuthorIconStyle}/> 
            {this.props.data.author}
          </div>
          <div className={commitLabelDateStyle}> 
            {this.props.data.date}
          </div>
          <div className={commitLabelMessageStyle}> 
            "<span className="jp-past-commit-message"/>
            {this.props.data.commit_msg}"
          </div>
        </div>
        <div className={commitDetailStyle}>
            {this.props.list.map((modifiedFile, modifiedFileIndex) => {
              return (
                <li className={commitDetailFileStyle} key={modifiedFileIndex} >
                  <span 
                    className={` ${fileIconStyle} ${parseFileExtension(modifiedFile.modified_file_path)} `} 
                    onDoubleClick={() => {
                      window.open('https://github.com/search?q=' + this.props.data.commit + '&type=Commits&utf8=%E2%9C%93'
                      )}
                    }
                  />
                  <span 
                    className={commitDetailFilePathStyle}  
                    onDoubleClick={()=> {
                      this.props.diff(
                        this.props.app,modifiedFile.modified_file_path, 
                        this.props.data.commit, 
                        this.props.data.pre_commit
                      )}
                    }
                  >
                    {modifiedFile.modified_file_name}
                  </span>
                  <span 
                    className='jp-Git-light'  
                    onDoubleClick={() => {
                      this.props.diff(
                        this.props.app,modifiedFile.modified_file_path, 
                        this.props.data.commit, 
                        this.props.data.pre_commit
                      )}
                      }
                    > 
                    {modifiedFile.modified_file_path}
                  </span>
                  <span className={modificationsStyle}>
                    <span className={commitDeletionsMadeColorStyle}>
                        <span className={numberOfDeletionsStyle}> 
                          {modifiedFile.deletion}
                        </span>   
                        <span className={` ${iconStyle} ${deletionIconColorStyle} `} />  
                    </span>
                    <span className={commitInsertionsMadeColorStyle}>
                        <span className={numberOfInsertionsStyle}>
                          {modifiedFile.insertion}
                        </span>
                        <span className={` ${iconStyle} ${insertionIconColorStyle} `} />
                    </span>
                  </span>
                </li>
              )
            })
          }
        </div>
      </div>
    )
  }
}