import * as React from 'react';
import { shallow } from 'enzyme';
import {
  HistorySideBar,
  IHistorySideBarProps
} from '../../src/components/HistorySideBar';
import 'jest';

import { PastCommitNode } from '../../src/components/PastCommitNode';

describe('HistorySideBar', () => {
  const props: IHistorySideBarProps = {
    pastCommits: [
      {
        commit: null,
        author: null,
        date: null,
        commit_msg: null,
        pre_commit: null
      }
    ],
    branches: [],
    isExpanded: true,
    topRepoPath: null,
    app: null,
    refresh: null,
    diff: null,
    renderMime: null
  };
  test('renders commit nodes when expanded', () => {
    const historySideBar = shallow(<HistorySideBar {...props} />);
    expect(historySideBar.find(PastCommitNode)).toHaveLength(1);
  });
  test('does not render commit nodes when not expanded', () => {
    const historySideBar = shallow(
      <HistorySideBar {...props} isExpanded={false} />
    );
    expect(historySideBar.find(PastCommitNode)).toHaveLength(0);
  });
});
