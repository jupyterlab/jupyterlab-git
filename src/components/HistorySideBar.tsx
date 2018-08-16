import { PastCommitNode } from './PastCommitNode';

import { SingleCommitInfo } from '../git';

import {
  historySideBarStyle,
  historySideBarExpandedStyle
} from '../componentsStyle/HistorySideBarStyle';

import { classes } from 'typestyle';

import * as React from 'react';

/** Interface for PastCommits component props */
export interface IHistorySideBarProps {
  currentFileBrowserPath: string;
  pastCommits: SingleCommitInfo[];
  isExpanded: boolean;
  setShowList: Function;
  getPastCommit: Function;
}

/** Interface for PastCommits component state */
export interface IHistorySideBarState {
  activeNode: number;
}

export class HistorySideBar extends React.Component<
  IHistorySideBarProps,
  IHistorySideBarState
> {
  constructor(props: IHistorySideBarProps) {
    super(props);

    this.state = {
      activeNode: -1
    };
  }

  getSideBarClass(): string {
    return this.props.isExpanded
      ? classes(historySideBarExpandedStyle, historySideBarStyle)
      : historySideBarStyle;
  }

  updateActiveNode = (index: number): void => {
    this.setState({ activeNode: index });
  };

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
          activeNode={this.state.activeNode}
          updateActiveNode={this.updateActiveNode}
          isVisible={this.props.isExpanded}
        />
        {this.props.pastCommits.map(
          (pastCommit: SingleCommitInfo, pastCommitIndex: number) => (
            <PastCommitNode
              key={pastCommitIndex}
              index={pastCommitIndex}
              isLast={pastCommitIndex === this.props.pastCommits.length - 1}
              pastCommit={pastCommit}
              currentFileBrowserPath={this.props.currentFileBrowserPath}
              setShowList={this.props.setShowList}
              getPastCommit={this.props.getPastCommit}
              activeNode={this.state.activeNode}
              updateActiveNode={this.updateActiveNode}
              isVisible={this.props.isExpanded}
            />
          )
        )}
      </div>
    );
  }
}
