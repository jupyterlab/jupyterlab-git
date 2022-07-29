import * as React from 'react';
import {
  generateGraphData,
  ICommit,
  INode,
  IRoute
} from '../generateGraphData';
import { SVGPathData } from '../svgPathData';

const COLOURS = [
  '#e11d21',
  '#fbca04',
  '#009800',
  '#006b75',
  '#207de5',
  '#0052cc',
  '#5319e7',
  '#f7c6c7',
  '#fad8c7',
  '#fef2c0',
  '#bfe5bf',
  '#c7def8',
  '#bfdadc',
  '#bfd4f2',
  '#d4c5f9',
  '#cccccc',
  '#84b6eb',
  '#e6e6e6',
  '#ffffff',
  '#cc317c'
];

const getColour = function (branch: number) {
  const n = COLOURS.length;
  return COLOURS[branch % n];
};

const branchCount = (commitNodes: INode[]): number => {
  let maxBranch = -1;

  commitNodes.forEach(node => {
    maxBranch = node.routes.reduce((max, route) => {
      return Math.max(max, route.from, route.to);
    }, maxBranch);
  });

  return maxBranch + 1;
};

export interface IGitCommitGraphProps {
  commits: ICommit[];
  dotRadius: number;
  lineWidth: number;
  getNodeHeight: (sha: string) => number;
}

export class GitCommitGraph extends React.Component<IGitCommitGraphProps> {
  constructor(props: IGitCommitGraphProps) {
    super(props);
    this.x_step = 10;
    this.graphData = [];
  }

  getGraphData(): INode[] {
    this.graphData = generateGraphData(
      this.props.commits,
      this.props.getNodeHeight
    );
    return this.graphData;
  }

  getBranchCount(): number {
    return branchCount(this.getGraphData());
  }

  getWidth(): number {
    return (this.getBranchCount() + 0.5) * this.x_step;
  }

  getHeight(): number {
    return (
      this.graphData[this.graphData.length - 1].yOffset +
      this.props.getNodeHeight(
        this.props.commits[this.props.commits.length - 1].sha
      )
    );
  }

  renderRouteNode(svgPathDataAttribute: string, branch: number): JSX.Element {
    const colour = getColour(branch);
    const style = {
      stroke: colour,
      'stroke-width': this.props.lineWidth,
      fill: 'none'
    };

    const classes = `commits-graph-branch-${branch}`;

    return (
      <path d={svgPathDataAttribute} style={style} className={classes}></path>
    );
  }

  renderRoute(yOffset: number, route: IRoute, height: number): JSX.Element {
    const { from, to, branch } = route;
    const { x_step } = this;

    const svgPath = new SVGPathData();

    const from_x = (from + 1) * x_step;
    const from_y = yOffset;
    const to_x = (to + 1) * x_step;
    const to_y = yOffset + height;

    svgPath.moveTo(from_x, from_y);
    if (from_x === to_x) {
      svgPath.lineTo(to_x, to_y);
    } else {
      svgPath.bezierCurveTo(
        from_x - x_step / 4,
        from_y + height / 2,
        to_x + x_step / 4,
        to_y - height / 2,
        to_x,
        to_y
      );
    }

    return this.renderRouteNode(svgPath.toString(), branch);
  }

  renderCommitNode(
    x: number,
    y: number,
    sha: string,
    dot_branch: number
  ): JSX.Element {
    //let selectedClass, style;
    const radius = this.props.dotRadius;

    // let strokeColour, strokeWidth;
    const colour = getColour(dot_branch);
    // if (sha === this.props.selected) {
    //   strokeColour = '#000';
    //   strokeWidth = 2;
    // } else {
    const strokeColour = colour;
    const strokeWidth = 1;
    // }
    const style = {
      stroke: strokeColour,
      'stroke-width': strokeWidth,
      fill: colour
    };

    // if (this.props.selected) {
    //   selectedClass = 'selected';
    // }
    const classes = `commits-graph-branch-${dot_branch}`;

    return (
      <circle
        cx={x}
        cy={y}
        r={radius}
        style={style}
        //onClick: this.handleClick,
        data-sha={sha}
        className={classes}
      >
        <title>{sha.slice(0, 7)}</title>
      </circle>
    );
  }

  renderCommit(idx: number, commit: INode): [JSX.Element, JSX.Element[]] {
    const { sha, dot, routes } = commit;
    const { lateralOffset, branch } = dot;

    // draw dot
    const { x_step } = this;

    const x = (lateralOffset + 1) * x_step;
    const y = commit.yOffset;

    const commitNode = this.renderCommitNode(x, y, sha, branch);

    const routeNodes = routes.map(route =>
      this.renderRoute(
        commit.yOffset,
        route,
        this.props.getNodeHeight(commit.sha)
      )
    );

    this.renderedCommitsPositions.push({ x, y, sha });

    return [commitNode, routeNodes];
  }

  render(): JSX.Element {
    // reset lookup table of commit node locations
    this.renderedCommitsPositions = [];

    const allCommitNodes: JSX.Element[] = [];
    let allRouteNodes: JSX.Element[] = [];
    const commitNodes = this.getGraphData();
    commitNodes.forEach((node, index) => {
      const commit = node;
      const [commitNode, routeNodes] = this.renderCommit(index, commit);
      allCommitNodes.push(commitNode);
      allRouteNodes = allRouteNodes.concat(routeNodes);
    });

    const children = [].concat(allRouteNodes, allCommitNodes);

    const height = this.getHeight();
    const width = this.getWidth();

    const style = { height, width, 'flex-shrink': 0 };
    //const svgProps = { height, width, style, children };

    return (
      <svg
        //onClick={this.handleClick}
        height={height}
        width={width}
        style={style}
      >
        {...children}
      </svg>
    );
  }

  renderedCommitsPositions: { x: number; y: number; sha: string }[];
  graphData: INode[];
  x_step: number;
}
