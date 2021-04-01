import { testEmission } from '@jupyterlab/testutils';
import 'jest';
import { DiffModel } from '../../src/components/diff/model';

describe('DiffModel', () => {
  it('should emit a signal if reference changes', async () => {
    const model = new DiffModel({
      challenger: {
        content: () => Promise.resolve('content'),
        label: 'challenger',
        source: 'challenger'
      },
      filename: 'dummy.txt',
      reference: {
        content: () => Promise.resolve('content'),
        label: 'reference',
        source: 'reference'
      }
    });

    const testChangedSignal = testEmission(model.changed, {
      test: (model, change) => {
        expect(change.type).toEqual('reference');
      }
    });

    model.reference = {
      content: () => Promise.resolve('content2'),
      label: 'reference2',
      source: 'reference2'
    };
    await testChangedSignal;
  });
  it('should emit a signal if challenger changes', async () => {
    const model = new DiffModel({
      challenger: {
        content: () => Promise.resolve('content'),
        label: 'challenger',
        source: 'challenger'
      },
      filename: 'dummy.txt',
      reference: {
        content: () => Promise.resolve('content'),
        label: 'reference',
        source: 'reference'
      }
    });

    const testChangedSignal = testEmission(model.changed, {
      test: (model, change) => {
        expect(change.type).toEqual('challenger');
      }
    });

    model.challenger = {
      content: () => Promise.resolve('content2'),
      label: 'challenger2',
      source: 'challenger2'
    };
    await testChangedSignal;
  });
});
