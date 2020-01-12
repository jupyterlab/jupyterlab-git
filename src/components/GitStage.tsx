import * as React from 'react';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { DefaultIconReact } from '@jupyterlab/ui-components';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import {
  caretdownImageStyle,
  caretrightImageStyle,
  changeStageButtonStyle,
  hiddenButtonStyle,
  sectionHeaderSizeStyle,
  sectionAreaStyle,
  sectionFileContainerStyle,
  sectionHeaderLabelStyle
} from '../style/GitStageStyle';
import { Git } from '../tokens';
import { FileItem } from './FileItem';

export interface IGitStageSharedProps {
  model: GitExtension;
  renderMime: IRenderMimeRegistry;
  selectedFile: Git.IStatusFileResult | null;
  selectFile: (file: Git.IStatusFileResult | null) => void;
}

export interface IGitStageProps extends IGitStageSharedProps {
  contextMenu: (event: React.MouseEvent) => void;
  discardAllFiles: () => Promise<void>;
  discardFile: (file: string) => Promise<void>;
  files: Git.IStatusFileResult[];
  heading: string;
  moveAllFiles: () => Promise<void>;
  moveFile: (file: string) => Promise<void>;
  moveAllFilesTitle: string;
  moveFileTitle: string;
}

export interface IGitStageState {
  showFiles: boolean;
}

export class GitStage extends React.Component<IGitStageProps, IGitStageState> {
  constructor(props: IGitStageProps) {
    super(props);
    this.state = {
      showFiles: true
    };
  }

  private _setShowFiles(value: boolean) {
    this.setState({ showFiles: value });
  }

  /**
   * Callback method discarding all unstaged changes.
   * It shows modal asking for confirmation and when confirmed make
   * server side call to git checkout to discard all unstaged changes.
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
      <div className={sectionFileContainerStyle}>
        <div className={sectionAreaStyle}>
          <button
            className={classes(
              changeStageButtonStyle,
              this.state.showFiles && this.props.files.length > 0
                ? caretdownImageStyle
                : caretrightImageStyle
            )}
            onClick={() => {
              if (this.props.files.length > 0) {
                this._setShowFiles(!this.state.showFiles);
              }
            }}
          />
          <span className={sectionHeaderLabelStyle}>{this.props.heading}</span>
          {this.props.heading === 'Changed' && (
            <button
              disabled={this.props.files.length === 0}
              className={classes(hiddenButtonStyle, 'jp-Git-button')}
              title={'Discard All Changes'}
              onClick={() => this.discardAllChanges()}
            >
              <DefaultIconReact tag="span" name="git-discard" />
            </button>
          )}
          <button
            disabled={this.props.files.length === 0}
            className={classes(hiddenButtonStyle, 'jp-Git-button')}
            title={this.props.moveAllFilesTitle}
            onClick={() => this.props.moveAllFiles()}
          >
            <DefaultIconReact
              tag="span"
              name={this.props.heading === 'Staged' ? 'git-remove' : 'git-add'}
            />
          </button>
          <span className={sectionHeaderSizeStyle}>
            ({this.props.files.length})
          </span>
        </div>
        {this.state.showFiles && (
          <ul className={sectionFileContainerStyle}>
            {this.props.files.map((file: Git.IStatusFileResult) => {
              return (
                <FileItem
                  key={file.to}
                  stage={this.props.heading}
                  file={file}
                  model={this.props.model}
                  moveFile={this.props.moveFile}
                  discardFile={this.props.discardFile}
                  moveFileTitle={this.props.moveFileTitle}
                  contextMenu={this.props.contextMenu}
                  selected={this._isSelectedFile(file)}
                  selectFile={this.props.selectFile}
                  renderMime={this.props.renderMime}
                />
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  private _isSelectedFile(candidate: Git.IStatusFileResult): boolean {
    if (this.props.selectedFile === null) {
      return false;
    }

    return (
      this.props.selectedFile.x === candidate.x &&
      this.props.selectedFile.y === candidate.y &&
      this.props.selectedFile.from === candidate.from &&
      this.props.selectedFile.to === candidate.to
    );
  }
}
