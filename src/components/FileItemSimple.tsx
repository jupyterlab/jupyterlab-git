import { Dialog, showDialog } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import {
  fileButtonStyle,
  fileGitButtonStyle,
  fileIconStyle,
  fileLabelStyle,
  fileStyle
} from '../style/FileItemStyle';
import {
  changeStageButtonStyle,
  diffFileButtonStyle,
  discardFileButtonStyle
} from '../style/GitStageStyle';
import { Git } from '../tokens';
import { openListedFile, parseFileExtension } from '../utils';
import { isDiffSupported } from './diff/Diff';
import { openDiffView } from './diff/DiffWidget';
import { ISpecialRef } from './diff/model';

export interface IFileItemSimpleProps {
  file: Git.IStatusFileResult;
  stage: string;
  model: GitExtension;
  discardFile: (file: string) => Promise<void>;
  renderMime: IRenderMimeRegistry;
}

export class FileItemSimple extends React.Component<IFileItemSimpleProps, {}> {
  constructor(props: IFileItemSimpleProps) {
    super(props);
  }

  getDiffFileIconClass() {
    return classes(
      fileButtonStyle,
      changeStageButtonStyle,
      fileGitButtonStyle,
      diffFileButtonStyle
    );
  }

  getDiscardFileIconClass() {
    return classes(
      fileButtonStyle,
      changeStageButtonStyle,
      fileGitButtonStyle,
      discardFileButtonStyle
    );
  }

  /**
   * Callback method discarding unstanged changes for selected file.
   * It shows modal asking for confirmation and when confirmed make
   * server side call to git checkout to discard changes in selected file.
   */
  async discardSelectedFileChanges() {
    const result = await showDialog({
      title: 'Discard changes',
      body: `Are you sure you want to permanently discard changes to ${
        this.props.file.from
      }? This action cannot be undone.`,
      buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Discard' })]
    });
    if (result.button.accept) {
      this.props.discardFile(this.props.file.to);
    }
  }

  render() {
    return (
      <li className={fileStyle}>
        <span
          className={classes(
            fileIconStyle,
            parseFileExtension(this.props.file.to)
          )}
        />
        <span
          className={fileLabelStyle}
          onDoubleClick={() =>
            openListedFile(
              this.props.file.x,
              this.props.file.y,
              this.props.file.to,
              this.props.model
            )
          }
          title={this.props.file.to}
        >
          {this.props.file.to}
        </span>
        {this.props.stage === 'Changed' && (
          <React.Fragment>
            <button
              className={`jp-Git-button ${this.getDiscardFileIconClass()}`}
              title={'Discard this change'}
              onClick={() => {
                this.discardSelectedFileChanges();
              }}
            />
            {isDiffSupported(this.props.file.to) &&
              this.diffButton({ specialRef: 'WORKING' })}
          </React.Fragment>
        )}
        {this.props.stage === 'Staged' &&
          isDiffSupported(this.props.file.to) &&
          this.diffButton({ specialRef: 'INDEX' })}
      </li>
    );
  }

  /**
   * Creates a button element which is used to request diff from within the
   * Git panel.
   *
   * @param currentRef the ref to diff against the git 'HEAD' ref
   */
  private diffButton(currentRef: ISpecialRef): JSX.Element {
    return (
      <button
        className={`jp-Git-button ${this.getDiffFileIconClass()}`}
        title={'Diff this file'}
        onClick={async () => {
          await openDiffView(
            this.props.file.to,
            this.props.model,
            {
              previousRef: { gitRef: 'HEAD' },
              currentRef: { specialRef: currentRef.specialRef }
            },
            this.props.renderMime
          );
        }}
      />
    );
  }
}
