import 'jest';
import { DiffModel } from '../../components/diff/model';
import { PlainTextDiff } from '../../components/diff/PlainTextDiff';
import { Git } from '../../tokens';

jest.mock('../../git');

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

    // When
    const widget = new PlainTextDiff({ model });
    await widget.ready;

    // Then
    let resolveTest: (value?: any) => void;
    const terminateTest = new Promise(resolve => {
      resolveTest = resolve;
    });
    setTimeout(() => {
      expect(widget.node.querySelectorAll('.jp-git-diff-error')).toHaveLength(
        0
      );
      resolveTest();
    }, 0);
    await terminateTest;
  });

  it('should render diff header labels as text', async () => {
    // Given
    const maliciousLabel =
      '<img src=x onerror="window.__jupyterLabGitXss = true">.py';
    const model = new DiffModel({
      challenger: {
        content: () => Promise.resolve('challenger'),
        label: maliciousLabel,
        source: 'HEAD'
      },
      reference: {
        content: () => Promise.resolve('reference'),
        label: '83baee',
        source: '83baee'
      },
      filename: maliciousLabel,
      repositoryPath: 'path'
    });

    // When
    const widget = new PlainTextDiff({ model });
    await widget.ready;

    // Then
    const header = widget.node.querySelector('.jp-git-diff-banner')!;
    expect(header.querySelector('img')).toBeNull();
    expect(header.textContent).toContain(maliciousLabel);
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

    // When
    const widget = new PlainTextDiff({ model });
    await widget.ready;

    // Then
    let resolveTest: (value?: any) => void;
    const terminateTest = new Promise(resolve => {
      resolveTest = resolve;
    });
    setTimeout(() => {
      expect(
        widget.node.querySelector('.jp-git-diff-error')!.innerHTML
      ).toContain('TEST_ERROR_MESSAGE');
      resolveTest();
    }, 0);
    await terminateTest;
  });
});
