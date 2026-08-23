import { nullTranslator } from '@jupyterlab/translation';
import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import 'jest';
import * as React from 'react';
import { CommitComparisonBox } from '../../components/CommitComparisonBox';

describe('CommitComparisonBox', () => {
  const trans = nullTranslator.load('jupyterlab_git');

  it('should request a diff between two Git refs', async () => {
    const model = {
      diff: jest.fn().mockResolvedValue({
        code: 0,
        result: [
          {
            deletions: '1',
            filename: 'src/index.ts',
            insertions: '2'
          }
        ]
      })
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
});
