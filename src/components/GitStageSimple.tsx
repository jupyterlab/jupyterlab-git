import { Dialog, showDialog } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { classes } from 'typestyle';
import { BranchMarker, GitExtension } from '../model';
import {
  changeStageButtonStyle,
  discardFileButtonStyle,
  sectionAreaStyle,
  sectionFileContainerStyle,
  sectionHeaderLabelStyle
} from '../style/GitStageStyle';
import { Git } from '../tokens';
import { FileItemSimple } from './FileItemSimple';
import { decodeStage } from '../utils';

export interface IGitStageSimpleProps {
  heading: string;
  files: Git.IStatusFileResult[];
  marker: BranchMarker;
  model: GitExtension;
  discardAllFiles: () => Promise<void>;
  discardFile: (file: string) => Promise<void>;
  renderMime: IRenderMimeRegistry;
}

export class GitStageSimple extends React.Component<IGitStageSimpleProps> {
  constructor(props: IGitStageSimpleProps) {
    super(props);
    this.state = {
      showDiscardWarning: false
    };
  }

  checkContents() {
    if (this.props.files.length > 0) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * Callback method discarding all unstanged changes.
   * It shows modal asking for confirmation and when confirmed make
   * server side call to git checkout to discard all unstanged changes.
   */
  async discardAllChanges() {
    const result = await showDialog({
      title: 'Discard all changes',
      body: `Are you sure you want to permanently discard changes to all files? This action cannot be undone.`,
      buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard' })]
    });
    if (result.button.accept) {
      this.props.discardAllFiles();
    }
  }

  render() {
    return (
      <div>
        <div className={sectionAreaStyle}>
          <span className={sectionHeaderLabelStyle}>
            {this.props.heading}({this.props.files.length})
          </span>
          {this.props.heading === 'Changed' && (
            <button
              disabled={this.checkContents()}
              className={classes(
                changeStageButtonStyle,
                discardFileButtonStyle
              )}
              title={'Discard All Changes'}
              onClick={() => this.discardAllChanges()}
            />
          )}
        </div>
        <ul className={sectionFileContainerStyle}>
          {this.props.files.map(
            (file: Git.IStatusFileResult, fileIndex: number) => {
              return (
                <FileItemSimple
                  key={fileIndex}
                  file={file}
                  stage={decodeStage(file.x, file.y)}
                  marker={this.props.marker}
                  model={this.props.model}
                  discardFile={this.props.discardFile}
                  renderMime={this.props.renderMime}
                />
              );
            }
          )}
        </ul>
      </div>
    );
  }
}
