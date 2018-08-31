import {
  repoStyle,
  repoPathStyle,
  repoRefreshStyle,
  // repoIconStyle,
  // arrowStyle,
  // gitRepoPathContainerStyle,
  // directoryStyle
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
        {/* <span className={repoIconStyle} /> */}
        <span className={repoPathStyle}>
          {/* {relativePath.map(directory => (
            <div key={directory} className={gitRepoPathContainerStyle}>
              {relativePath[0] !== '' && <span className={arrowStyle} />}
              <span className={directoryStyle}>{directory}</span>
            </div>
          ))} */}
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
