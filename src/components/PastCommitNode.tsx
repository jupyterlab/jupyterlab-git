import {
  pastCommitNodeStyle,
  pastCommitHeaderStyle,
  pastCommitHeaderItemStyle,
  pastCommitBodyStyle,
} from '../componentsStyle/PastCommitNodeStyle';
import { SingleCommitInfo } from "../git";


import * as React from 'react';

export interface IPastCommitNodeProps {
  pastCommit: SingleCommitInfo;

}

export class PastCommitNode extends React.Component<IPastCommitNodeProps, {}> {
  render() {
    return (
      <div className={pastCommitNodeStyle}>
        <div className={pastCommitHeaderStyle}>
          <div className={pastCommitHeaderItemStyle}>
            {this.props.pastCommit.author}
          </div>
          <div className={pastCommitHeaderItemStyle}>
            {this.props.pastCommit.commit.slice(0, 9)}
          </div>
          <div className={pastCommitHeaderItemStyle}>
            {this.props.pastCommit.date}
          </div>
        </div>
        <div className={pastCommitBodyStyle}>
          {this.props.pastCommit.commit_msg}
        </div>
      </div>
    );
  }
}
