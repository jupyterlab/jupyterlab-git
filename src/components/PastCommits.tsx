import { JupyterFrontEnd } from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/coreutils';

import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import { FileList } from './FileList';

import { pastCommitsContainerStyle } from '../style/PastCommitsStyle';

import { IDiffCallback } from '../git';

import * as React from 'react';

/** Interface for PastCommits component props */
export interface IPastCommitsProps {
  currentFileBrowserPath: string;
  topRepoPath: string;
  inNewRepo: boolean;
  showList: boolean;
  stagedFiles: any;
  unstagedFiles: any;
  untrackedFiles: any;
  app: JupyterFrontEnd;
  refresh: any;
  diff: IDiffCallback;
  sideBarExpanded: boolean;
  settings: ISettingRegistry.ISettings;
  renderMime: IRenderMimeRegistry;
}

export class PastCommits extends React.Component<IPastCommitsProps, {}> {
  render() {
    if (this.props.sideBarExpanded) {
      return null;
    }
    return (
      <div className={pastCommitsContainerStyle}>
        <FileList
          currentFileBrowserPath={this.props.currentFileBrowserPath}
          topRepoPath={this.props.topRepoPath}
          stagedFiles={this.props.stagedFiles}
          unstagedFiles={this.props.unstagedFiles}
          untrackedFiles={this.props.untrackedFiles}
          app={this.props.app}
          refresh={this.props.refresh}
          sideBarExpanded={this.props.sideBarExpanded}
          display={this.props.showList}
          settings={this.props.settings}
          renderMime={this.props.renderMime}
        />
      </div>
    );
  }
}
