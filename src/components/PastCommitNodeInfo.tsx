import * as React from 'react'

import {
  gitCommitIndexStyle
} from '../components_style/PastCommitsStyle'

export interface IPastCommitNodeInfoProps {
  index: number
}
  
export class PastCommitNodeInfo extends React.Component<IPastCommitNodeInfoProps, {}> {
  constructor(props: IPastCommitNodeInfoProps) {
    super(props)
  }
  render() {
    return(
      <div className = {gitCommitIndexStyle}>
        {this.props.index === 0 ? 'H' : this.props.index}
      </div>
    )
  }
}