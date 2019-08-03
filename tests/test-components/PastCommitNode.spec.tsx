import * as React from 'react';
import { shallow } from 'enzyme';
import { SinglePastCommitInfo } from '../../src/components/SinglePastCommitInfo';
import { PastCommitNode } from '../../src/components/PastCommitNode';
import { IGitBranchResult } from '../../src/git';
import { collapseStyle } from '../../src/componentsStyle/PastCommitNodeStyle';
import 'jest';

describe('PastCommitNode', () => {
  const notMatchingBranches = [
    {
      is_current_branch: false,
      is_remote_branch: false,
      name: 'name1',
      upstream: 'upstream',
      top_commit: 'abcdefghijklmnopqrstuvwxyz01234567890123',
      tag: 'v1.0.4'
    },
    {
      is_current_branch: false,
      is_remote_branch: true,
      name: 'name2',
      upstream: 'upstream',
      top_commit: 'abcdefghijklmnopqrstuvwxyz01234567890123',
      tag: null
    }
  ];
  const matchingBranches = [
    {
      is_current_branch: false,
      is_remote_branch: false,
      name: 'name3',
      upstream: 'upstream',
      top_commit: '2414721b194453f058079d897d13c4e377f92dc6',
      tag: 'v1.0.4-14-g2414721'
    },
    {
      is_current_branch: false,
      is_remote_branch: true,
      name: 'name4',
      upstream: 'upstream',
      top_commit: '2414721b194453f058079d897d13c4e377f92dc6',
      tag: 'v1.0.5-0-g2414721'
    }
  ];
  const branches: IGitBranchResult['branches'] = notMatchingBranches.concat(
    matchingBranches
  );
  const props = {
    topRepoPath: null,
    app: null,
    diff: null,
    refresh: null,
    pastCommit: {
      commit: '2414721b194453f058079d897d13c4e377f92dc6',
      author: 'author',
      date: 'date',
      commit_msg: 'message',
      pre_commit: 'pre_commit'
    },
    branches: branches,
    renderMime: null,
    themeManager: null
  };
  test('Includes commit info', () => {
    const pastCommitNode = shallow(<PastCommitNode {...props} />);
    expect(pastCommitNode.text()).toMatch(props.pastCommit.author);
    expect(pastCommitNode.text()).toMatch(props.pastCommit.commit.slice(0, 7));
    expect(pastCommitNode.text()).toMatch(props.pastCommit.date);
    expect(pastCommitNode.text()).toMatch(props.pastCommit.commit_msg);
  });
  test('Includes only relevent branch info', () => {
    const pastCommitNode = shallow(<PastCommitNode {...props} />);
    expect(pastCommitNode.text()).toMatch('name3');
    expect(pastCommitNode.text()).toMatch('name4');
    expect(pastCommitNode.text()).not.toMatch('name1');
    expect(pastCommitNode.text()).not.toMatch('name2');
  });
  test('Doesnt include details at first', () => {
    const pastCommitNode = shallow(<PastCommitNode {...props} />);
    expect(pastCommitNode.find(SinglePastCommitInfo)).toHaveLength(0);
  });
  test('includes details after click', () => {
    const pastCommitNode = shallow(<PastCommitNode {...props} />);
    pastCommitNode.simulate('click');
    expect(pastCommitNode.find(SinglePastCommitInfo)).toHaveLength(1);
  });
  test('hides details after collapse', () => {
    const pastCommitNode = shallow(<PastCommitNode {...props} />);
    pastCommitNode.simulate('click');
    pastCommitNode.find(`.${collapseStyle}`).simulate('click');
    expect(pastCommitNode.find(SinglePastCommitInfo)).toHaveLength(0);
  });
});
