import { testEmission } from '@jupyterlab/testutils';
import 'jest';
import { DiffModel } from '../../src/components/diff/model';
import { Git } from '../../src/tokens';

describe('DiffModel', () => {
  let model: DiffModel;

  /**
   * Helper to test changed signal.
   */
  const testChangedSignal = (type: Git.Diff.IModelChange['type']) =>
    testEmission(model.changed, {
      test: (_, change) => {
        expect(change.type).toEqual(type);
      }
    });

  beforeEach(() => {
    model = new DiffModel({
      filename: 'KrabbyPattySecretFormula.txt',
      repositoryPath: '/',
      challenger: {
        content: () => Promise.resolve('content'),
        label: 'challenger',
        source: 'challenger'
      },
      reference: {
        content: () => Promise.resolve('content'),
        label: 'reference',
        source: 'reference'
      }
    });
  });

  it('should emit a signal if reference changes', async () => {
    const testReference = testChangedSignal('reference');

    model.reference = {
      content: () => Promise.resolve('content2'),
      label: 'reference2',
      source: 'reference2'
    };

    await testReference;
  });

  it('should emit a signal if challenger changes', async () => {
    const testChallenger = testChangedSignal('challenger');

    model.challenger = {
      content: () => Promise.resolve('content2'),
      label: 'challenger2',
      source: 'challenger2'
    };

    await testChallenger;
  });
});
