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
  openHistorySideBarButtonStyle,
  historyLabelStyle,
  selectedHeaderStyle,
  unSelectedHeaderStyle,
  branchHeaderCenterContent,
  branchTrackingIconStyle,
  branchTrackingLabelStyle
} from '../componentsStyle/BranchHeaderStyle';

import { classes } from 'typestyle';

import { showErrorMessage } from '@jupyterlab/apputils';

export interface IBranchHeaderState {
  dropdownOpen: boolean;
  showCommitBox: boolean;
  showNewBranchBox: boolean;
}

export interface IBranchHeaderProps {
  currentFileBrowserPath: string;
  topRepoPath: string;
  currentBranch: string;
  upstreamBranch: string;
  stagedFiles: any;
  data: any;
  refresh: any;
  disabled: boolean;
  toggleSidebar: Function;
  showList: boolean;
  currentTheme: string;
  sideBarExpanded: boolean;
}

export class BranchHeader extends React.Component<
  IBranchHeaderProps,
  IBranchHeaderState
> {
  interval: any;
  constructor(props: IBranchHeaderProps) {
    super(props);
    this.state = {
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
  async switchBranch(branchName: string) {
    let gitApi = new Git();
    await gitApi.checkout(
      true,
      false,
      branchName,
      false,
      null,
      this.props.currentFileBrowserPath
    );
    this.toggleSelect();
    this.props.refresh();
  }

  createNewBranch = async (branchName: string) => {
    let gitApi = new Git();
    await gitApi.checkout(
      true,
      true,
      branchName,
      false,
      null,
      this.props.currentFileBrowserPath
    );
    this.toggleNewBranchBox();
    this.props.refresh();
  };

  toggleSelect() {
    this.props.refresh();
    if (!this.props.disabled) {
      this.setState({
        showCommitBox: !this.state.showCommitBox,
        dropdownOpen: !this.state.dropdownOpen
      });
    } else {
      showErrorMessage('Switching branch disabled', {
        message:
          'You have staged changes in current branch. Please commit / discard them before switching to another branch.'
      });
    }
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

  toggleNewBranchBox = (): void => {
    this.props.refresh();
    if (!this.props.disabled) {
      this.setState({
        showNewBranchBox: !this.state.showNewBranchBox,
        dropdownOpen: false
      });
    } else {
      showErrorMessage('Creating new branch disabled', {
        message:
          'You have staged changes in current branch. Please commit / discard them before creating a new branch.'
      });
    }
  };

  getHistoryHeaderStyle() {
    if (this.props.sideBarExpanded) {
      return classes(
        openHistorySideBarButtonStyle,
        selectedHeaderStyle
      );
    }
    return classes(
      unSelectedHeaderStyle,
      openHistorySideBarButtonStyle
    )
  }

  getBranchHeaderStyle() {
    if (this.props.sideBarExpanded) {
      return classes(
        branchHeaderCenterContent,
        unSelectedHeaderStyle
      );
    }
    return classes(
      selectedHeaderStyle,
      branchHeaderCenterContent
    )
  }

  render() {
    return (
      <div className={this.getBranchStyle()}>
        <div style={{display: "flex"}}>
          <div className={this.getHistoryHeaderStyle()}
            onClick={this.props.sideBarExpanded ? null : () => this.props.toggleSidebar()}
            title={'Show commit history'}
          >
            <h3 className={historyLabelStyle}>History</h3>
          </div>
          <div className={this.getBranchHeaderStyle()}
            onClick={this.props.sideBarExpanded ? () => this.props.toggleSidebar() : null}
          >
            <h3 className={branchLabelStyle}>{this.props.currentBranch}</h3>
            <div
              className={
                this.props.disabled
                  ? classes(
                      branchDropdownButtonStyle(this.props.currentTheme),
                      headerButtonDisabledStyle
                    )
                  : branchDropdownButtonStyle(this.props.currentTheme)
              }
              title={'Change the current branch'}
              onClick={() => this.toggleSelect()}
            />
            {!this.state.showNewBranchBox && (
              <div
                className={
                  this.props.disabled
                    ? classes(
                        newBranchButtonStyle(this.props.currentTheme),
                        headerButtonDisabledStyle
                      )
                    : newBranchButtonStyle(this.props.currentTheme)
                }
                title={'Create a new branch'}
                onClick={() => this.toggleNewBranchBox()}
              />
            )}
            {this.state.showNewBranchBox &&
              this.props.showList && (
                <NewBranchBox
                  createNewBranch={this.createNewBranch}
                  toggleNewBranchBox={this.toggleNewBranchBox}
                />
              )}
            {this.props.upstreamBranch != null && this.props.upstreamBranch != '' && (<div className={branchTrackingIconStyle}/>)}
            {this.props.upstreamBranch != null && this.props.upstreamBranch != '' && (<h3 className={branchTrackingLabelStyle}>{this.props.upstreamBranch}</h3>)}
          </div>
        </div>
        {!this.props.sideBarExpanded && (<>
          {this.state.dropdownOpen && (
            <div>
              {this.props.data.map((branch: any, branchIndex: number) => {
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
        </>)}
      </div>
    );
  }
}
