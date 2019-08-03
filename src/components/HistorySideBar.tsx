import { JupyterFrontEnd } from '@jupyterlab/application';
import * as React from 'react';
import { historySideBarStyle } from '../componentsStyle/HistorySideBarStyle';
import { IGitBranchResult, ISingleCommitInfo, IDiffCallback } from '../git';
import { PastCommitNode } from './PastCommitNode';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IThemeManager } from '@jupyterlab/apputils';

/** Interface for PastCommits component props */
export interface IHistorySideBarProps {
  pastCommits: ISingleCommitInfo[];
  branches: IGitBranchResult['branches'];
  isExpanded: boolean;
  topRepoPath: string;
  app: JupyterFrontEnd;
  refresh: () => void;
  diff: IDiffCallback;
  renderMime: IRenderMimeRegistry;
  themeManager: IThemeManager;
}

export class HistorySideBar extends React.Component<IHistorySideBarProps, {}> {
  render() {
    if (!this.props.isExpanded) {
      return null;
    }
    return (
      <div className={historySideBarStyle}>
        {this.props.pastCommits.map(
          (pastCommit: ISingleCommitInfo, pastCommitIndex: number) => (
            <PastCommitNode
              key={pastCommitIndex}
              pastCommit={pastCommit}
              branches={this.props.branches}
              topRepoPath={this.props.topRepoPath}
              app={this.props.app}
              refresh={this.props.refresh}
              diff={this.props.diff}
              renderMime={this.props.renderMime}
              themeManager={this.props.themeManager}
            />
          )
        )}
      </div>
    );
  }
}
