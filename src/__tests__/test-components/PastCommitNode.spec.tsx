import { nullTranslator } from '@jupyterlab/translation';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest';
import * as React from 'react';
import {
  IPastCommitNodeProps,
  PastCommitNode
} from '../../components/PastCommitNode';
import { Git } from '../../tokens';

describe('PastCommitNode', () => {
  const trans = nullTranslator.load('jupyterlab-git');

  const notMatchingBranches: Git.IBranch[] = [
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
  const matchingBranches: Git.IBranch[] = [
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
  const branches: Git.IBranch[] = notMatchingBranches.concat(matchingBranches);
  const matchingTags: Git.ITag[] = [
    {
      name: '1.0.0',
      baseCommitId: '2414721b194453f058079d897d13c4e377f92dc6'
    },
    {
      name: 'feature-1',
      baseCommitId: '2414721b194453f058079d897d13c4e377f92dc6'
    }
  ];
  const notMatchingTags: Git.ITag[] = [
    {
      name: 'feature-2',
      baseCommitId: '798438398'
    },
    {
      name: 'patch-007',
      baseCommitId: '238848848'
    }
  ];
  const tags: Git.ITag[] = notMatchingTags.concat(matchingTags);
  const toggleCommitExpansion = jest.fn();
  const props: IPastCommitNodeProps = {
    model: null as any,
    commit: {
      commit: '2414721b194453f058079d897d13c4e377f92dc6',
      author: 'author',
      date: 'date',
      commit_msg: 'message',
      pre_commits: ['pre_commit']
    },
    branches: branches,
    tagsList: tags,
    commands: null as any,
    trans,
    onCompareWithSelected: null as any,
    onSelectForCompare: null as any,
    expanded: false,
    toggleCommitExpansion,
    setRef: () => null
  };

  test('Includes commit info', () => {
    render(<PastCommitNode {...props} />);
    expect(screen.getByText(props.commit.author)).toBeDefined();
    expect(screen.getByText(props.commit.commit.slice(0, 7))).toBeDefined();
    expect(screen.getByText(props.commit.date)).toBeDefined();
    expect(screen.getByText(props.commit.commit_msg)).toBeDefined();
  });

  test('Includes only relevant branch info', () => {
    render(<PastCommitNode {...props} />);
    expect(screen.getByText('name3')).toBeDefined();
    expect(screen.getByText('name4')).toBeDefined();
    expect(screen.queryByText('name1')).toBeNull();
    expect(screen.queryByText('name2')).toBeNull();
  });

  test('Includes only relevant tag info', () => {
    render(<PastCommitNode {...props} />);
    expect(screen.getByText('1.0.0')).toBeDefined();
    expect(screen.getByText('feature-1')).toBeDefined();
    expect(screen.queryByText('feature-2')).toBeNull();
    expect(screen.queryByText('patch-007')).toBeNull();
  });

  test('Toggle show details', async () => {
    // simulates SinglePastCommitInfo child
    render(
      <PastCommitNode {...props}>
        <div id="singlePastCommitInfo"></div>
      </PastCommitNode>
    );
    await userEvent.click(screen.getByRole('listitem'));
    expect(toggleCommitExpansion).toBeCalledTimes(1);
    expect(toggleCommitExpansion).toHaveBeenCalledWith(props.commit.commit);
  });
});
