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

export interface IBranchHeaderState {}

export interface IBranchHeaderProps {
  model: IGitExtension;
  currentBranch: string;
  upstreamBranch: string;
  stagedFiles: Git.IStatusFileResult[];
  data: Git.IBranch[];
  refresh: () => Promise<void>;
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
            className={this.getBranchHeaderStyle()}
            onClick={
              this.props.sideBarExpanded
                ? () => this.props.toggleSidebar()
                : null
            }
          >
            <h3 className={historyLabelStyle}>Changes</h3>
          </div>
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
        </div>
      </div>
    );
  }
}
