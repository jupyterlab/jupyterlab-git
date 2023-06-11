import * as React from 'react';
import { shallow } from 'enzyme';
import {
  HistorySideBar,
  IHistorySideBarProps
} from '../../components/HistorySideBar';
import 'jest';

import { PastCommitNode } from '../../components/PastCommitNode';
import { GitExtension } from '../../model';
import { nullTranslator } from '@jupyterlab/translation';
import { FileItem } from '../../components/FileItem';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { SinglePastCommitInfo } from '../../components/SinglePastCommitInfo';

describe('HistorySideBar', () => {
  const trans = nullTranslator.load('jupyterlab-git');

  const props: IHistorySideBarProps = {
    commits: [
      {
        commit: null,
        author: null,
        date: null,
        commit_msg: null,
        pre_commits: [null]
      }
    ],
    branches: [],
    model: {
      selectedHistoryFile: null
    } as GitExtension,
    commands: null,
    trans,
    referenceCommit: null,
    challengerCommit: null,
    onSelectForCompare: _ => async _ => null,
    onCompareWithSelected: _ => async _ => null
  };

  beforeEach(() => {
    Object.defineProperty(global, 'ResizeObserver', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        observe: jest.fn(() => 'Mocking works'),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      }))
    });
  });

  it('renders the commit nodes', () => {
    const historySideBar = shallow(<HistorySideBar {...props} />);
    expect(historySideBar.find(PastCommitNode)).toHaveLength(1);
    expect(historySideBar.find(SinglePastCommitInfo)).toHaveLength(1);
    // Selected history file element
    expect(historySideBar.find(FileItem)).toHaveLength(0);
  });

  it('shows a message if no commits are found', () => {
    const propsWithoutCommits: IHistorySideBarProps = { ...props, commits: [] };
    const historySideBar = shallow(<HistorySideBar {...propsWithoutCommits} />);
    expect(historySideBar.find(PastCommitNode)).toHaveLength(0);

    const noHistoryFound = historySideBar.find('li');
    expect(noHistoryFound).toHaveLength(1);
    expect(noHistoryFound.text()).toEqual('No history found.');
  });

  it('correctly shows the selected history file', () => {
    const propsWithSelectedFile: IHistorySideBarProps = {
      ...props,
      model: {
        selectedHistoryFile: {
          x: '',
          y: '',
          to: '/path/to/file',
          from: '',
          is_binary: null,
          status: 'unmodified',
          type: {} as DocumentRegistry.IFileType
        }
      } as GitExtension
    };

    const historySideBar = shallow(
      <HistorySideBar {...propsWithSelectedFile} />
    );
    const selectedHistoryFile = historySideBar.find(FileItem);
    expect(selectedHistoryFile).toHaveLength(1);
    expect(selectedHistoryFile.prop('file')).toEqual(
      propsWithSelectedFile.model.selectedHistoryFile
    );
    // Only renders with repository history
    expect(historySideBar.find(SinglePastCommitInfo)).toHaveLength(0);
  });
});
