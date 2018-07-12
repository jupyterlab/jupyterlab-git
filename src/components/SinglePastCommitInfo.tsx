import {
  JupyterLab
} from '@jupyterlab/application'
  
import {
  SingleCommitInfo,CommitModifiedFile
} from '../git'

import {
  parseFileExtension
} from './statusFiles'

import * as React from 'react'

import '../../style/index.css'

/**
 * The class name added to a git-plugin session item icon.
 */
const GIT_FILE_ICON = 'jp-Git-fileIcon'
  
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
    return (
      <div>
      <div className='jp-Git-singlePastCommit'>
        <div className='jp-Git-singlePastCommit-header'>
          <span className='jp-Git-singlePastCommit-label-commit-number'> 
            #{this.props.data.commit?this.props.data.commit.substring(0,7):''}
          </span>
          <span className='jp-Git-singlePastCommit-label-summary'> 
            <span className= 'jp-files-changed-white'> 
              <span className='jp-Git-icon-directory-white'/> 
              {this.props.filesChanged} 
            </span>
            <span className= 'jp-insertions-made-white'> 
              <span className='jp-Git-icon-insertion-white'/>  
              {this.props.insertionCount} 
            </span>
            <span className= 'jp-deletions-made-white'> 
              <span className='jp-Git-icon-deletion-white'/>  
              {this.props.deletionCount} 
            </span>
          </span>
        </div>
        <div className='jp-Git-singlePastCommit-label-author'> 
          <span className="jp-Git-icon-author"/> 
          {this.props.data.author}
        </div>
        <div className='jp-Git-singlePastCommit-label-date'> 
          {this.props.data.date}
        </div>
        <div className='jp-Git-singlePastCommit-label-commit-message'> 
          "<span className="jp-past-commit-message"/>
          {this.props.data.commit_msg}"
        </div>
      </div>
      <div className='jp-Git-singlePastCommitDetail'>
          {this.props.list.map((mf, mf_index)=> {
            <li className='jp-Git-singlePastCommitDetail-file' key={mf_index} >
              <span 
                className={`${GIT_FILE_ICON} ${parseFileExtension(mf.modified_file_path)}`} 
                onDoubleClick={() => {
                  window.open('https://github.com/search?q='+this.props.data.commit+'&type=Commits&utf8=%E2%9C%93'
                  )}
                }
              />
              <span 
                className='jp-Git-singlePastCommitDetail-file-path'  
                onDoubleClick={()=> {
                  this.props.diff(
                    this.props.app,mf.modified_file_path, 
                    this.props.data.commit, 
                    this.props.data.pre_commit
                  )}
                }
              >
                {mf.modified_file_name}
              </span>
              <span 
                className='jp-Git-light'  
                onDoubleClick={() => {
                  this.props.diff(
                    this.props.app,mf.modified_file_path, 
                    this.props.data.commit, 
                    this.props.data.pre_commit
                  )}
                  }
                > 
                {mf.modified_file_path}
              </span>
              <span className='jp-modifications'>
                <span className='jp-deletions-made-color'>
                    <span className="jp-Git-modNumber-deletions"> 
                      {mf.deletion}
                    </span>   
                    <span className='jp-Git-icon-deletion-color' />  
                </span>
                <span className='jp-insertions-made-color'>
                    <span className="jp-Git-modNumber-insertions">
                      {mf.insertion}
                    </span>
                    <span className='jp-Git-icon-insertion-color' />
                </span>
              </span>
            </li>
          })
        }
      </div>
      </div>
    )
  }
}