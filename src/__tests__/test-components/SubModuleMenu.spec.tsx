import { nullTranslator } from '@jupyterlab/translation';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import 'jest';
import * as React from 'react';
import {
  ISubModuleMenuProps,
  SubModuleMenu
} from '../../components/SubModuleMenu';
import { GitExtension } from '../../model';
import { IGitExtension } from '../../tokens';
import { DEFAULT_REPOSITORY_PATH } from '../utils';

jest.mock('../../git');
jest.mock('@jupyterlab/apputils');

const SUBMODULES = [
  {
    name: 'cli/bench'
  },
  {
    name: 'test/util'
  }
];

async function createModel() {
  const model = new GitExtension();
  model.pathRepository = DEFAULT_REPOSITORY_PATH;

  await model.ready;
  return model;
}

describe('SubModuleMenu', () => {
  let model: GitExtension;
  const trans = nullTranslator.load('jupyterlab_git');

  beforeEach(async () => {
    jest.restoreAllMocks();

    model = await createModel();
  });

  function createProps(
    props?: Partial<ISubModuleMenuProps>
  ): ISubModuleMenuProps {
    return {
      model: model as IGitExtension,
      trans: trans,
      subModules: SUBMODULES,
      ...props
    };
  }

  describe('render', () => {
    it('should display a list of submodules', () => {
      render(<SubModuleMenu {...createProps()} />);

      const submodules = SUBMODULES;
      expect(screen.getAllByRole('listitem').length).toEqual(submodules.length);

      // Should contain the submodule names...
      for (let i = 0; i < submodules.length; i++) {
        expect(
          screen.getByText(submodules[i].name, { exact: true })
        ).toBeDefined();
      }
    });
  });
});
