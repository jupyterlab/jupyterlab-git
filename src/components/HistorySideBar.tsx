import { PastCommitNode } from "./PastCommitNode";

import { SingleCommitInfo, GitBranchResult } from "../git";

import {
  historySideBarStyle,
} from "../componentsStyle/HistorySideBarStyle";


import * as React from "react";

/** Interface for PastCommits component props */
export interface IHistorySideBarProps {
  pastCommits: SingleCommitInfo[];
  branches: GitBranchResult["branches"];
  isExpanded: boolean;
  topRepoPath: string;
  currentTheme: string;
  app: any;
  refresh: any;
  diff: any;
}



export class HistorySideBar extends React.Component<
  IHistorySideBarProps,
  {}
> {
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
              currentTheme={this.props.currentTheme}
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
