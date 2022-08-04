export interface ICommit {
  sha: string;
  parents: string[];
}
export interface INode {
  sha: string;
  dot: { lateralOffset: number; branch: number };
  routes: IRoute[];
  yOffset: number;
}
export interface IRoute {
  from: number;
  to: number;
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

const remove = function (list: number[], item: number) {
  list.splice(list.indexOf(item), 1);
  return list;
};

/*
  Generate preformatted data of commits graph.
*/
export const generateGraphData = function (
  commits: ICommit[],
  getNodeHeight: (sha: string) => number
): INode[] {
  /*
  Generate graph data.

  :param commits: a list of commit, which should have
      `sha`, `parents` properties.
  :returns: data nodes, a json list of
      [
      sha,
      [offset, branch], //dot
      [
      [from, to, branch],  // route 1
      [from, to, branch],  // route 2
      [from, to, branch],
      ]  // routes
      ],  // node
  */

  const nodes: INode[] = [];
  const branchIndex = [0];
  const reserve: number[] = [];
  const branches: { [sha: string]: number } = {};

  const getBranch = function (sha: string) {
    if (branches[sha] === null || branches[sha] === undefined) {
      branches[sha] = branchIndex[0];
      reserve.push(branchIndex[0]);
      branchIndex[0]++;
    }
    return branches[sha];
  };
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
};
