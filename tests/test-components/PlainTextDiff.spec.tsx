import { shallow } from 'enzyme';
import 'jest';
import * as React from 'react';
import { IDiffProps } from '../../src/components/diff/Diff';
import { mergeView } from '../../src/components/diff/mergeview';
import { PlainTextDiff } from '../../src/components/diff/PlainTextDiff';
import { httpGitRequest } from '../../src/git';
import * as diffResponse from '../test-components/data/textDiffResponse.json';
import { createTestResponse } from './testutils';

jest.mock('../../src/git');
jest.mock('../../src/components/diff/mergeview');

describe('PlainTextDiff', () => {
  it('should render error in if API response is failed', async () => {
    // Given
    const props: IDiffProps = {
      path: '/path/to/File.py',
      topRepoPath: '/top/repo/path',
      diffContext: {
        currentRef: { specialRef: 'WORKING' },
        previousRef: { gitRef: '83baee' }
      }
    };

    let resolveJson: (value?: any) => void;
    const jsonResult: Promise<any> = new Promise<any>(resolve => {
      resolveJson = resolve;
    });

    (httpGitRequest as jest.Mock).mockReturnValueOnce(
      createTestResponse(401, jsonResult)
    );

    // When
    const node = shallow<PlainTextDiff>(<PlainTextDiff {...props} />);
    resolveJson({
      message: 'TEST_ERROR_MESSAGE'
    });

    // Then
    let resolveTest: () => void;
    const terminateTest = new Promise(resolve => {resolveTest = resolve});
    setImmediate(() => {
      expect(httpGitRequest).toHaveBeenCalled();
      expect(httpGitRequest).toBeCalledWith('/git/diffcontent', 'POST', {
        curr_ref: {
          special: 'WORKING'
        },
        filename: '/path/to/File.py',
        prev_ref: {
          git: '83baee'
        },
        top_repo_path: '/top/repo/path'
      });
      expect(
        node
          .update()
          .find('.jp-git-diff-error')
          .text()
      ).toContain('TEST_ERROR_MESSAGE');
      resolveTest();
    });
    await terminateTest;
  });

  it('should render header and cell diff components in success case', async () => {
    // Given
    const props: IDiffProps = {
      path: '/path/to/File.py',
      topRepoPath: '/top/repo/path',
      diffContext: {
        currentRef: { specialRef: 'WORKING' },
        previousRef: { gitRef: '83baee' }
      }
    };

    let resolveJson: (value?: any) => void;
    const jsonResult: Promise<any> = new Promise<any>(resolve => {
      resolveJson = resolve;
    });

    (httpGitRequest as jest.Mock).mockReturnValueOnce(
      createTestResponse(200, jsonResult)
    );

    const mockMergeView = mergeView as jest.Mocked<typeof mergeView>;

    // When
    const node = shallow<PlainTextDiff>(<PlainTextDiff {...props} />);
    resolveJson(diffResponse);

    // Then
    let resolveTest: () => void;
    const terminateTest = new Promise(resolve => {resolveTest = resolve});
    setImmediate(() => {
      expect(httpGitRequest).toHaveBeenCalled();
      expect(httpGitRequest).toBeCalledWith('/git/diffcontent', 'POST', {
        curr_ref: {
          special: 'WORKING'
        },
        filename: '/path/to/File.py',
        prev_ref: {
          git: '83baee'
        },
        top_repo_path: '/top/repo/path'
      });
      expect(node.update().find('.jp-git-diff-error')).toHaveLength(0);
      expect(mockMergeView).toBeCalled();
      resolveTest();
    });
    await terminateTest;
  });
});
