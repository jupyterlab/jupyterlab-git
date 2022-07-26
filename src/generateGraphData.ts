export interface ICommit {
  sha: string;
  parents: string[];
}
export interface INode {
  sha: string;
  dot: [number, number];
  routes: [number, number, number][];
}

const Node = (
  sha: string,
  offset: number,
  branch: number,
  routes: [number, number, number][]
): INode => ({
  sha,
  dot: [offset, branch],
  routes
});

const remove = function (list: number[], item: number) {
  list.splice(list.indexOf(item), 1);
  return list;
};

/*
  Generate preformatted data of commits graph.
*/
export const generateGraphData = function (commits: ICommit[]): INode[] {
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

  for (const commit of commits) {
    let b, i;
    const branch = getBranch(commit.sha);
    const numParents = commit.parents.length;
    const offset = reserve.indexOf(branch);
    const routes: [number, number, number][] = [];

    if (numParents === 1) {
      if (branches[commit.parents[0]] || branches[commit.parents[0]] === 0) {
        // create branch
        const iterable = reserve.slice(offset + 1);
        for (i = 0; i < iterable.length; i++) {
          b = iterable[i];
          routes.push([i + offset + 1, i + offset + 1 - 1, b]);
        }
        const iterable1 = reserve.slice(0, offset);
        for (i = 0; i < iterable1.length; i++) {
          b = iterable1[i];
          routes.push([i, i, b]);
        }
        remove(reserve, branch);
        routes.push([
          offset,
          reserve.indexOf(branches[commit.parents[0]]),
          branch
        ]);
      } else {
        // straight
        for (i = 0; i < reserve.length; i++) {
          b = reserve[i];
          routes.push([i, i, b]);
        }
        branches[commit.parents[0]] = branch;
      }
    } else if (numParents === 2) {
      // merge branch
      branches[commit.parents[0]] = branch;
      for (i = 0; i < reserve.length; i++) {
        b = reserve[i];
        routes.push([i, i, b]);
      }
      const otherBranch = getBranch(commit.parents[1]);
      routes.push([offset, reserve.indexOf(otherBranch), otherBranch]);
    }

    const node = Node(commit.sha, offset, branch, routes);
    nodes.push(node);
  }

  return nodes;
};
