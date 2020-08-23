import { shallow } from 'enzyme';
import 'jest';
import * as React from 'react';
import { IDiffProps } from '../../src/components/diff/Diff';
import { CellDiff, NBDiff } from '../../src/components/diff/NbDiff';
import { NBDiffHeader } from '../../src/components/diff/NBDiffHeader';
import { httpGitRequest } from '../../src/git';
import * as diffResponse from '../test-components/data/nbDiffResponse.json';
import { createTestResponse } from './testutils';

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

    let resolveJson: (value?: any) => void;
    const jsonResult = new Promise<any>(resolve => {
      resolveJson = resolve;
    });

    (httpGitRequest as jest.Mock).mockReturnValue(
      createTestResponse(401, jsonResult)
    );

    // When
    const node = shallow<NBDiff>(<NBDiff {...props} />);
    resolveJson({
      message: 'TEST_ERROR_MESSAGE'
    });

    // Then
    let resolveTest: () => void;
    const terminateTest = new Promise(resolve => {resolveTest = resolve});
    setImmediate(() => {
      expect(httpGitRequest).toHaveBeenCalled();
      expect(httpGitRequest).toBeCalledWith('/nbdime/api/gitdiff', 'POST', {
        file_path: 'top/repo/path/path/to/File.ipynb',
        ref_remote: { special: 'WORKING' },
        ref_local: { git: '83baee' }
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
      path: '/path/to/File.ipynb',
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

    (httpGitRequest as jest.Mock).mockReturnValue(
      createTestResponse(200, jsonResult)
    );

    // When
    const node = shallow<NBDiff>(<NBDiff {...props} />);
    resolveJson(diffResponse);

    // Then
    let resolveTest: () => void;
    const terminateTest = new Promise(resolve => {resolveTest = resolve});
    setImmediate(() => {
      expect(httpGitRequest).toHaveBeenCalled();
      expect(httpGitRequest).toBeCalledWith('/nbdime/api/gitdiff', 'POST', {
        file_path: 'top/repo/path/path/to/File.ipynb',
        ref_remote: { special: 'WORKING' },
        ref_local: { git: '83baee' }
      });
      node.update();
      expect(node.find('.jp-git-diff-error')).toHaveLength(0);
      expect(node.find(NBDiffHeader)).toHaveLength(1);
      expect(node.find(CellDiff)).toHaveLength(3);
      resolveTest();
    });
    await terminateTest;
  });
});
