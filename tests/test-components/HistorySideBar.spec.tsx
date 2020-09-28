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
    commits: [
      {
        commit: null,
        author: null,
        date: null,
        commit_msg: null,
        pre_commit: null
      }
    ],
    branches: [],
    model: null,
    commands: null
  };
  test('renders commit nodes', () => {
    const historySideBar = shallow(<HistorySideBar {...props} />);
    expect(historySideBar.find(PastCommitNode)).toHaveLength(1);
  });
});
