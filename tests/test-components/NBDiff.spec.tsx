import * as React from 'react';
import { shallow } from 'enzyme';
import 'jest';
import { IDiffProps } from '../../src/components/diff/Diff';
import { CellDiff, NBDiff } from '../../src/components/diff/NbDiff';
import * as diffResponse from '../test-components/data/diffResponse.json';
import { httpGitRequest } from '../../src/git';
import { NBDiffHeader } from '../../src/components/diff/NBDiffHeader';
import { createTestResponse } from './testutils';

jest.mock('../../src/git');

describe('NBDiff', () => {
  it('should render error in if API response is failed', async function() {
    // Given
    const props: IDiffProps = {
      path: '/path/to/File.ipynb',
      diffContext: {
        currentRef: { specialRef: 'WORKING' },
        previousRef: { gitRef: '83baee' }
      }
    };

    const jsonResult: Promise<any> = Promise.resolve({
      message: 'TEST_ERROR_MESSAGE'
    });

    (httpGitRequest as jest.Mock).mockReturnValue(
      createTestResponse(401, jsonResult)
    );

    // When
    const node = shallow(<NBDiff {...props} />);

    // Then
    jsonResult.then(() => {
      node.update();

      expect(httpGitRequest).toHaveBeenCalled();
      expect(httpGitRequest).toBeCalledWith('/nbdime/api/gitdiff', 'POST', {
        file_path: '/path/to/File.ipynb',
        ref_remote: { special: 'WORKING' },
        ref_local: { git: '83baee' }
      });
      expect(node.find('.jp-git-diff-error').text()).toContain(
        'TEST_ERROR_MESSAGE'
      );
    });
  });

  it('should render header and cell diff components in success case', async function() {
    // Given
    const props: IDiffProps = {
      path: '/path/to/File.ipynb',
      diffContext: {
        currentRef: { specialRef: 'WORKING' },
        previousRef: { gitRef: '83baee' }
      }
    };

    const jsonResult: Promise<any> = Promise.resolve({
      diffResponse
    });

    (httpGitRequest as jest.Mock).mockReturnValue(
      createTestResponse(200, jsonResult)
    );

    // When
    const node = shallow(<NBDiff {...props} />);

    // Then
    jsonResult.then(() => {
      node.update();

      expect(httpGitRequest).toHaveBeenCalled();
      expect(httpGitRequest).toBeCalledWith('/nbdime/api/gitdiff', 'POST', {
        file_path: '/path/to/File.ipynb',
        ref_remote: { special: 'WORKING' },
        ref_local: { git: '83baee' }
      });
      expect(node.find('.jp-git-diff-error').html()).toBeNull();
      expect(node.find(NBDiffHeader)).toHaveLength(1);
      expect(node.find(CellDiff)).toHaveLength(2);
    });
  });
});
