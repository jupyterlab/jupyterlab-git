import { JupyterLab } from '@jupyterlab/application';
import * as React from 'react';
import { historySideBarStyle } from '../componentsStyle/HistorySideBarStyle';
import { GitBranchResult, SingleCommitInfo, IDiffCallback } from '../git';
import { PastCommitNode } from './PastCommitNode';

/** Interface for PastCommits component props */
export interface IHistorySideBarProps {
  pastCommits: SingleCommitInfo[];
  branches: GitBranchResult['branches'];
  isExpanded: boolean;
  topRepoPath: string;
  app: JupyterLab;
  refresh: () => void;
  diff: IDiffCallback;
}

export class HistorySideBar extends React.Component<IHistorySideBarProps, {}> {
  render() {
    if (!this.props.isExpanded) {
      return null;
    }
    return (
      <div className={historySideBarStyle}>
        {this.props.pastCommits.map(
          (pastCommit: SingleCommitInfo, pastCommitIndex: number) => (
            <PastCommitNode
              key={pastCommitIndex}
              pastCommit={pastCommit}
              branches={this.props.branches}
              topRepoPath={this.props.topRepoPath}
              app={this.props.app}
              refresh={this.props.refresh}
              diff={this.props.diff}
            />
          )
        )}
      </div>
    );
  }
}
