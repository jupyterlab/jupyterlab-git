import { showErrorMessage } from '@jupyterlab/apputils';
import * as React from 'react';
import { classes } from 'typestyle';
import {
  branchHeaderCenterContent,
  branchStyle,
  historyLabelStyle,
  openHistorySideBarButtonStyle,
  selectedHeaderStyle,
  unSelectedHeaderStyle
} from '../style/BranchHeaderStyle';
import { Git, IGitExtension } from '../tokens';

const CHANGES_ERR_MSG =
  'You have files with changes in current branch. Please commit or discard changed files before';

export interface IBranchHeaderState {}

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
    this.state = {};
  }

  toggleSelect() {
    this.props.refresh();
    if (!this.props.disabled) {
      // this.setState({
      //   dropdownOpen: !this.state.dropdownOpen
      // });
    } else {
      showErrorMessage(
        'Switching branch disabled',
        CHANGES_ERR_MSG + 'switching to another branch.'
      );
    }
  }

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
      <div className={branchStyle}>
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
            <h3 className={historyLabelStyle}>Changes</h3>
          </div>
        </div>
      </div>
    );
  }
}
