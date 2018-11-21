import {
  pastCommitNodeStyle,
  pastCommitHeaderStyle,
  pastCommitHeaderItemStyle,
  pastCommitBodyStyle,
  branchStyle,
  branchesStyle,
  remoteBranchStyle,
  localBranchStyle,
  workingBranchStyle
} from "../componentsStyle/PastCommitNodeStyle";

import { classes } from "typestyle";

import { SingleCommitInfo, GitBranchResult } from "../git";

import * as React from "react";

export interface IPastCommitNodeProps {
  pastCommit: SingleCommitInfo;
  data: GitBranchResult["branches"];
}

export class PastCommitNode extends React.Component<IPastCommitNodeProps, {}> {
  getBranchesForCommit() {
    const idAbrev = this.props.pastCommit.commit.slice(0, 7);
    const branches = [];
    for (let i = 0; i < this.props.data.length; i++) {
      const branch = this.props.data[i];
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

  render() {
    return (
      <div className={pastCommitNodeStyle}>
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
            <>
              {branch.is_current_branch && (
                <span className={classes(branchStyle, workingBranchStyle)} key={id}>
                  working
                </span>
              )}
              <span
                className={classes(
                  branchStyle,
                  branch.is_remote_branch ? remoteBranchStyle : localBranchStyle
                )}
                key={id}
              >
                {branch.name}
              </span>
            </>
          ))}
        </div>
        <div className={pastCommitBodyStyle}>
          {this.props.pastCommit.commit_msg}
        </div>
      </div>
    );
  }
}
