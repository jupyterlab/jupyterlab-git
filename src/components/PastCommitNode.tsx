import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import {
  branchesStyle,
  branchStyle,
  collapseStyle,
  localBranchStyle,
  pastCommitBodyStyle,
  pastCommitExpandedStyle,
  pastCommitHeaderItemStyle,
  pastCommitHeaderStyle,
  pastCommitNodeStyle,
  remoteBranchStyle,
  workingBranchStyle
} from '../style/PastCommitNodeStyle';
import { Git } from '../tokens';
import { SinglePastCommitInfo } from './SinglePastCommitInfo';

export interface IPastCommitNodeProps {
  pastCommit: Git.ISingleCommitInfo;
  branches: Git.IBranch[];
  model: GitExtension;
  renderMime: IRenderMimeRegistry;
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
    const currentCommit = this.props.pastCommit.commit;
    const branches = [];
    for (let i = 0; i < this.props.branches.length; i++) {
      const branch = this.props.branches[i];
      if (branch.top_commit && branch.top_commit === currentCommit) {
        branches.push(branch);
      }
    }
    return branches;
  }

  expand() {
    this.setState(() => ({ expanded: true }));
  }

  collapse() {
    this.setState(() => ({ expanded: false }));
  }

  getNodeClass() {
    if (this.state.expanded) {
      return classes(pastCommitNodeStyle, pastCommitExpandedStyle);
    }
    return pastCommitNodeStyle;
  }
  render() {
    return (
      <li
        onClick={() => {
          // tslint:disable-next-line: no-unused-expression
          !this.state.expanded && this.expand();
        }}
        className={this.getNodeClass()}
      >
        <div className={pastCommitHeaderStyle}>
          <div className={pastCommitHeaderItemStyle}>
            {this.props.pastCommit.author}
          </div>
          <div className={pastCommitHeaderItemStyle}>
            {this.props.pastCommit.commit.slice(0, 7)}
          </div>
          <div className={pastCommitHeaderItemStyle}>
            {this.props.pastCommit.date}
          </div>
        </div>
        <div className={branchesStyle}>
          {this.getBranchesForCommit().map((branch, id) => (
            <React.Fragment key={id}>
              {branch.name === this.props.model.currentBranch.name && (
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
            <React.Fragment>
              <SinglePastCommitInfo
                data={this.props.pastCommit}
                model={this.props.model}
                renderMime={this.props.renderMime}
              />
              <div className={collapseStyle} onClick={() => this.collapse()}>
                Collapse
              </div>
            </React.Fragment>
          )}
        </div>
      </li>
    );
  }
}
