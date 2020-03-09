import * as React from 'react';
import { GitExtension } from '../model';
import { gitMarkBoxStyle } from '../style/FileItemSimpleStyle';
import { fileStyle } from '../style/FileItemStyle';
import { Git } from '../tokens';
import { openListedFile } from '../utils';
import { FilePath } from './FilePath';

export interface IGitMarkBoxProps {
  fname: string;
  model: GitExtension;
  stage: string;
}

export class GitMarkBox extends React.Component<IGitMarkBoxProps> {
  constructor(props: IGitMarkBoxProps) {
    super(props);
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
  actions?: React.ReactElement;
  file: Git.IStatusFile;
  model: GitExtension;
}

export const FileItemSimple: React.FunctionComponent<IFileItemSimpleProps> = (
  props: IFileItemSimpleProps
) => (
  <li
    className={fileStyle}
    onDoubleClick={() => openListedFile(props.file, props.model)}
    title={props.file.to}
  >
    <GitMarkBox
      fname={props.file.to}
      stage={props.file.status}
      model={props.model}
    />
    <FilePath filepath={props.file.to} />
    {props.actions}
  </li>
);
