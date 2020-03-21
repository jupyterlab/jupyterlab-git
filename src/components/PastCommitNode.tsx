import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import { Git } from '../tokens';
import {
  branchesClass,
  branchClass,
  collapseIconClass,
  expandButtonIconClass,
  expandIconClass,
  localBranchClass,
  pastCommitBodyClass,
  pastCommitExpandedClass,
  pastCommitHeaderItemClass,
  pastCommitHeaderClass,
  pastCommitNodeClass,
  remoteBranchClass,
  workingBranchClass
} from '../style/PastCommitNodeStyle';
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

  getNodeClass() {
    if (this.state.expanded) {
      return classes(pastCommitNodeClass, pastCommitExpandedClass);
    }
    return pastCommitNodeClass;
  }

  render() {
    return (
      <li
        onClick={() => {
          this.setState({ expanded: !this.state.expanded });
        }}
        className={this.getNodeClass()}
      >
        <div className={pastCommitHeaderClass}>
          <span className={pastCommitHeaderItemClass}>
            {this.props.pastCommit.author}
          </span>
          <span className={pastCommitHeaderItemClass}>
            {this.props.pastCommit.commit.slice(0, 7)}
          </span>
          <span className={pastCommitHeaderItemClass}>
            {this.props.pastCommit.date}
          </span>
          <span
            className={classes(
              expandButtonIconClass,
              this.state.expanded ? collapseIconClass : expandIconClass,
              'jp-Icon-16'
            )}
          />
        </div>
        <div className={branchesClass}>
          {this.getBranchesForCommit().map(branch => (
            <React.Fragment key={branch.name}>
              {branch.is_current_branch && (
                <span className={classes(branchClass, workingBranchClass)}>
                  working
                </span>
              )}
              <span
                className={classes(
                  branchClass,
                  branch.is_remote_branch ? remoteBranchClass : localBranchClass
                )}
              >
                {branch.name}
              </span>
            </React.Fragment>
          ))}
        </div>
        <div className={pastCommitBodyClass}>
          {this.props.pastCommit.commit_msg}
          {this.state.expanded && (
            <React.Fragment>
              <SinglePastCommitInfo
                data={this.props.pastCommit}
                model={this.props.model}
                renderMime={this.props.renderMime}
              />
            </React.Fragment>
          )}
        </div>
      </li>
    );
  }
}
