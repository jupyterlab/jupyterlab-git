import { nullTranslator } from '@jupyterlab/translation';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest';
import * as React from 'react';
import {
  IManageRemoteDialogueProps,
  ManageRemoteDialogue
} from '../../components/ManageRemoteDialogue';
import * as git from '../../git';
import { GitExtension } from '../../model';
import {
  DEFAULT_REPOSITORY_PATH,
  defaultMockedResponses,
  mockedRequestAPI
} from '../utils';

jest.mock('../../git');
jest.mock('@jupyterlab/apputils');

const REMOTES = [
  {
    name: 'test',
    url: 'https://test.com'
  },
  {
    name: 'origin',
    url: 'https://origin.com'
  }
];

async function createModel() {
  const model = new GitExtension();
  model.pathRepository = DEFAULT_REPOSITORY_PATH;

  await model.ready;
  return model;
}

describe('ManageRemoteDialogue', () => {
  let model: GitExtension;
  const trans = nullTranslator.load('jupyterlab_git');

  beforeEach(async () => {
    jest.restoreAllMocks();

    const mock = git as jest.Mocked<typeof git>;
    mock.requestAPI.mockImplementation(
      mockedRequestAPI({
        responses: {
          ...defaultMockedResponses,
          'remote/add': {
            body: () => {
              return { code: 0 };
            }
          },
          'remote/show': {
            body: () => {
              return { code: 0, remotes: REMOTES };
            }
          }
        }
      }) as any
    );

    model = await createModel();
  });

  function createProps(
    props?: Partial<IManageRemoteDialogueProps>
  ): IManageRemoteDialogueProps {
    return {
      model: model,
      trans: trans,
      onClose: () => null,
      ...props
    };
  }

  describe('constructor', () => {
    it('should set the correct state after mounting', async () => {
      const spyGitGetRemotes = jest.spyOn(GitExtension.prototype, 'getRemotes');
      const spyComponentDidMount = jest.spyOn(
        ManageRemoteDialogue.prototype,
        'componentDidMount'
      );
      render(<ManageRemoteDialogue {...createProps()} />);
      expect(spyGitGetRemotes).toHaveBeenCalledTimes(1);
      expect(spyComponentDidMount).toHaveBeenCalledTimes(1);
    });
  });

  describe('render', () => {
    it('should display a title for the dialogue "Manage Remotes"', () => {
      render(<ManageRemoteDialogue {...createProps()} />);
      const node = screen.getByRole('dialog').querySelector('p');
      expect(node?.textContent).toEqual('Manage Remotes');
    });
    it('should display a button to close the dialogue', () => {
      render(<ManageRemoteDialogue {...createProps()} />);
      expect(screen.getAllByTitle('Close this dialog')).toHaveLength(1);
    });

    it('should display two input boxes for entering new remote name and url', () => {
      render(<ManageRemoteDialogue {...createProps()} />);
      const nameInput = screen.getByPlaceholderText('name');
      const urlInput = screen.getByPlaceholderText('Remote Git repository URL');
      expect(nameInput).toBeDefined();
      expect(urlInput).toBeDefined();
    });

    it('should display a button to add a new remote', () => {
      render(<ManageRemoteDialogue {...createProps()} />);

      expect(screen.getByRole('button', { name: 'Add' })).toBeDefined();
    });

    it('should display buttons to remove existing remotes', async () => {
      render(<ManageRemoteDialogue {...createProps()} />);
      await screen.findByText(REMOTES[0].name);
      expect(
        screen.getAllByRole('button', { name: 'Remove this remote' })
      ).toHaveLength(REMOTES.length);
    });
  });

  describe('functionality', () => {
    it('should add a new remote', async () => {
      render(<ManageRemoteDialogue {...createProps()} />);
      const newRemote = {
        name: 'newRemote',
        url: 'newremote.com'
      };

      await userEvent.type(screen.getByPlaceholderText('name'), newRemote.name);
      await userEvent.type(
        screen.getByPlaceholderText('Remote Git repository URL'),
        newRemote.url
      );

      const spyGitAddRemote = jest.spyOn(GitExtension.prototype, 'addRemote');

      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(spyGitAddRemote).toHaveBeenCalledTimes(1);
      expect(spyGitAddRemote).toHaveBeenCalledWith(
        newRemote.url,
        newRemote.name
      );
    });
  });
});
