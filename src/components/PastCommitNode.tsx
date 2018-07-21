import {
  pastCommitNodeStyle,
  pastCommitLineStyle,
  pastCommitLastLineStyle,
  pastCommitWorkingNodeStyle
} from '../components_style/HistorySideBarStyle';

import {
  classes
} from 'typestyle';

import * as React from 'react';

export interface IPastCommitNodeProps {
  index: number,
  isLast: boolean,
  pastCommit: any,
  currentFileBrowserPath: string,
  setShowList: Function,
  getPastCommit: Function
}

export class PastCommitNode extends React.Component<IPastCommitNodeProps, {}> {
  constructor(props) {
    super(props);
  }

  getPastCommitNodeClass(index: number) : string {
    return index === 0 ?
      classes(pastCommitWorkingNodeStyle, pastCommitNodeStyle)
    :
      pastCommitNodeStyle;

  }

  getPastCommitLineClass(index: number) : string {
    return this.props.isLast ? 
      pastCommitLastLineStyle
    :
      pastCommitLineStyle;
  }

  getNodeContent() : string | number {
    if(this.props.index === 0) {
      return 'Working';
    } else if(this.props.index === 1) {
      return 'Head';
    } else {
      return this.props.index;
    }
  }

  getShowListFunction() : void {
    this.props.index === 0 ?
      this.props.setShowList(true)
    :
      this.props.setShowList(false)
  }

  render() {
    return (
      <div key={this.props.index}>
        <div 
          className={this.getPastCommitNodeClass(this.props.index)} 
          onClick={() => {
            this.props.getPastCommit(this.props.pastCommit, this.props.index, this.props.currentFileBrowserPath)
            this.getShowListFunction()
            }
          }
        >
          {this.getNodeContent()}
        </div>

        <div className={this.getPastCommitLineClass(this.props.index)} />
      </div>
    )
  }
}