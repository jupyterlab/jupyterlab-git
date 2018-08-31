import {
  repoStyle,
  repoPathStyle,
  repoRefreshStyle,
} from '../componentsStyle/PathHeaderStyle';

import * as React from 'react';

import { classes } from 'typestyle';

export interface IPathHeaderState {
  topRepoPath: string;
  refresh: any;
}

export interface IPathHeaderProps {
  currentFileBrowserPath: string;
  topRepoPath: string;
  refresh: any;
  currentBranch: string;
}

export class PathHeader extends React.Component<
  IPathHeaderProps,
  IPathHeaderState
> {
  constructor(props: IPathHeaderProps) {
    super(props);
    this.state = {
      topRepoPath: props.topRepoPath,
      refresh: props.refresh
    };
  }

  render() {
    let relativePath = this.props.currentFileBrowserPath.split('/');
    return (
      <div className={repoStyle}>
        <span className={repoPathStyle}>
          {relativePath[relativePath.length - 1]+" / "+this.props.currentBranch}
        </span>
        <button
          className={classes(repoRefreshStyle, 'jp-Icon-16')}
          onClick={() => this.props.refresh()}
        />
      </div>
    );
  }
}
