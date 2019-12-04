import { showErrorMessage } from '@jupyterlab/apputils';
import * as React from 'react';
import { classes } from 'typestyle';
import {
  branchDropdownButtonStyle,
  branchHeaderCenterContent,
  branchLabelStyle,
  branchListItemStyle,
  branchStyle,
  branchTrackingLabelStyle,
  expandedBranchStyle,
  headerButtonDisabledStyle,
  historyLabelStyle,
  newBranchButtonStyle,
  openHistorySideBarButtonStyle,
  selectedHeaderStyle,
  unSelectedHeaderStyle
} from '../style/BranchHeaderStyle';
import { Git, IGitExtension } from '../tokens';
import { NewBranchBox } from './NewBranchBox';

const CHANGES_ERR_MSG =
  'You have files with changes in current branch. Please commit or discard changed files before';

export interface IBranchHeaderState {
  dropdownOpen: boolean;
  showNewBranchBox: boolean;
}

export interface IBranchHeaderProps {
  model: IGitExtension;
  currentBranch: string;
  upstreamBranch: string;
  stagedFiles: Git.IStatusFileResult[];
  data: Git.IBranch[];
  refresh: () => Promise<void>;
  disabled: boolean;
  toggleSidebar: () => void;
  sideBarExpanded: boolean;
}

export class BranchHeader extends React.Component<
  IBranchHeaderProps,
  IBranchHeaderState
> {
  constructor(props: IBranchHeaderProps) {
    super(props);
    this.state = {
      dropdownOpen: false,
      showNewBranchBox: false
    };
  }

  /** Switch current working branch */
  async switchBranch(branchName: string) {
    const result = await this.props.model.checkout({ branchname: branchName });
    if (result.code !== 0) {
      showErrorMessage('Error switching branch', result.message);
    }

    this.toggleSelect();
  }

  createNewBranch = async (branchName: string) => {
    const result = await this.props.model.checkout({
      newBranch: true,
      branchname: branchName
    });
    if (result.code !== 0) {
      showErrorMessage('Error creating new branch', result.message);
    }

    this.toggleNewBranchBox();
  };

  toggleSelect() {
    this.props.refresh();
    if (!this.props.disabled) {
      this.setState({
        dropdownOpen: !this.state.dropdownOpen
      });
    } else {
      showErrorMessage(
        'Switching branch disabled',
        CHANGES_ERR_MSG + 'switching to another branch.'
      );
    }
  }

  getBranchStyle() {
    if (this.state.dropdownOpen) {
      return classes(branchStyle, expandedBranchStyle);
    } else {
      return branchStyle;
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
      showErrorMessage(
        'Creating new branch disabled',
        CHANGES_ERR_MSG + 'creating a new branch.'
      );
    }
  };

  getHistoryHeaderStyle() {
    if (this.props.sideBarExpanded) {
      return classes(openHistorySideBarButtonStyle, selectedHeaderStyle);
    }
    return classes(unSelectedHeaderStyle, openHistorySideBarButtonStyle);
  }

  getBranchHeaderStyle() {
    if (this.props.sideBarExpanded) {
      return classes(branchHeaderCenterContent, unSelectedHeaderStyle);
    }
    return classes(selectedHeaderStyle, branchHeaderCenterContent);
  }

  render() {
    return (
      <div className={this.getBranchStyle()}>
        <div style={{ display: 'flex' }}>
          <div
            className={this.getHistoryHeaderStyle()}
            onClick={
              this.props.sideBarExpanded
                ? null
                : () => this.props.toggleSidebar()
            }
            title={'Show commit history'}
          >
            <h3 className={historyLabelStyle}>History</h3>
          </div>
          <div
            className={this.getBranchHeaderStyle()}
            onClick={
              this.props.sideBarExpanded
                ? () => this.props.toggleSidebar()
                : null
            }
          >
            <h3 className={branchLabelStyle}>{this.props.currentBranch}</h3>
            <div
              className={
                this.props.disabled
                  ? classes(
                      branchDropdownButtonStyle,
                      headerButtonDisabledStyle
                    )
                  : branchDropdownButtonStyle
              }
              title={'Change the current branch'}
              onClick={() => this.toggleSelect()}
            />
            {!this.state.showNewBranchBox && (
              <div
                className={
                  this.props.disabled
                    ? classes(newBranchButtonStyle, headerButtonDisabledStyle)
                    : newBranchButtonStyle
                }
                title={'Create a new branch'}
                onClick={() => this.toggleNewBranchBox()}
              />
            )}
            {this.state.showNewBranchBox && (
              <NewBranchBox
                createNewBranch={this.createNewBranch}
                toggleNewBranchBox={this.toggleNewBranchBox}
              />
            )}
            {this.props.upstreamBranch != null &&
              this.props.upstreamBranch !== '' && (
                <h3 className={branchTrackingLabelStyle}>
                  {this.props.upstreamBranch}
                </h3>
              )}
          </div>
        </div>
        {!this.props.sideBarExpanded && (
          <React.Fragment>
            {this.state.dropdownOpen && (
              <div>
                {this.props.data.map(
                  (branch: Git.IBranch, branchIndex: number) => (
                    <li
                      className={branchListItemStyle}
                      key={branchIndex}
                      onClick={() => this.switchBranch(branch.name)}
                    >
                      {branch.name}
                    </li>
                  )
                )}
              </div>
            )}
            {this.state.showNewBranchBox && (
              <div>Branching from {this.props.currentBranch}</div>
            )}
          </React.Fragment>
        )}
      </div>
    );
  }
}
