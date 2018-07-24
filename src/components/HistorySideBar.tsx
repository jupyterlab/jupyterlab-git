import { Git } from '../git';

import { PastCommitNode } from './PastCommitNode';

import {
  historySideBarStyle,
  historySideBarExpandedStyle
} from '../components_style/HistorySideBarStyle';

import {
  pastCommitNodeStyle,
  pastCommitLineStyle,
  pastCommitLastLineStyle,
  pastCommitWorkingNodeStyle
} from '../components_style/PastCommitNodeStyle';

import { classes } from 'typestyle';

import * as React from 'react';

/** Interface for PastCommits component props */
export interface IHistorySideBarProps {
  currentFileBrowserPath: string;
  pastCommits: any;
  isExpanded: boolean;
  setShowList: Function;
  getPastCommit: Function;
}

export class HistorySideBar extends React.Component<IHistorySideBarProps, {}> {
  constructor(props) {
    super(props);
  }

  /** Fetch git log info on mount */
  async componentDidMount() {
    let gitApi = new Git();
    let logData = await gitApi.log(this.props.currentFileBrowserPath);
    if (logData.code === 0) {
      this.setState({ data: logData.commits });
    }
  }

  getSideBarClass(): string {
    return this.props.isExpanded
      ? classes(historySideBarExpandedStyle, historySideBarStyle)
      : historySideBarStyle;
  }

  getPastCommitNodeClass(index: number): string {
    return index === 0
      ? classes(pastCommitWorkingNodeStyle, pastCommitNodeStyle)
      : pastCommitNodeStyle;
  }

  getPastCommitLineClass(index: number): string {
    return index !== this.props.pastCommits.length - 1
      ? pastCommitLineStyle
      : pastCommitLastLineStyle;
  }

  getNodeContent(index: number): string | number {
    if (index === 0) {
      return 'Working';
    } else if (index === 1) {
      return 'Head';
    } else {
      return index;
    }
  }

  render() {
    return (
      <div className={this.getSideBarClass()}>
        {this.props.pastCommits.map((pastCommit, pastCommitIndex) => (
          <PastCommitNode
            key={pastCommitIndex}
            index={pastCommitIndex}
            isLast={pastCommitIndex === this.props.pastCommits.length - 1}
            pastCommit={pastCommit}
            currentFileBrowserPath={this.props.currentFileBrowserPath}
            setShowList={this.props.setShowList}
            getPastCommit={this.props.getPastCommit}
          />
        ))}
      </div>
    );
  }
}
