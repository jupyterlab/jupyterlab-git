export namespace PathHeader {
  export interface IState {
    topRepoPath: string
    refresh: any
  }

  export interface IProps {
    currentFileBrowserPath: string
    topRepoPath: string
    refresh: any
  }
}

import * as React from 'react'

import '../../style/index.css'

export class PathHeader extends React.Component<PathHeader.IProps, PathHeader.IState> {
  constructor(props: PathHeader.IProps) {
    super(props)
    this.state = {topRepoPath: props.topRepoPath, refresh : props.refresh}
  }

  render() {
    return (
        <div>
          <li className='jp-Git-repo'>
            <span className='jp-Git-repo-icon'/>
            <span className='jp-Git-repo-path'> 
              {this.props.topRepoPath}
              </span> 
            <button className='jp-Git-repo-refresh'  onClick={()=>this.props.refresh()} />
          </li>
        </div>
    )
  }
}





