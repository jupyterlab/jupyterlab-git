import {
  pastCommitNodeStyle,
  pastCommitLineStyle,
  pastCommitLastLineStyle,
  pastCommitWorkingNodeStyle
} from '../components_style/PastCommitNodeStyle';

import { classes } from 'typestyle';

import * as React from 'react';

export interface IPastCommitNodeProps {
  index: number;
  isLast: boolean;
  pastCommit: any;
  currentFileBrowserPath: string;
  setShowList: Function;
  getPastCommit: Function;
}

export class PastCommitNode extends React.Component<IPastCommitNodeProps, {}> {
  constructor(props) {
    super(props);
  }

  getPastCommitNodeClass(): string {
    return this.props.index === -1
      ? classes(pastCommitWorkingNodeStyle, pastCommitNodeStyle)
      : pastCommitNodeStyle;
  }

  getPastCommitLineClass(): string {
    return this.props.isLast ? pastCommitLastLineStyle : pastCommitLineStyle;
  }

  getNodeContent(): string | number {
    if (this.props.index === -1) {
      return 'Working';
    } else if (this.props.index === 0) {
      return 'Head';
    } else {
      return this.props.index;
    }
  }

  handleClick(): void {
    this.props.index === -1
      ? this.props.setShowList(true)
      : (this.props.getPastCommit(
          this.props.pastCommit,
          this.props.index,
          this.props.currentFileBrowserPath
        ),
        this.props.setShowList(false));
  }

  render() {
    return (
      <div key={this.props.index}>
        <div
          className={this.getPastCommitNodeClass()}
          onClick={() => this.handleClick()}
        >
          {this.getNodeContent()}
        </div>
        <div className={this.getPastCommitLineClass()} />
      </div>
    );
  }
}
