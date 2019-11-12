import { Dialog, showDialog } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { classes } from 'typestyle';
import { BranchMarker, GitExtension } from '../model';
import {
  fileButtonStyle,
  fileGitButtonStyle,
  fileIconStyle,
  fileLabelStyle,
  fileStyle
} from '../style/FileItemStyle';
import { gitMarkBoxStyle } from '../style/FileItemSimpleStyle';
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

export interface IGitMarkBoxProps {
  fname: string;
  stage: string;
  marker: BranchMarker;
}

export class GitMarkBox extends React.Component<IGitMarkBoxProps> {
  constructor(props: IGitMarkBoxProps) {
    super(props);

    this._onClick = this._onClick.bind(this);
  }

  protected _onClick(event: React.ChangeEvent<HTMLInputElement>) {
    this.props.marker.toggle(this.props.fname);
    console.log(this.props.marker);
    this.forceUpdate();
  }

  render() {
    // idempotent, will only run once per file
    this.props.marker.add(this.props.fname, this.props.stage !== 'untracked');

    return (
      <input
        name="gitMark"
        className={gitMarkBoxStyle}
        type="checkbox"
        checked={this.props.marker.get(this.props.fname)}
        onChange={this._onClick}
      />
    );
  }
}

export interface IFileItemSimpleProps {
  file: Git.IStatusFileResult;
  stage: string;
  marker: BranchMarker;
  model: GitExtension;
  discardFile: (file: string) => Promise<void>;
  renderMime: IRenderMimeRegistry;
}

export class FileItemSimple extends React.Component<IFileItemSimpleProps> {
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
        <GitMarkBox
          marker={this.props.marker}
          stage={this.props.stage}
          fname={this.props.file.to}
        />
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
        {this.props.stage === 'unstaged' && (
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
        {this.props.stage === 'staged' &&
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
