import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import { Git } from '../tokens';
import {
  branchWrapperClass,
  branchClass,
  collapseIconButtonClass,
  commitBodyClass,
  commitExpandedClass,
  commitHeaderClass,
  commitHeaderItemClass,
  commitWrapperClass,
  expandIconButtonClass,
  iconButtonClass,
  localBranchClass,
  remoteBranchClass,
  workingBranchClass
} from '../style/PastCommitNodeStyle';
import { SinglePastCommitInfo } from './SinglePastCommitInfo';

/**
 * Interface describing component properties.
 */
export interface IPastCommitNodeProps {
  /**
   * Commit data.
   */
  commit: Git.ISingleCommitInfo;
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
    const currentCommit = this.props.commit.commit;
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
      return classes(commitWrapperClass, commitExpandedClass);
    }
    return commitWrapperClass;
  }

  render() {
    return (
      <li
        onClick={() => {
          this.setState({ expanded: !this.state.expanded });
        }}
        className={this.getNodeClass()}
      >
        <div className={commitHeaderClass}>
          <span className={commitHeaderItemClass}>
            {this.props.commit.author}
          </span>
          <span className={commitHeaderItemClass}>
            {this.props.commit.commit.slice(0, 7)}
          </span>
          <span className={commitHeaderItemClass}>
            {this.props.commit.date}
          </span>
          <span
            className={classes(
              iconButtonClass,
              this.state.expanded
                ? collapseIconButtonClass
                : expandIconButtonClass,
              'jp-Icon-16'
            )}
          />
        </div>
        <div className={branchWrapperClass}>
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
        <div className={commitBodyClass}>
          {this.props.commit.commit_msg}
          {this.state.expanded && (
            <React.Fragment>
              <SinglePastCommitInfo
                commit={this.props.commit}
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
