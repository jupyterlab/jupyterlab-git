export namespace PathHeader {
  export interface IState {
    top_repo_path: string
    refresh: any
  }

  export interface IProps {
    current_fb_path: string
    top_repo_path: string
    refresh: any
  }
}

import * as React from 'react'

import '../../style/index.css'

export class PathHeader extends React.Component<PathHeader.IProps, PathHeader.IState> {
  constructor(props: PathHeader.IProps) {
    super(props)
    this.state = {top_repo_path: props.top_repo_path, refresh : props.refresh}
  }

  render() {
    return (
        <div>
          <li className='jp-Git-repo'>
            <span className='jp-Git-repo-icon'/>
            <span className='jp-Git-repo-path'> 
              {this.props.top_repo_path}
              </span> 
            <button className='jp-Git-repo-refresh'  onClick={()=>this.props.refresh()} />
          </li>
        </div>
    )
  }
}





