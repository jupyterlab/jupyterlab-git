import * as React from 'react'

export interface IPastCommitNodeInfoProps {
  index: number
}
  
export class PastCommitNodeInfo extends React.Component<IPastCommitNodeInfoProps, {}> {
  constructor(props: IPastCommitNodeInfoProps) {
    super(props)
  }
  render() {
    return(
      <div className = 'jp-Git-commit-index'>
        {this.props.index === 0 ? 'H' : this.props.index}
      </div>
    )
  }
}