import * as React from 'react';
import { generateGraphData, ICommit, INode } from '../generateGraphData';
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

const classSet = (...classes: string[]): string =>
  classes.filter(Boolean).join(' ');

const getColour = function (branch: number) {
  const n = COLOURS.length;
  return COLOURS[branch % n];
};

const branchCount = function (data: INode[]): number {
  let maxBranch = -1;
  let i = 0;

  while (i < data.length) {
    let j = 0;

    while (j < data[i].routes.length) {
      if (
        maxBranch < data[i].routes[j][0] ||
        maxBranch < data[i].routes[j][1]
      ) {
        maxBranch = Math.max.apply(Math, [
          data[i].routes[j][0],
          data[i].routes[j][1]
        ]);
      }
      j++;
    }
    i++;
  }
  return maxBranch + 1;
};

// const distance = function (
//   point1: { x: number; y: number },
//   point2: { x: number; y: number }
// ) {
//   let xs = 0;
//   let ys = 0;
//   xs = point2.x - point1.x;
//   xs = xs * xs;
//   ys = point2.y - point1.y;
//   ys = ys * ys;
//   return Math.sqrt(xs + ys);
// };

export interface IGitCommitGraphProps {
  commits: ICommit[];
  x_step: number;
  y_step: number;
  height?: number;
  width?: number;
  dotRadius: number;
  lineWidth: number;
  mirror?: boolean;
}

export class GitCommitGraph extends React.Component<IGitCommitGraphProps> {
  constructor(props: IGitCommitGraphProps) {
    super(props);
  }

  // cursorPoint(e) {
  //   const svg = this.getDOMNode();
  //   const svgPoint = svg.createSVGPoint();
  //   svgPoint.x = e.clientX;
  //   svgPoint.y = e.clientY;
  //   return svgPoint.matrixTransform(svg.getScreenCTM().inverse());
  // }

  // handleClick(e) {
  //   const cursorLoc = this.cursorPoint(e);

  //   let smallestDistance = Infinity;
  //   let closestCommit = null;
  //   for (let commit of Array.from(this.renderedCommitsPositions)) {
  //     const commitDistance = distance(cursorLoc, commit);
  //     if (commitDistance < smallestDistance) {
  //       smallestDistance = commitDistance;
  //       closestCommit = commit;
  //     }
  //   }

  //   return typeof this.props.onClick === 'function'
  //     ? this.props.onClick(closestCommit.sha)
  //     : undefined;
  // }

  getGraphData(): INode[] {
    return (
      this.graphData || (this.graphData = generateGraphData(this.props.commits))
    );
  }

  getBranchCount(): number {
    return (
      this.branchCount || (this.branchCount = branchCount(this.getGraphData()))
    );
  }

  getWidth(): number {
    if (this.props.width !== null) {
      return this.props.width;
    }
    return this.getContentWidth();
  }

  getContentWidth(): number {
    return (this.getBranchCount() + 0.5) * this.props.x_step;
  }

  getHeight(): number {
    if (this.props.height !== null) {
      return this.props.height;
    }
    return this.getContentHeight();
  }

  getContentHeight(): number {
    return (this.getGraphData().length + 2) * this.props.y_step;
  }

  getInvert(): number {
    if (this.props.mirror) {
      return 0 - this.props.width;
    } else {
      return 0;
    }
  }

  getOffset(): number {
    return 0; //this.getWidth() / 2 - this.getContentWidth() / 2;
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

  renderRoute(
    commit_idx: number,
    route: [number, number, number]
  ): JSX.Element {
    const [from, to, branch] = route;
    const { x_step, y_step } = this.props;
    const offset = this.getOffset();
    const invert = this.getInvert();

    const svgPath = new SVGPathData();

    const from_x = offset + invert + (from + 1) * x_step;
    const from_y = (commit_idx + 0.5) * y_step;
    const to_x = offset + invert + (to + 1) * x_step;
    const to_y = (commit_idx + 0.5 + 1) * y_step;

    svgPath.moveTo(from_x, from_y);
    if (from_x === to_x) {
      svgPath.lineTo(to_x, to_y);
    } else {
      svgPath.bezierCurveTo(
        from_x - x_step / 4,
        from_y + (y_step / 3) * 2,
        to_x + x_step / 4,
        to_y - (y_step / 3) * 2,
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
    const classes = classSet(
      `commits-graph-branch-${dot_branch}`
      // selectedClass
    );

    return (
      <circle
        cx={x}
        cy={y}
        r={radius}
        style={style}
        //onClick: this.handleClick,
        data-sha={sha}
        className={classes}
      ></circle>
    );
  }

  renderCommit(idx: number, commit: INode): [JSX.Element, JSX.Element[]] {
    const { sha, dot, routes } = commit;
    const [dot_offset, dot_branch] = Array.from(dot);

    // draw dot
    const { x_step, y_step } = this.props;
    const offset = this.getOffset();
    const invert = this.getInvert();

    const x = offset + invert + (dot_offset + 1) * x_step;
    const y = (idx + 0.5) * y_step;

    const commitNode = this.renderCommitNode(x, y, sha, dot_branch);

    const routeNodes = routes.map((route, index) =>
      this.renderRoute(idx, route)
    );

    this.renderedCommitsPositions.push({ x, y, sha });

    return [commitNode, routeNodes];
  }

  render(): JSX.Element {
    // reset lookup table of commit node locations

    this.renderedCommitsPositions = [];

    const allCommitNodes: JSX.Element[] = [];
    let allRouteNodes: JSX.Element[] = [];

    this.getGraphData().forEach((node, index) => {
      const commit = node;
      const [commitNode, routeNodes] = this.renderCommit(index, commit);
      allCommitNodes.push(commitNode);
      allRouteNodes = allRouteNodes.concat(routeNodes);
    });

    const children = [].concat(allRouteNodes, allCommitNodes);

    const height = this.getHeight();
    const width = this.getWidth();

    const style = { height, width };
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
  branchCount: number;
}
