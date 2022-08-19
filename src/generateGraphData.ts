/**
 * Represent a commit to be rendered in the GitCommitGraph.
 */
export interface ICommit {
  /**
   * The hash of the commit.
   */
  sha: string;
  /**
   * A list of parents' hashes.
   */
  parents: string[];
}
/**
 * Represents a commit node in the GitCommitGraph.
 */
export interface INode {
  /**
   * The hash of the commit.
   */
  sha: string;
  /**
   * The commit dot in GitCommitGraph.
   */
  dot: { lateralOffset: number; branch: number };
  /**
   * A list of routes that should be rendered together with the dot.
   */
  routes: IRoute[];
  /**
   * Vertical offset of the dot and the start of the route(s) with respect to the top of the svg image.
   */
  yOffset: number;
}
/**
 * Represent a route that should be rendered with a commit dot.
 */
export interface IRoute {
  /**
   * lateral offset of the start of the route
   */
  from: number;
  /**
   * lateral offset of the end of the route
   */
  to: number;
  /**
   * The route's branch number.
   */
  branch: number;
}

const Node = (
  sha: string,
  offset: number,
  branch: number,
  routes: IRoute[],
  yOffset: number
): INode => ({
  sha,
  dot: { lateralOffset: offset, branch },
  routes,
  yOffset
});

function remove(list: number[], item: number): number[] {
  list.splice(list.indexOf(item), 1);
  return list;
}

/**
 * Generate graph data.
 * @param commits a list of commit, which should have `sha`, `parents` properties.
 * @param getNodeHeight a callback to retrieve the height of the history node
 * @returns data nodes, a json list of
      [ 
        {
          sha,
          {offset, branch}, //dot
          [
            {from, to, branch},  // route 1
            {from, to, branch},  // route 2
            {from, to, branch},
          ] // routes
        } // node
      ],  
 */
export function generateGraphData(
  commits: ICommit[],
  getNodeHeight: (sha: string) => number
): INode[] {
  const nodes: INode[] = [];
  const branchIndex = [0];
  const reserve: number[] = [];
  const branches: { [sha: string]: number } = {};

  function getBranch(sha: string) {
    if (branches[sha] === null || branches[sha] === undefined) {
      branches[sha] = branchIndex[0];
      reserve.push(branchIndex[0]);
      branchIndex[0]++;
    }
    return branches[sha];
  }
  let currentYOffset = 25;
  commits.forEach((commit, index) => {
    let b, i;
    const branch = getBranch(commit.sha);
    const numParents = commit.parents.length;
    const offset = reserve.indexOf(branch);
    const routes: IRoute[] = [];

    if (numParents === 1) {
      if (branches[commit.parents[0]] || branches[commit.parents[0]] === 0) {
        // create branch
        const iterable = reserve.slice(offset + 1);
        for (i = 0; i < iterable.length; i++) {
          b = iterable[i];
          routes.push({
            from: i + offset + 1,
            to: i + offset + 1 - 1,
            branch: b
          });
        }
        const iterable1 = reserve.slice(0, offset);
        for (i = 0; i < iterable1.length; i++) {
          b = iterable1[i];
          routes.push({ from: i, to: i, branch: b });
        }
        remove(reserve, branch);
        routes.push({
          from: offset,
          to: reserve.indexOf(branches[commit.parents[0]]),
          branch
        });
      } else {
        // straight
        for (i = 0; i < reserve.length; i++) {
          b = reserve[i];
          routes.push({ from: i, to: i, branch: b });
        }
        branches[commit.parents[0]] = branch;
      }
    } else if (numParents === 2) {
      // merge branch
      branches[commit.parents[0]] = branch;
      for (i = 0; i < reserve.length; i++) {
        b = reserve[i];
        routes.push({ from: i, to: i, branch: b });
      }
      const otherBranch = getBranch(commit.parents[1]);
      routes.push({
        from: offset,
        to: reserve.indexOf(otherBranch),
        branch: otherBranch
      });
    }
    if (index - 1 >= 0) {
      currentYOffset += getNodeHeight(commits[index - 1].sha);
    }
    const node = Node(commit.sha, offset, branch, routes, currentYOffset);
    nodes.push(node);
  });

  return nodes;
}
