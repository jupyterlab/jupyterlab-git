import * as React from 'react';

import { Git } from '../git';

import { CommitBox } from './CommitBox';

import { NewBranchBox } from './NewBranchBox';

import {
  branchStyle,
  branchLabelStyle,
  branchDropdownButtonStyle,
  newBranchButtonStyle,
  headerButtonDisabledStyle,
  branchListItemStyle,
  stagedCommitButtonStyle,
  stagedCommitButtonReadyStyle,
  stagedCommitButtonDisabledStyle,
  smallBranchStyle,
  expandedBranchStyle,
  openHistorySideBarButtonStyle
} from '../components_style/BranchHeaderStyle';

import { classes } from 'typestyle';

export interface IBranchHeaderState {
  topRepoPath: string;
  currentBranch: string;
  data: any;
  refresh: any;
  disabled: boolean;
  showNotice: boolean;
  dropdownOpen: boolean;
  showCommitBox: boolean;
  showNewBranchBox: boolean;
}

export interface IBranchHeaderProps {
  currentFileBrowserPath: string;
  topRepoPath: string;
  currentBranch: string;
  stagedFiles: any;
  data: any;
  refresh: any;
  disabled: boolean;
  toggleSidebar: Function;
  showList: boolean;
}

export class BranchHeader extends React.Component<
  IBranchHeaderProps,
  IBranchHeaderState
> {
  interval: any;
  constructor(props: IBranchHeaderProps) {
    super(props);
    this.state = {
      topRepoPath: props.topRepoPath,
      currentBranch: props.currentBranch,
      data: [],
      refresh: props.refresh,
      disabled: props.disabled,
      showNotice: false,
      dropdownOpen: false,
      showCommitBox: true,
      showNewBranchBox: false
    };
  }

  /** Commit all staged files */
  commitAllStagedFiles = (message: string, path: string): void => {
    if (message && message !== '') {
      let gitApi = new Git();
      gitApi.commit(message, path).then(response => {
        this.props.refresh();
      });
    }
  };

  /** Update state of commit message input box */
  updateCommitBoxState(disable: boolean, numberOfFiles: number) {
    if (disable) {
      if (numberOfFiles === 0) {
        return classes(
          stagedCommitButtonStyle,
          stagedCommitButtonDisabledStyle
        );
      } else {
        return classes(stagedCommitButtonStyle, stagedCommitButtonReadyStyle);
      }
    } else {
      return stagedCommitButtonStyle;
    }
  }

  /** Switch current working branch */
  switchBranch(branchName: string) {
    let gitApi = new Git();
    gitApi
      .checkout(
        true,
        false,
        branchName,
        false,
        null,
        this.props.currentFileBrowserPath
      )
      .then(respones => {
        this.props.refresh();
      });
  }

  createNewBranch = (branchName: string): void => {
    let gitApi = new Git();
    gitApi
      .checkout(
        true,
        true,
        branchName,
        false,
        null,
        this.props.currentFileBrowserPath
      )
      .then(response => {
        this.props.refresh();
      });
  };

  toggleSelect() {
    this.props.refresh();
    // if (!this.props.disabled) {
    this.setState({
      showCommitBox: !this.state.showCommitBox,
      dropdownOpen: !this.state.dropdownOpen
    });
    // }
  }

  getBranchStyle() {
    if (this.state.dropdownOpen) {
      return classes(branchStyle, expandedBranchStyle);
    } else {
      return this.props.showList
        ? branchStyle
        : classes(branchStyle, smallBranchStyle);
    }
  }

  toggleNewBranchBox = () : void => {
    this.props.refresh();
    // if (!this.props.disabled) {
    this.setState({
      showNewBranchBox: !this.state.showNewBranchBox,
      dropdownOpen: false
    });
    // }
  }

  render() {
    return (
      <div className={this.getBranchStyle()}>
        <button
          className={openHistorySideBarButtonStyle}
          onClick={() => this.props.toggleSidebar()}
          title={'Show commit history'}
        >
          History
        </button>
        <h3 className={branchLabelStyle}>{this.props.currentBranch}</h3>
        <div
          className={
            this.props.disabled
              ? classes(branchDropdownButtonStyle, headerButtonDisabledStyle)
              : branchDropdownButtonStyle
          }
          title={'Change the current branch'}
          onClick={() => this.toggleSelect()}
        />
        {!this.state.showNewBranchBox &&
          <div 
            className={
              this.props.disabled
                ? classes(newBranchButtonStyle, headerButtonDisabledStyle)
                : newBranchButtonStyle
            }
            title={'Create a new branch'}
            onClick={() => this.toggleNewBranchBox()}
          />
        }
        {this.state.showNewBranchBox &&
          this.props.showList && (
            <NewBranchBox 
            createNewBranch={this.createNewBranch}
            toggleNewBranchBox={this.toggleNewBranchBox} />
          )}
        {this.state.dropdownOpen && (
          <div>
            {this.props.data.map((branch, branchIndex) => {
              return (
                <li
                  className={branchListItemStyle}
                  key={branchIndex}
                  onClick={() => this.switchBranch(branch.name)}
                >
                  {branch.name}
                </li>
              );
            })}
          </div>
        )}
        {this.state.showNewBranchBox && (
          <div>Branching from {this.props.currentBranch}</div>
        )}
        {this.state.showCommitBox &&
          this.props.showList && (
            <CommitBox
              checkReadyForSubmit={this.updateCommitBoxState}
              stagedFiles={this.props.stagedFiles}
              commitAllStagedFiles={this.commitAllStagedFiles}
              topRepoPath={this.props.topRepoPath}
              refresh={this.props.refresh}
            />
          )}
      </div>
    );
  }
}
