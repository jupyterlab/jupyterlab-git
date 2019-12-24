import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { GitExtension } from '../model';
import { historySideBarStyle } from '../style/HistorySideBarStyle';
import { Git } from '../tokens';
import { PastCommitNode } from './PastCommitNode';

/** Interface for WorkingFolder component props */
export interface IHistorySideBarProps {
  pastCommits: Git.ISingleCommitInfo[];
  branches: Git.IBranch[];
  isExpanded: boolean;
  model: GitExtension;
  refreshHistory: () => Promise<void>;
  renderMime: IRenderMimeRegistry;
}

export class HistorySideBar extends React.Component<IHistorySideBarProps, {}> {
  render() {
    if (!this.props.isExpanded) {
      return null;
    }
    return (
      <ol className={historySideBarStyle}>
        {this.props.pastCommits.map((pastCommit: Git.ISingleCommitInfo) => (
          <PastCommitNode
            key={pastCommit.commit}
            pastCommit={pastCommit}
            branches={this.props.branches}
            model={this.props.model}
            refreshHistory={this.props.refreshHistory}
            renderMime={this.props.renderMime}
          />
        ))}
      </ol>
    );
  }
}
