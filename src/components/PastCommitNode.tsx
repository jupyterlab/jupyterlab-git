import {
  pastCommitNodeStyle,
  pastCommitHeaderStyle,
  pastCommitHeaderItemStyle,
  pastCommitBodyStyle,
  branchStyle,
  branchesStyle,
  remoteBranchStyle,
  localBranchStyle,
  workingBranchStyle,
  pastCommitExpandedStyle,
  collapseStyle
} from "../componentsStyle/PastCommitNodeStyle";

import { classes } from "typestyle";

import { SingleCommitInfo, GitBranchResult } from "../git";

import { SinglePastCommitInfo } from "./SinglePastCommitInfo";

import * as React from "react";

export interface IPastCommitNodeProps {
  pastCommit: SingleCommitInfo;
  branches: GitBranchResult["branches"];
  topRepoPath: string;
  currentTheme: string;
  app: any;
  diff: any;
  refresh: any;
}

export interface IPastCommitNodeState {
  expanded: boolean;
}

export class PastCommitNode extends React.Component<
  IPastCommitNodeProps,
  IPastCommitNodeState
> {
  constructor(props: IPastCommitNodeProps) {
    super(props);
    this.state = {
      expanded: false
    };
  }
  getBranchesForCommit() {
    const idAbrev = this.props.pastCommit.commit.slice(0, 7);
    const branches = [];
    for (let i = 0; i < this.props.branches.length; i++) {
      const branch = this.props.branches[i];
      // tag sent from describe command. Must unparse to find commit hash
      // https://git-scm.com/docs/git-describe#git-describe-ltcommit-ishgt82308203
      if (!branch.tag) {
        continue;
      }
      const tagParts = branch.tag.split("-");
      const lastTagPart = tagParts[tagParts.length - 1];
      if (lastTagPart[0] == "g") {
        const currentIdAbrev = lastTagPart.slice(1);
        if (currentIdAbrev == idAbrev) {
          branches.push(branch);
        }
      }
    }
    return branches;
  }

  expand() {
    this.setState({expanded: true});
  }

  collapse() {
    this.setState({expanded: false});
  }

  getNodeClass() {
    if (this.state.expanded) {
      return classes(pastCommitNodeStyle, pastCommitExpandedStyle)
    }
    return pastCommitNodeStyle
  }
  render() {
    return (
      <div
        onClick={() => {!this.state.expanded && this.expand()}}
        className={this.getNodeClass()}
      >
        <div className={pastCommitHeaderStyle}>
          <div className={pastCommitHeaderItemStyle}>
            {this.props.pastCommit.author}
          </div>
          <div className={pastCommitHeaderItemStyle}>
            {this.props.pastCommit.commit.slice(0, 9)}
          </div>
          <div className={pastCommitHeaderItemStyle}>
            {this.props.pastCommit.date}
          </div>
        </div>
        <div className={branchesStyle}>
          {this.getBranchesForCommit().map((branch, id) => (
            <React.Fragment key={id}>
              {branch.is_current_branch && (
                <span className={classes(branchStyle, workingBranchStyle)}>
                  working
                </span>
              )}
              <span
                className={classes(
                  branchStyle,
                  branch.is_remote_branch ? remoteBranchStyle : localBranchStyle
                )}
              >
                {branch.name}
              </span>
            </React.Fragment>
          ))}
        </div>
        <div className={pastCommitBodyStyle}>
          {this.props.pastCommit.commit_msg}
          {this.state.expanded && (
            <>
              <SinglePastCommitInfo
                data={this.props.pastCommit}
                topRepoPath={this.props.topRepoPath}
                currentTheme={this.props.currentTheme}
                app={this.props.app}
                diff={this.props.diff}
                refresh={this.props.refresh}
              />
              <div className={collapseStyle} onClick={() => this.collapse()}>
                Collapse
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}
