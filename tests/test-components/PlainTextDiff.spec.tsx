import { shallow } from 'enzyme';
import 'jest';
import * as React from 'react';
import { IDiffProps } from '../../src/components/diff/Diff';
import { mergeView } from '../../src/components/diff/mergeview';
import { PlainTextDiff } from '../../src/components/diff/PlainTextDiff';
import { requestAPI } from '../../src/git';
import { Git } from '../../src/tokens';
import * as diffResponse from '../test-components/data/textDiffResponse.json';

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

    (requestAPI as jest.Mock).mockRejectedValueOnce(
      new Git.GitResponseError(
        new Response('', { status: 401 }),
        'TEST_ERROR_MESSAGE'
      )
    );

    // When
    const node = shallow<PlainTextDiff>(<PlainTextDiff {...props} />);

    // Then
    let resolveTest: (value?: any) => void;
    const terminateTest = new Promise(resolve => {
      resolveTest = resolve;
    });
    setImmediate(() => {
      expect(requestAPI).toHaveBeenCalled();
      expect(requestAPI).toBeCalledWith('diffcontent', 'POST', {
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

    (requestAPI as jest.Mock).mockResolvedValueOnce(diffResponse);

    const mockMergeView = mergeView as jest.Mocked<typeof mergeView>;

    // When
    const node = shallow<PlainTextDiff>(<PlainTextDiff {...props} />);

    // Then
    let resolveTest: (value?: any) => void;
    const terminateTest = new Promise(resolve => {
      resolveTest = resolve;
    });
    setImmediate(() => {
      expect(requestAPI).toHaveBeenCalled();
      expect(requestAPI).toBeCalledWith('diffcontent', 'POST', {
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
