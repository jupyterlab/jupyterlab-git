import { DocumentRegistry } from '@jupyterlab/docregistry';
import { nullTranslator } from '@jupyterlab/translation';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import 'jest';
import * as React from 'react';
import {
  HistorySideBar,
  IHistorySideBarProps
} from '../../components/HistorySideBar';
import { GitExtension } from '../../model';
import { fileStyle } from '../../style/FileItemStyle';
import {
  commitBodyClass,
  commitWrapperClass
} from '../../style/PastCommitNode';
import { selectedHistoryFileStyle } from '../../style/HistorySideBarStyle';

describe('HistorySideBar', () => {
  const trans = nullTranslator.load('jupyterlab-git');

  const props: IHistorySideBarProps = {
    commits: [
      {
        commit: '1234567890',
        author: null as any,
        date: null as any,
        commit_msg: null as any,
        pre_commits: [null as any]
      }
    ],
    branches: [],
    tagsList: [],
    model: {
      selectedHistoryFile: null
    } as GitExtension,
    commands: null as any,
    trans,
    referenceCommit: null,
    challengerCommit: null,
    onSelectForCompare: (() => async () => null) as any,
    onCompareWithSelected: (() => async () => null) as any
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
    render(<HistorySideBar {...props} />);

    const pastCommitNodes = screen
      .getAllByRole('listitem')
      .filter(el => el.classList.contains(commitWrapperClass));
    expect(pastCommitNodes).toHaveLength(1);
    const singlePastCommit = Array.from(
      pastCommitNodes[0].querySelectorAll(`.${commitBodyClass}`)
    );
    expect(singlePastCommit).toHaveLength(1);
    // Selected history file element
    expect(
      Array.from(singlePastCommit[0].querySelectorAll(`.${fileStyle}`))
    ).toHaveLength(0);
  });

  it('shows a message if no commits are found', () => {
    const propsWithoutCommits: IHistorySideBarProps = { ...props, commits: [] };
    render(<HistorySideBar {...propsWithoutCommits} />);

    expect(
      screen
        .getAllByRole('listitem')
        .filter(el => el.classList.contains(commitWrapperClass))
    ).toHaveLength(0);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('listitem')).toHaveTextContent('No history found.');
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

    render(<HistorySideBar {...propsWithSelectedFile} />);

    const selectedHistoryFile = Array.from(
      screen
        .getAllByRole('list')[0]
        .querySelectorAll(`.${selectedHistoryFileStyle}`)
    );
    expect(selectedHistoryFile).toHaveLength(1);
    expect(selectedHistoryFile[0]).toHaveTextContent('filepath/to');
    // Only renders with repository history
    const singlePastCommit = Array.from(
      screen
        .getAllByRole('listitem')[0]
        .querySelectorAll(`.${commitBodyClass}`)[0].children
    );
    expect(singlePastCommit).toHaveLength(0);
  });
});
