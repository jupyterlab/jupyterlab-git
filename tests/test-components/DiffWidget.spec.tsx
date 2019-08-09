import 'jest';
import { httpGitRequest } from '../../src/git';
import { getRelativeFilePath } from '../../src/components/diff/DiffWidget';
import { createTestResponse } from './testutils';

jest.mock('../../src/git');

describe('DiffWidget', () => {
  it('should return relative path correctly ', async function() {
    const testData = [
      [
        'somefolder/file',
        '/path/to/server/dir1/dir2/repo',
        'dir1/dir2/repo/somefolder/file'
      ],
      ['file', '/path/to/server/repo', 'repo/file'],
      ['somefolder/file', '/path/to/server/repo', 'repo/somefolder/file'],
      ['somefolder/file', '/path/to/server', 'somefolder/file'],
      ['file', '/path/to/server', 'file']
    ];

    for (const testDatum of testData) {
      await testGetRelativeFilePath(testDatum[0], testDatum[1], testDatum[2]);
    }
  });

  async function testGetRelativeFilePath(
    filePath: string,
    repoPath: string,
    expectedResult: string
  ): Promise<void> {
    // Given
    const jsonResult: Promise<any> = Promise.resolve({
      server_root: '/path/to/server'
    });

    (httpGitRequest as jest.Mock).mockReturnValue(
      createTestResponse(200, jsonResult)
    );

    // When
    const result = await getRelativeFilePath(filePath, repoPath);

    // Then
    expect(result).toBe(expectedResult);
    expect(httpGitRequest).toHaveBeenCalled();
    expect(httpGitRequest).toBeCalledWith('/git/server_root', 'POST', {});
  }
});
