import { nullTranslator } from '@jupyterlab/translation';
import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import 'jest';
import * as React from 'react';
import { CommitComparisonBox } from '../../components/CommitComparisonBox';
import { Git } from '../../tokens';

describe('CommitComparisonBox', () => {
  const trans = nullTranslator.load('jupyterlab_git');

  function createDiffResult(filename: string): Git.IDiffResult {
    return {
      code: 0,
      result: [
        {
          deletions: '1',
          filename,
          insertions: '2'
        }
      ]
    };
  }

  function createDeferred<T>(): {
    promise: Promise<T>;
    reject: (reason?: unknown) => void;
    resolve: (value: T) => void;
  } {
    let reject!: (reason?: unknown) => void;
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, reject, resolve };
  }

  it('should request a diff between two Git refs', async () => {
    const model = {
      diff: jest.fn().mockResolvedValue(createDiffResult('src/index.ts'))
    };

    render(
      <CommitComparisonBox
        header="Compare main and feature"
        reference={{ ref: 'main', label: 'main' }}
        challenger={{ ref: 'feature', label: 'feature' }}
        model={model as any}
        trans={trans}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(model.diff).toHaveBeenCalledWith('main', 'feature');
    });
  });

  it('should keep the history comparison empty state text', () => {
    const model = {
      diff: jest.fn()
    };

    render(
      <CommitComparisonBox
        header="Compare main and ..."
        reference={{ ref: 'main', label: 'main' }}
        challenger={null}
        model={model as any}
        trans={trans}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByText('No challenger commit selected.')
    ).toBeInTheDocument();
    expect(model.diff).not.toHaveBeenCalled();
  });

  it('should ignore stale diff results when refs change', async () => {
    const firstDiff = createDeferred<Git.IDiffResult>();
    const secondDiff = createDeferred<Git.IDiffResult>();
    const model = {
      diff: jest
        .fn()
        .mockReturnValueOnce(firstDiff.promise)
        .mockReturnValueOnce(secondDiff.promise)
    };

    const { rerender } = render(
      <CommitComparisonBox
        header="Compare main and feature-one"
        reference={{ ref: 'main', label: 'main' }}
        challenger={{ ref: 'feature-one', label: 'feature-one' }}
        model={model as any}
        trans={trans}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(model.diff).toHaveBeenCalledWith('main', 'feature-one');
    });

    rerender(
      <CommitComparisonBox
        header="Compare main and feature-two"
        reference={{ ref: 'main', label: 'main' }}
        challenger={{ ref: 'feature-two', label: 'feature-two' }}
        model={model as any}
        trans={trans}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(model.diff).toHaveBeenCalledWith('main', 'feature-two');
    });

    await act(async () => {
      secondDiff.resolve(createDiffResult('second.ts'));
      await secondDiff.promise;
    });

    expect(await screen.findByText('second.ts')).toBeInTheDocument();

    await act(async () => {
      firstDiff.resolve(createDiffResult('first.ts'));
      await firstDiff.promise;
    });

    expect(screen.queryByText('first.ts')).not.toBeInTheDocument();
    expect(screen.getByText('second.ts')).toBeInTheDocument();
  });

  it('should clear existing files when a diff request fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const model = {
      diff: jest
        .fn()
        .mockResolvedValueOnce(createDiffResult('old.ts'))
        .mockRejectedValueOnce(new Error('Failed'))
    };

    const { rerender } = render(
      <CommitComparisonBox
        header="Compare main and feature"
        reference={{ ref: 'main', label: 'main' }}
        challenger={{ ref: 'feature', label: 'feature' }}
        model={model as any}
        trans={trans}
        onClose={jest.fn()}
      />
    );

    try {
      expect(await screen.findByText('old.ts')).toBeInTheDocument();

      rerender(
        <CommitComparisonBox
          header="Compare main and broken"
          reference={{ ref: 'main', label: 'main' }}
          challenger={{ ref: 'broken', label: 'broken' }}
          model={model as any}
          trans={trans}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(model.diff).toHaveBeenCalledWith('main', 'broken');
        expect(screen.queryByText('old.ts')).not.toBeInTheDocument();
      });
    } finally {
      consoleError.mockRestore();
    }
  });
});
