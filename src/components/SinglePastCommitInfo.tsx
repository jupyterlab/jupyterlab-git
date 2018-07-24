import { JupyterLab } from '@jupyterlab/application';

import { SingleCommitInfo, CommitModifiedFile } from '../git';

import { parseFileExtension } from './FileList';

import {
  commitStyle,
  commitNumberLabelStyle,
  commitAuthorLabelStyle,
  commitAuthorIconStyle,
  commitLabelDateStyle,
  commitLabelMessageStyle,
  commitDetailStyle,
  commitDetailHeader,
  commitDetailFileStyle,
  commitDetailFilePathStyle,
  iconStyle,
  insertionIconStyle,
  numberofChangedFilesStyle,
  deletionIconStyle
} from '../components_style/SinglePastCommitInfoStyle';

import { fileIconStyle } from '../components_style/FileItemStyle';

import * as React from 'react';

import { classes } from 'typestyle/';

export interface ISinglePastCommitInfoProps {
  num: string;
  data: SingleCommitInfo;
  info: string;
  filesChanged: string;
  insertionCount: string;
  deletionCount: string;
  list: [CommitModifiedFile];
  app: JupyterLab;
  diff: any;
}

export class SinglePastCommitInfo extends React.Component<
  ISinglePastCommitInfoProps,
  {}
> {
  constructor(props: ISinglePastCommitInfoProps) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className={commitStyle}>
          <div>
            <div className={commitAuthorLabelStyle}>
              <span className={commitAuthorIconStyle} />
              {this.props.data.author}
            </div>
            <div className={commitLabelDateStyle}>{this.props.data.date}</div>
            <span className={commitNumberLabelStyle}>
              #{this.props.data.commit
                ? this.props.data.commit.substring(0, 7)
                : ''}
            </span>
          </div>
          <div className={commitLabelMessageStyle}>
            {this.props.data.commit_msg}
          </div>
        </div>
        <div className={commitDetailStyle}>
          <div className={commitDetailHeader}>
            Changed
            <span>
              <span className={classes(iconStyle, numberofChangedFilesStyle)} />
              {this.props.filesChanged}
            </span>
            <span>
              <span className={classes(iconStyle, insertionIconStyle)} />
              {this.props.insertionCount}
            </span>
            <span>
              <span className={classes(iconStyle, deletionIconStyle)} />
              {this.props.deletionCount}
            </span>
          </div>
          {this.props.list.length > 0 &&
            this.props.list.map((modifiedFile, modifiedFileIndex) => {
              return (
                <li className={commitDetailFileStyle} key={modifiedFileIndex}>
                  <span
                    className={`${fileIconStyle} ${parseFileExtension(
                      modifiedFile.modified_file_path
                    )}`}
                    onDoubleClick={() => {
                      window.open(
                        'https://github.com/search?q=' +
                          this.props.data.commit +
                          '&type=Commits&utf8=%E2%9C%93'
                      );
                    }}
                  />
                  <span
                    className={commitDetailFilePathStyle}
                    onDoubleClick={() => {
                      this.props.diff(
                        this.props.app,
                        modifiedFile.modified_file_path,
                        this.props.data.commit,
                        this.props.data.pre_commit
                      );
                    }}
                  >
                    {modifiedFile.modified_file_name}
                  </span>
                </li>
              );
            })}
        </div>
      </div>
    );
  }
}
