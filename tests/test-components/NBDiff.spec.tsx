import { shallow } from 'enzyme';
import 'jest';
import * as React from 'react';
import { IDiffProps } from '../../src/components/diff/Diff';
import { CellDiff, NBDiff } from '../../src/components/diff/NbDiff';
import { NBDiffHeader } from '../../src/components/diff/NBDiffHeader';
import { requestAPI } from '../../src/git';
import { Git } from '../../src/tokens';
import * as diffResponse from '../test-components/data/nbDiffResponse.json';

jest.mock('../../src/git');

describe('NBDiff', () => {
  it('should render error in if API response is failed', async () => {
    // Given
    const props: IDiffProps = {
      path: '/path/to/File.ipynb',
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
    const node = shallow<NBDiff>(<NBDiff {...props} />);

    // Then
    let resolveTest: (value?: any) => void;
    const terminateTest = new Promise(resolve => {
      resolveTest = resolve;
    });
    setImmediate(() => {
      expect(requestAPI).toHaveBeenCalled();
      expect(requestAPI).toBeCalledWith(
        'gitdiff',
        'POST',
        {
          file_path: 'top/repo/path/path/to/File.ipynb',
          ref_remote: { special: 'WORKING' },
          ref_local: { git: '83baee' }
        },
        'nbdime/api'
      );
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
      path: '/path/to/File.ipynb',
      topRepoPath: '/top/repo/path',
      diffContext: {
        currentRef: { specialRef: 'WORKING' },
        previousRef: { gitRef: '83baee' }
      }
    };

    (requestAPI as jest.Mock).mockResolvedValueOnce(diffResponse);

    // When
    const node = shallow<NBDiff>(<NBDiff {...props} />);

    // Then
    let resolveTest: (value?: any) => void;
    const terminateTest = new Promise(resolve => {
      resolveTest = resolve;
    });
    setImmediate(() => {
      expect(requestAPI).toHaveBeenCalled();
      expect(requestAPI).toBeCalledWith(
        'gitdiff',
        'POST',
        {
          file_path: 'top/repo/path/path/to/File.ipynb',
          ref_remote: { special: 'WORKING' },
          ref_local: { git: '83baee' }
        },
        'nbdime/api'
      );
      node.update();
      expect(node.find('.jp-git-diff-error')).toHaveLength(0);
      expect(node.find(NBDiffHeader)).toHaveLength(1);
      expect(node.find(CellDiff)).toHaveLength(3);
      resolveTest();
    });
    await terminateTest;
  });
});
