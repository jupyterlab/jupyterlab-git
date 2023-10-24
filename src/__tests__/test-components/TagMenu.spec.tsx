import { nullTranslator } from '@jupyterlab/translation';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest';
import * as React from 'react';
import { ITagMenuProps, TagMenu } from '../../components/TagMenu';
import * as git from '../../git';
import { GitExtension } from '../../model';
import { IGitExtension } from '../../tokens';
import {
  DEFAULT_REPOSITORY_PATH,
  defaultMockedResponses,
  mockedRequestAPI
} from '../utils';

jest.mock('../../git');
jest.mock('@jupyterlab/apputils');

const TAGS = [
  {
    name: '1.0.0',
    baseCommitId: '4738782743'
  },
  {
    name: 'feature-1',
    baseCommitId: '7432743264'
  },
  {
    name: 'feature-2',
    baseCommitId: '798438398'
  },
  {
    name: 'patch-007',
    baseCommitId: '238848848'
  }
];

async function createModel() {
  const model = new GitExtension();
  model.pathRepository = DEFAULT_REPOSITORY_PATH;

  await model.ready;
  return model;
}

describe('TagMenu', () => {
  let model: GitExtension;
  const trans = nullTranslator.load('jupyterlab_git');

  beforeEach(async () => {
    jest.restoreAllMocks();

    const mock = git as jest.Mocked<typeof git>;
    mock.requestAPI.mockImplementation(
      mockedRequestAPI({
        responses: {
          ...defaultMockedResponses,
          'tags/delete': {
            body: () => {
              return { code: 0 };
            }
          },
          checkout: {
            body: () => {
              return {
                code: 0
              };
            }
          }
        }
      }) as any
    );

    model = await createModel();
  });

  function createProps(props?: Partial<ITagMenuProps>): ITagMenuProps {
    return {
      branching: false,
      pastCommits: [],
      model: model as IGitExtension,
      tagsList: TAGS,
      trans: trans,
      ...props
    };
  }

  describe('constructor', () => {
    it('should set the default menu filter to an empty string', () => {
      render(<TagMenu {...createProps()} />);
      expect(
        screen.getByRole('textbox', { name: 'Filter tag menu' })
      ).toHaveValue('');
    });
  });

  describe('render', () => {
    it('should display placeholder text for the menu filter', () => {
      render(<TagMenu {...createProps()} />);
      expect(
        screen.getByRole('textbox', { name: 'Filter tag menu' })
      ).toHaveAttribute('placeholder', 'Filter');
    });

    it('should set a `title` attribute on the input element to filter a tag menu', () => {
      render(<TagMenu {...createProps()} />);
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'title',
        'Filter tag menu'
      );
    });

    it('should display a button to clear the menu filter once a filter is provided', async () => {
      render(<TagMenu {...createProps()} />);
      await userEvent.type(screen.getByRole('textbox'), 'foo');
      expect(screen.getAllByTitle('Clear the current filter').length).toEqual(
        1
      );
    });

    it('should display a button to create a new tag', () => {
      render(<TagMenu {...createProps()} />);
      expect(screen.getByRole('button', { name: 'New Tag' })).toBeDefined();
    });

    it('should set a `title` attribute on the button to create a new tag', () => {
      render(<TagMenu {...createProps()} />);
      expect(screen.getByRole('button', { name: 'New Tag' })).toHaveAttribute(
        'title',
        'Create a new tag'
      );
    });

    it('should not, by default, show a dialog to create a new tag', () => {
      render(<TagMenu {...createProps()} />);

      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('should show a dialog to create a new tag when the flag indicating whether to show the dialog is `true`', async () => {
      render(<TagMenu {...createProps({ branching: true })} />);

      await userEvent.click(screen.getByRole('button', { name: 'New Tag' }));

      expect(screen.getByRole('dialog')).toBeDefined();
    });
  });

  describe('switch tag', () => {
    it('should not switch to a specified tag upon clicking its corresponding element when branching is disabled', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkoutTag');

      render(<TagMenu {...createProps()} />);

      await userEvent.click(screen.getByTitle(new RegExp(TAGS[1].name)));

      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });

    it('should switch to a specified tag upon clicking its corresponding element when branching is enabled', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'checkoutTag');

      render(<TagMenu {...createProps({ branching: true })} />);

      await userEvent.click(screen.getByTitle(new RegExp(TAGS[1].name)));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(TAGS[1].name);

      spy.mockRestore();
    });
  });

  describe('create tag', () => {
    it('should not allow creating a new tag when branching is disabled', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'setTag');

      render(<TagMenu {...createProps()} />);

      await userEvent.click(screen.getByRole('button', { name: 'New Tag' }));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });

    it('should display a dialog to create a new tag when branching is enabled and the new tag button is clicked', async () => {
      const spy = jest.spyOn(GitExtension.prototype, 'setTag');

      render(<TagMenu {...createProps({ branching: true })} />);

      await userEvent.click(screen.getByRole('button', { name: 'New Tag' }));

      expect(screen.getByRole('dialog')).toBeDefined();
      expect(spy).toHaveBeenCalledTimes(0);
      spy.mockRestore();
    });
  });
});
