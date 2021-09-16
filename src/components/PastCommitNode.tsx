import { TranslationBundle } from '@jupyterlab/translation';
import { caretDownIcon, caretUpIcon } from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import * as React from 'react';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import { diffIcon } from '../style/icons';
import {
  branchClass,
  branchWrapperClass,
  commitBodyClass,
  commitExpandedClass,
  commitHeaderClass,
  commitHeaderItemClass,
  commitWrapperClass,
  iconButtonClass,
  localBranchClass,
  remoteBranchClass,
  singleFileCommitClass,
  workingBranchClass
} from '../style/PastCommitNode';
import { Git } from '../tokens';

/**
 * Interface describing component properties.
 */
export interface IPastCommitNodeProps {
  /**
   * Commit data.
   */
  commit: Git.ISingleCommitInfo;

  /**
   * List of branches.
   */
  branches: Git.IBranch[];

  /**
   * Extension data model.
   */
  model: GitExtension;

  /**
   * Jupyter App commands registry
   */
  commands: CommandRegistry;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;

  /**
   * Callback invoked upon clicking to display a file diff.
   *
   * @param event - event object
   */
  onOpenDiff?: (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => Promise<void>;
}

/**
 * Interface describing component state.
 */
export interface IPastCommitNodeState {
  /**
   * Boolean indicating whether additional commit information should be displayed.
   */
  expanded: boolean;
}

/**
 * React component for rendering an individual commit.
 */
export class PastCommitNode extends React.Component<
  React.PropsWithChildren<IPastCommitNodeProps>,
  IPastCommitNodeState
> {
  /**
   * Returns a React component for rendering an individual commit.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: React.PropsWithChildren<IPastCommitNodeProps>) {
    super(props);
    this.state = {
      expanded: false
    };
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <li
        className={classes(
          commitWrapperClass,
          !this.props.children && !!this.props.onOpenDiff
            ? singleFileCommitClass
            : this.state.expanded
            ? commitExpandedClass
            : null
        )}
        title={
          this.props.children
            ? this.props.trans.__('View commit details')
            : this.props.trans.__('View file changes')
        }
        onClick={this._onCommitClick}
      >
        <div className={commitHeaderClass}>
          <span className={commitHeaderItemClass}>
            {this.props.commit.author}
          </span>
          <span className={commitHeaderItemClass}>
            {+this.props.commit.commit in Git.Diff.SpecialRef
              ? Git.Diff.SpecialRef[+this.props.commit.commit]
              : this.props.commit.commit.slice(0, 7)}
          </span>
          <span className={commitHeaderItemClass}>
            {this.props.commit.date}
          </span>
          {this.props.children ? (
            this.state.expanded ? (
              <caretUpIcon.react className={iconButtonClass} tag="span" />
            ) : (
              <caretDownIcon.react className={iconButtonClass} tag="span" />
            )
          ) : (
            <diffIcon.react className={iconButtonClass} tag="span" />
          )}
        </div>
        <div className={branchWrapperClass}>{this._renderBranches()}</div>
        <div className={commitBodyClass}>
          {this.props.commit.commit_msg}
          {this.state.expanded && this.props.children}
        </div>
      </li>
    );
  }

  /**
   * Renders branch information.
   *
   * @returns array of React elements
   */
  private _renderBranches(): React.ReactElement[] {
    const curr = this.props.commit.commit;
    const branches: Git.IBranch[] = [];
    for (let i = 0; i < this.props.branches.length; i++) {
      const branch = this.props.branches[i];
      if (branch.top_commit && branch.top_commit === curr) {
        branches.push(branch);
      }
    }
    return branches.map(this._renderBranch, this);
  }

  /**
   * Renders individual branch data.
   *
   * @param branch - branch data
   * @returns React element
   */
  private _renderBranch(branch: Git.IBranch): React.ReactElement {
    return (
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
    );
  }

  /**
   * Callback invoked upon clicking on an individual commit.
   *
   * @param event - event object
   */
  private _onCommitClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ): void => {
    if (this.props.children) {
      this.setState({
        expanded: !this.state.expanded
      });
    } else {
      this.props.onOpenDiff?.call(this, event);
    }
  };
}
