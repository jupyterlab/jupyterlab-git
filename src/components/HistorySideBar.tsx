import { Git } from '../git';

import { PastCommitNode } from './PastCommitNode';

import {
  historySideBarStyle,
  historySideBarExpandedStyle
} from '../components_style/HistorySideBarStyle';

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

  render() {
    return (
      <div className={this.getSideBarClass()}>
        <PastCommitNode
            key={-1}
            index={-1}
            isLast={false}
            pastCommit={null}
            currentFileBrowserPath={this.props.currentFileBrowserPath}
            setShowList={this.props.setShowList}
            getPastCommit={this.props.getPastCommit}
          />
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
