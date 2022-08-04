import { TranslationBundle } from '@jupyterlab/translation';
import { caretDownIcon, caretUpIcon } from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import * as React from 'react';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import {
  compareWithSelectedIcon,
  diffIcon,
  selectForCompareIcon
} from '../style/icons';
import {
  branchClass,
  branchWrapperClass,
  commitBodyClass,
  referenceCommitNodeClass,
  challengerCommitNodeClass,
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
import { ActionButton } from './ActionButton';

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
   * The commit to compare against.
   */
  isReferenceCommit?: boolean;

  /**
   * The commit to compare.
   */
  isChallengerCommit?: boolean;

  /**
   * Callback invoked upon clicking to display a file diff.
   *
   * @param event - event object
   */
  onOpenDiff?: (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => Promise<void>;

  /**
   * Callback invoked upon clicking to select a commit for comparison.
   *
   * If the callback is null, the button will be disabled.
   *
   * @param event - event object
   */
  onSelectForCompare:
    | ((event: React.MouseEvent<HTMLElement, MouseEvent>) => Promise<void>)
    | null;

  /**
   * Callback invoked upon clicking to compare a commit against the selected.
   *
   * If the callback is null, the button will be disabled.
   *
   * @param event - event object
   */
  onCompareWithSelected:
    | ((event: React.MouseEvent<HTMLElement, MouseEvent>) => Promise<void>)
    | null;
  /**
   * Whether the PastCommitNode is expanded
   */
  expanded: boolean;
  /**
   * Callback to toggle expansion of the PastCommitNode
   *
   * @param sha the sha of the commit
   */
  toggleCommitExpansion: (sha: string) => void;
  /**
   * Callback to store a reference of the rendered <li> element in HistorySideBar
   *
   * @param el the <li> element representing a past commit
   */
  setRef: (el: HTMLLIElement) => void;
}

/**
 * React component for rendering an individual commit.
 */
export class PastCommitNode extends React.Component<
  React.PropsWithChildren<IPastCommitNodeProps>
> {
  /**
   * Returns a React component for rendering an individual commit.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: React.PropsWithChildren<IPastCommitNodeProps>) {
    super(props);
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <li
        id={this.props.commit.commit}
        ref={el => this.props.setRef(el)}
        className={classes(
          commitWrapperClass,
          !this.props.children && !!this.props.onOpenDiff
            ? singleFileCommitClass
            : this.props.expanded
            ? commitExpandedClass
            : null,
          this.props.isReferenceCommit && referenceCommitNodeClass,
          this.props.isChallengerCommit && challengerCommitNodeClass
        )}
        title={
          this.props.children
            ? this.props.trans.__('View commit details')
            : this.props.trans.__('View file changes')
        }
        onClick={event => this._onCommitClick(event, this.props.commit.commit)}
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
          {!this.props.commit.is_binary && (
            <React.Fragment>
              <ActionButton
                className={iconButtonClass}
                disabled={this.props.onSelectForCompare === null}
                icon={selectForCompareIcon}
                title={this.props.trans.__('Select for compare')}
                onClick={this.props.onSelectForCompare}
              />
              <ActionButton
                className={iconButtonClass}
                disabled={this.props.onCompareWithSelected === null}
                icon={compareWithSelectedIcon}
                title={this.props.trans.__('Compare with selected')}
                onClick={this.props.onCompareWithSelected}
              />
            </React.Fragment>
          )}
          {this.props.children ? (
            this.props.expanded ? (
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
          {this.props.expanded && this.props.children}
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
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    sha: string
  ): void => {
    if (this.props.children) {
      this.props.toggleCommitExpansion(sha);
    } else {
      this.props.onOpenDiff?.call(this, event);
    }
  };
}
