import { shallow } from 'enzyme';
import 'jest';
import * as React from 'react';
import { ActionButton } from '../../components/ActionButton';
import {
  ManageRemoteDialogue,
  IManageRemoteDialogueProps,
  IManageRemoteDialogueState
} from '../../components/ManageRemoteDialogue';
import * as git from '../../git';
import { GitExtension } from '../../model';
import { createButtonClass } from '../../style/NewBranchDialog';
import {
  mockedRequestAPI,
  defaultMockedResponses,
  DEFAULT_REPOSITORY_PATH
} from '../utils';
import ClearIcon from '@material-ui/icons/Clear';
import { nullTranslator } from '@jupyterlab/translation';

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
      })
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
    it('should return a new instance with initial state', () => {
      const remoteDialogue = shallow(
        <ManageRemoteDialogue {...createProps()} />
      );
      expect(remoteDialogue.instance()).toBeInstanceOf(ManageRemoteDialogue);
      const initialState: IManageRemoteDialogueState = {
        newRemote: {
          name: '',
          url: ''
        },
        existingRemotes: null
      };
      expect(remoteDialogue.state()).toEqual(initialState);
    });

    it('should set the correct state after mounting', async () => {
      const spyGitGetRemotes = jest.spyOn(GitExtension.prototype, 'getRemotes');
      const spyComponentDidMount = jest.spyOn(
        ManageRemoteDialogue.prototype,
        'componentDidMount'
      );
      const remoteDialogue = shallow(
        <ManageRemoteDialogue {...createProps()} />
      );
      await remoteDialogue.instance().componentDidMount();
      expect(remoteDialogue.state()).toEqual({
        newRemote: {
          name: '',
          url: ''
        },
        existingRemotes: REMOTES
      });
      expect(spyGitGetRemotes).toHaveBeenCalledTimes(2);
      expect(spyComponentDidMount).toHaveBeenCalledTimes(2);
    });
  });

  describe('render', () => {
    it('should display a title for the dialogue "Manage Remotes"', () => {
      const remoteDialogue = shallow(
        <ManageRemoteDialogue {...createProps()} />
      );
      const node = remoteDialogue.find('p').first();
      expect(node.text()).toEqual('Manage Remotes');
    });
    it('should display a button to close the dialogue', () => {
      const remoteDialogue = shallow(
        <ManageRemoteDialogue {...createProps()} />
      );
      const nodes = remoteDialogue.find(ClearIcon);
      expect(nodes.length).toEqual(1);
    });

    it('should display two input boxes for entering new remote name and url', () => {
      const remoteDialogue = shallow(
        <ManageRemoteDialogue {...createProps()} />
      );
      const nameInput = remoteDialogue.find('input[placeholder="name"]');
      const urlInput = remoteDialogue.find(
        'input[placeholder="Remote Git repository URL"]'
      );
      expect(nameInput.length).toEqual(1);
      expect(urlInput.length).toEqual(1);
    });

    it('should display a button to add a new remote', () => {
      const remoteDialogue = shallow(
        <ManageRemoteDialogue {...createProps()} />
      );
      const node = remoteDialogue.find(`.${createButtonClass}`).first();
      expect(node.prop('value')).toEqual('Add');
    });

    it('should display buttons to remove existing remotes', async () => {
      const remoteDialogue = shallow(
        <ManageRemoteDialogue {...createProps()} />
      );
      await remoteDialogue.instance().componentDidMount();
      const nodes = remoteDialogue.find(ActionButton);
      expect(nodes.length).toEqual(REMOTES.length);
    });
  });

  describe('functionality', () => {
    it('should add a new remote', async () => {
      const remoteDialogue = shallow(
        <ManageRemoteDialogue {...createProps()} />
      );
      const newRemote = {
        name: 'newRemote',
        url: 'newremote.com'
      };
      await remoteDialogue.setState({
        newRemote
      });

      const spyGitAddRemote = jest.spyOn(GitExtension.prototype, 'addRemote');
      const addRemoteButton = remoteDialogue
        .find(`.${createButtonClass}`)
        .first();
      addRemoteButton.simulate('click');

      expect(spyGitAddRemote).toHaveBeenCalledTimes(1);
      expect(spyGitAddRemote).toHaveBeenCalledWith(
        newRemote.url,
        newRemote.name
      );
    });
  });
});
