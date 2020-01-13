import * as React from 'react';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { classes } from 'typestyle';
import { GitExtension } from '../model';
import { hiddenButtonStyle } from '../style/ActionButtonStyle';
import { gitMarkBoxStyle } from '../style/FileItemSimpleStyle';
import {
  fileButtonStyle,
  fileGitButtonStyle,
  fileStyle
} from '../style/FileItemStyle';
import {
  changeStageButtonStyle,
  diffFileButtonStyle,
  discardFileButtonStyle
} from '../style/GitStageStyle';
import { Git } from '../tokens';
import { openListedFile } from '../utils';
import { ActionButton } from './ActionButton';
import { isDiffSupported } from './diff/Diff';
import { openDiffView } from './diff/DiffWidget';
import { ISpecialRef } from './diff/model';
import { FilePath } from './FilePath';

export interface IGitMarkBoxProps {
  fname: string;
  model: GitExtension;
  stage: string;
}

export class GitMarkBox extends React.Component<IGitMarkBoxProps> {
  constructor(props: IGitMarkBoxProps) {
    super(props);

    this._onClick = this._onClick.bind(this);
  }

  protected _onClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    // toggle will emit a markChanged signal
    this.props.model.toggleMark(this.props.fname);

    // needed if markChanged doesn't force an update of a parent
    this.forceUpdate();
  };

  render() {
    // idempotent, will only run once per file
    this.props.model.addMark(
      this.props.fname,
      this.props.stage !== 'untracked'
    );

    return (
      <input
        name="gitMark"
        className={gitMarkBoxStyle}
        type="checkbox"
        checked={this.props.model.getMark(this.props.fname)}
        onChange={this._onClick}
      />
    );
  }
}

export interface IFileItemSimpleProps {
  file: Git.IStatusFileResult;
  stage: string;
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
   * Callback method discarding unstaged changes for selected file.
   * It shows modal asking for confirmation and when confirmed make
   * server side call to git checkout to discard changes in selected file.
   */
  discardSelectedFileChanges = async () => {
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
  };

  render() {
    let diffButton = null;
    if (isDiffSupported(this.props.file.to)) {
      if (this.props.stage === 'unstaged') {
        diffButton = this._createDiffButton({ specialRef: 'WORKING' });
      } else if (this.props.stage === 'staged') {
        diffButton = this._createDiffButton({ specialRef: 'INDEX' });
      }
    }

    return (
      <li
        className={fileStyle}
        onDoubleClick={() => openListedFile(this.props.file, this.props.model)}
        title={this.props.file.to}
      >
        <GitMarkBox
          fname={this.props.file.to}
          stage={this.props.stage}
          model={this.props.model}
        />
        <FilePath filepath={this.props.file.to} />
        {this.props.stage === 'unstaged' && (
          <ActionButton
            className={hiddenButtonStyle}
            iconName={'git-discard'}
            title={'Discard changes'}
            onClick={this.discardSelectedFileChanges}
          />
        )}
        {diffButton}
      </li>
    );
  }

  /**
   * Creates a button element which is used to request diff from within the
   * Git panel.
   *
   * @param currentRef the ref to diff against the git 'HEAD' ref
   */
  private _createDiffButton(currentRef: ISpecialRef): JSX.Element {
    return (
      <ActionButton
        className={hiddenButtonStyle}
        iconName={'git-diff'}
        title={'Diff this file'}
        onClick={async () => {
          try {
            await openDiffView(
              this.props.file.to,
              this.props.model,
              {
                previousRef: { gitRef: 'HEAD' },
                currentRef: { specialRef: currentRef.specialRef }
              },
              this.props.renderMime
            );
          } catch (reason) {
            console.error(
              `Fail to open diff view for ${this.props.file.to}.\n${reason}`
            );
          }
        }}
      />
    );
  }
}
