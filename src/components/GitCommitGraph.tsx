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
  '#cc317c'
];

const DEFAULT_BRANCH_GAP = 10;
const DEFAULT_RADIUS = 3;
const DEFAULT_LINE_WIDTH = 2;

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
  /**
   * A list of commits with its own hash and its parents' hashes.
   */
  commits: ICommit[];
  /**
   * Callback to inquire the height of a specific SinglePastCommitInfo component.
   */
  getNodeHeight: (sha: string) => number;
  /**
   * Radius of the commit dot.
   */
  dotRadius?: number;
  /**
   * Width of the lines connecting the commit dots.
   */
  lineWidth?: number;
}

export class GitCommitGraph extends React.Component<IGitCommitGraphProps> {
  constructor(props: IGitCommitGraphProps) {
    super(props);
    this._graphData = [];
    this._x_step = DEFAULT_BRANCH_GAP;
    this._dotRadius = this.props.dotRadius || DEFAULT_RADIUS;
    this._lineWidth = this.props.lineWidth || DEFAULT_LINE_WIDTH;
  }

  getGraphData(): INode[] {
    this._graphData = generateGraphData(
      this.props.commits,
      this.props.getNodeHeight
    );
    return this._graphData;
  }

  getBranchCount(): number {
    return branchCount(this.getGraphData());
  }

  getWidth(): number {
    return (this.getBranchCount() + 0.5) * this._x_step;
  }

  getHeight(): number {
    return (
      this._graphData[this._graphData.length - 1].yOffset +
      this.props.getNodeHeight(
        this.props.commits[this.props.commits.length - 1].sha
      )
    );
  }

  renderRouteNode(svgPathDataAttribute: string, branch: number): JSX.Element {
    const colour = getColour(branch);
    const style = {
      stroke: colour,
      'stroke-width': this._lineWidth,
      fill: 'none'
    };

    const classes = `commits-graph-branch-${branch}`;

    return (
      <path d={svgPathDataAttribute} style={style} className={classes}></path>
    );
  }

  renderRoute(yOffset: number, route: IRoute, height: number): JSX.Element {
    const { from, to, branch } = route;
    const x_step = this._x_step;

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
    const radius = this._dotRadius;

    const colour = getColour(dot_branch);
    const strokeWidth = 1;
    const style = {
      stroke: colour,
      'stroke-width': strokeWidth,
      fill: colour
    };

    const classes = `commits-graph-branch-${dot_branch}`;

    return (
      <circle
        cx={x}
        cy={y}
        r={radius}
        style={style}
        data-sha={sha}
        className={classes}
      >
        <title>{sha.slice(0, 7)}</title>
      </circle>
    );
  }

  renderCommit(commit: INode): [JSX.Element, JSX.Element[]] {
    const { sha, dot, routes, yOffset } = commit;
    const { lateralOffset, branch } = dot;

    // draw dot
    const x = (lateralOffset + 1) * this._x_step;
    const y = yOffset;

    const commitNode = this.renderCommitNode(x, y, sha, branch);

    const routeNodes = routes.map(route =>
      this.renderRoute(
        commit.yOffset,
        route,
        this.props.getNodeHeight(commit.sha)
      )
    );
    return [commitNode, routeNodes];
  }

  render(): JSX.Element {
    // reset lookup table of commit node locations
    const allCommitNodes: JSX.Element[] = [];
    let allRouteNodes: JSX.Element[] = [];
    const commitNodes = this.getGraphData();
    commitNodes.forEach(node => {
      const commit = node;
      const [commitNode, routeNodes] = this.renderCommit(commit);
      allCommitNodes.push(commitNode);
      allRouteNodes = allRouteNodes.concat(routeNodes);
    });

    const children = [].concat(allRouteNodes, allCommitNodes);

    const height = this.getHeight();
    const width = this.getWidth();

    const style = { height, width, 'flex-shrink': 0 };

    return (
      <svg height={height} width={width} style={style}>
        {...children}
      </svg>
    );
  }

  private _graphData: INode[];
  private _x_step: number;
  private _dotRadius: number;
  private _lineWidth: number;
}
