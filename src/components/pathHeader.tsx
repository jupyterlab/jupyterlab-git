import {
  gitRepoStyle,
  gitRepoPathStyle,
  gitRepoRefreshStyle
} from '../components_style/PathHeaderStyle'

import * as React from 'react'

import '../../style/index.css'

export interface IPathHeaderState {
  topRepoPath: string
  refresh: any
}

export interface IPathHeaderProps {
  currentFileBrowserPath: string
  topRepoPath: string
  refresh: any
}

export class PathHeader extends React.Component<IPathHeaderProps, IPathHeaderState> {
  constructor(props: IPathHeaderProps) {
    super(props)
    this.state = {
      topRepoPath: props.topRepoPath, 
      refresh: props.refresh
    }
  }

  render() {
    return (
        <div>
          <li className={gitRepoStyle}>
            <span className='jp-Git-repo-icon'/>
            <span className={gitRepoPathStyle}> 
              {this.props.topRepoPath}
              </span> 
            <button className={gitRepoRefreshStyle} onClick={()=>this.props.refresh()} />
          </li>
        </div>
    )
  }
}





