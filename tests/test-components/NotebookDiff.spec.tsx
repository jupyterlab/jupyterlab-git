import 'jest';
import { DiffModel } from '../../src/components/diff/model';
import {
  NotebookDiff,
  ROOT_CLASS
} from '../../src/components/diff/NotebookDiff';
import { requestAPI } from '../../src/git';
import { Git } from '../../src/tokens';
import * as diffResponse from './data/nbDiffResponse.json';

jest.mock('../../src/git');

describe('NotebookDiff', () => {
  it('should render notebook diff in success case', async () => {
    // Given
    const model = new DiffModel({
      challenger: {
        content: () => Promise.resolve('challenger'),
        label: 'WORKING',
        source: Git.Diff.SpecialRef.WORKING
      },
      reference: {
        content: () => Promise.resolve('reference'),
        label: '83baee',
        source: '83baee'
      },
      filename: 'to/File.ipynb',
      repositoryPath: 'path'
    });

    (requestAPI as jest.Mock).mockResolvedValueOnce(diffResponse);

    // When
    const widget = new NotebookDiff(model, null);
    await widget.ready;

    // Then
    let resolveTest: (value?: any) => void;
    const terminateTest = new Promise(resolve => {
      resolveTest = resolve;
    });
    setImmediate(() => {
      expect(requestAPI).toHaveBeenCalled();
      expect(requestAPI).toBeCalledWith('diffnotebook', 'POST', {
        currentContent: 'challenger',
        previousContent: 'reference'
      });
      expect(widget.node.querySelectorAll('.jp-git-diff-error')).toHaveLength(
        0
      );
      expect(widget.node.querySelectorAll(`.${ROOT_CLASS}`)).toHaveLength(1);
      expect(widget.node.querySelectorAll('.jp-Notebook-diff')).toHaveLength(1);
      resolveTest();
    });
    await terminateTest;
  });

  it('should render error in if API response is failed', async () => {
    // Given
    const model = new DiffModel({
      challenger: {
        content: () => Promise.resolve('challenger'),
        label: 'WORKING',
        source: Git.Diff.SpecialRef.WORKING
      },
      reference: {
        content: () => Promise.resolve('reference'),
        label: '83baee',
        source: '83baee'
      },
      filename: 'to/File.ipynb',
      repositoryPath: 'path'
    });

    (requestAPI as jest.Mock).mockRejectedValueOnce(
      new Git.GitResponseError(
        new Response('', { status: 401 }),
        'TEST_ERROR_MESSAGE'
      )
    );

    // When
    const widget = new NotebookDiff(model, null);
    await widget.ready;

    // Then
    let resolveTest: (value?: any) => void;
    const terminateTest = new Promise(resolve => {
      resolveTest = resolve;
    });
    setImmediate(() => {
      expect(requestAPI).toHaveBeenCalled();
      expect(requestAPI).toBeCalledWith('diffnotebook', 'POST', {
        currentContent: 'challenger',
        previousContent: 'reference'
      });
      expect(
        widget.node.querySelector('.jp-git-diff-error').innerHTML
      ).toContain('TEST_ERROR_MESSAGE');
      resolveTest();
    });
    await terminateTest;
  });
});
