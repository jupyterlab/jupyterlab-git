import 'jest';
import { mergeView } from '../../src/components/diff/mergeview';
import { DiffModel } from '../../src/components/diff/model';
import { PlainTextDiff } from '../../src/components/diff/PlainTextDiff';
import { Git } from '../../src/tokens';

jest.mock('../../src/git');
jest.mock('../../src/components/diff/mergeview');

describe('PlainTextDiff', () => {
  it('should render file diff', async () => {
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
      filename: 'to/File.py',
      repositoryPath: 'path'
    });

    const mockMergeView = mergeView as jest.Mocked<typeof mergeView>;

    // When
    const widget = new PlainTextDiff(model);
    await widget.ready;

    // Then
    let resolveTest: (value?: any) => void;
    const terminateTest = new Promise(resolve => {
      resolveTest = resolve;
    });
    setImmediate(() => {
      expect(widget.node.querySelectorAll('.jp-git-diff-error')).toHaveLength(
        0
      );
      // merge view was not called as it happens when the widget got attach
      expect(mockMergeView).not.toHaveBeenCalled();
      resolveTest();
    });
    await terminateTest;
  });

  it('should render error in if API response is failed', async () => {
    // Given
    const model = new DiffModel({
      challenger: {
        content: () => Promise.reject('TEST_ERROR_MESSAGE'),
        label: 'WORKING',
        source: Git.Diff.SpecialRef.WORKING
      },
      reference: {
        content: () => Promise.resolve('reference'),
        label: '83baee',
        source: '83baee'
      },
      filename: 'to/File.py',
      repositoryPath: 'path'
    });

    const mockMergeView = mergeView as jest.Mocked<typeof mergeView>;

    // When
    const widget = new PlainTextDiff(model);
    await widget.ready;

    // Then
    let resolveTest: (value?: any) => void;
    const terminateTest = new Promise(resolve => {
      resolveTest = resolve;
    });
    setImmediate(() => {
      expect(
        widget.node.querySelector('.jp-git-diff-error').innerHTML
      ).toContain('TEST_ERROR_MESSAGE');
      expect(mockMergeView).not.toHaveBeenCalled();
      resolveTest();
    });
    await terminateTest;
  });
});
