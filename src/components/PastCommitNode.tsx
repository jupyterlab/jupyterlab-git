import {
  pastCommitNodeStyle,
  pastCommitWorkingNodeStyle,
  pastCommitContentStyle,
  pastCommitWorkingContentStyle,
  pastCommitHeadContentStyle,
  pastCommitNumberContentStyle,
  pastCommitActiveContentStyle,
  pastCommitLineStyle,
  pastCommitLastLineStyle
} from '../components_style/PastCommitNodeStyle';

import { classes } from 'typestyle';

import * as React from 'react';

export interface IPastCommitNodeProps {
  index: number;
  isLast: boolean;
  pastCommit: any;
  currentFileBrowserPath: string;
  setShowList: Function;
  getPastCommit: Function;
  activeNode: number;
  updateActiveNode: Function;
}

export class PastCommitNode extends React.Component<IPastCommitNodeProps, {}> {
  constructor(props) {
    super(props);
  }

  getPastCommitNodeClass(): string {
    return this.props.index === -1
      ? classes(pastCommitWorkingNodeStyle, pastCommitNodeStyle)
      : pastCommitNodeStyle;
  }

  getPastCommitLineClass(): string {
    return this.props.isLast ? pastCommitLastLineStyle : pastCommitLineStyle;
  }

  getContent(): string | number {
    if (this.props.index === -1) {
      return 'Working';
    } else if (this.props.index === 0) {
      return 'Head';
    } else {
      return this.props.index;
    }
  }

  getContentClass(): string {
    const activeContentStyle =
      this.props.index === this.props.activeNode
        ? pastCommitActiveContentStyle
        : null;
    if (this.props.index === -1) {
      return classes(
        pastCommitWorkingContentStyle,
        pastCommitContentStyle,
        activeContentStyle
      );
    } else if (this.props.index === 0) {
      return classes(
        pastCommitHeadContentStyle,
        pastCommitContentStyle,
        activeContentStyle
      );
    } else {
      return classes(
        pastCommitNumberContentStyle,
        pastCommitContentStyle,
        activeContentStyle
      );
    }
  }

  handleClick(): void {
    this.props.index === -1
      ? this.props.setShowList(true)
      : (this.props.getPastCommit(
          this.props.pastCommit,
          this.props.index,
          this.props.currentFileBrowserPath
        ),
        this.props.setShowList(false));
    this.props.updateActiveNode(this.props.index);
  }

  render() {
    return (
      <div key={this.props.index}>
        <div
          className={this.getPastCommitNodeClass()}
          onClick={() => this.handleClick()}
        >
          <span className={this.getContentClass()}>{this.getContent()}</span>
        </div>
        <div className={this.getPastCommitLineClass()} />
      </div>
    );
  }
}
