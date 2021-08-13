import 'jest';
import * as git from '../src/git';
import plugin from '../src/index';
import { version } from '../src/version';
import { ISettingRegistry, SettingRegistry } from '@jupyterlab/settingregistry';
import { JupyterLab } from '@jupyterlab/application';
import { showErrorMessage } from '@jupyterlab/apputils';
import { URLExt } from '@jupyterlab/coreutils';
import {
  defaultMockedResponses,
  IMockedResponses,
  mockedRequestAPI
} from './utils';

jest.mock('../src/git');
jest.mock('@jupyterlab/application');
jest.mock('@jupyterlab/apputils');
jest.mock('@jupyterlab/settingregistry');

describe('plugin', () => {
  const mockGit = git as jest.Mocked<typeof git>;
  let app: jest.Mocked<JupyterLab>;
  let mockResponses: IMockedResponses = {};
  let settingRegistry: jest.Mocked<ISettingRegistry>;

  beforeAll(() => {
    app = new JupyterLab() as jest.Mocked<JupyterLab>;
    settingRegistry = new SettingRegistry({
      connector: null
    }) as jest.Mocked<SettingRegistry>;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockResponses = { responses: { ...defaultMockedResponses } };
    mockGit.requestAPI.mockImplementation(mockedRequestAPI(mockResponses));
  });

  describe('#activate', () => {
    it('should fail if no git is installed', async () => {
      // Given
      const endpoint = 'settings' + URLExt.objectToQueryString({ version });
      mockResponses.responses[endpoint] = {
        body: request => {
          return {
            gitVersion: null,
            frontendVersion: version,
            serverVersion: version
          };
        }
      };
      const mockedErrorMessage = showErrorMessage as jest.MockedFunction<
        typeof showErrorMessage
      >;

      // When
      const extension = await plugin.activate(
        app,
        null,
        null,
        { tracker: { currentWidget: null } },
        null,
        settingRegistry
      );

      // Then
      expect(extension).toBeNull(); // Token is null
      expect(mockedErrorMessage).toHaveBeenCalledWith(
        'Failed to load the jupyterlab-git server extension',
        'git command not found - please ensure you have Git > 2 installed',
        [undefined] // The warning button is undefined as the module @jupyterlab/apputils is mocked
      );
    });

    it('should fail if git version is < 2', async () => {
      // Given
      const endpoint = 'settings' + URLExt.objectToQueryString({ version });
      mockResponses.responses[endpoint] = {
        body: request => {
          return {
            gitVersion: '1.8.7',
            frontendVersion: version,
            serverVersion: version
          };
        }
      };
      const mockedErrorMessage = showErrorMessage as jest.MockedFunction<
        typeof showErrorMessage
      >;

      // When
      const extension = await plugin.activate(
        app,
        null,
        null,
        { tracker: { currentWidget: null } },
        null,
        settingRegistry
      );

      // Then
      expect(extension).toBeNull(); // Token is null
      expect(mockedErrorMessage).toHaveBeenCalledWith(
        'Failed to load the jupyterlab-git server extension',
        'git command version must be > 2; got 1.8.7.',
        [undefined] // The warning button is undefined as the module @jupyterlab/apputils is mocked
      );
    });
    it('should fail if server and extension version do not match', async () => {
      // Given
      const endpoint = 'settings' + URLExt.objectToQueryString({ version });
      mockResponses.responses[endpoint] = {
        body: request => {
          return {
            gitVersion: '2.22.0',
            frontendVersion: version,
            serverVersion: '0.1.0'
          };
        }
      };
      const mockedErrorMessage = showErrorMessage as jest.MockedFunction<
        typeof showErrorMessage
      >;

      // When
      const extension = await plugin.activate(
        app,
        null,
        null,
        { tracker: { currentWidget: null } },
        null,
        settingRegistry
      );

      // Then
      expect(extension).toBeNull(); // Token is null
      expect(mockedErrorMessage).toHaveBeenCalledWith(
        'Failed to load the jupyterlab-git server extension',
        'The versions of the JupyterLab Git server frontend and backend do not match. ' +
          `The @jupyterlab/git frontend extension has version: ${version} ` +
          'while the python package has version 0.1.0. ' +
          'Please install identical version of jupyterlab-git Python package and the @jupyterlab/git extension. Try running: pip install --upgrade jupyterlab-git',
        [undefined] // The warning button is undefined as the module @jupyterlab/apputils is mocked
      );
    });
    it('should fail if the server extension is not installed', async () => {
      // Given
      const endpoint = 'settings' + URLExt.objectToQueryString({ version });
      mockResponses.responses[endpoint] = {
        status: 404
      };
      const mockedErrorMessage = showErrorMessage as jest.MockedFunction<
        typeof showErrorMessage
      >;

      // When
      const extension = await plugin.activate(
        app,
        null,
        null,
        { tracker: { currentWidget: null } },
        null,
        settingRegistry
      );

      // Then
      expect(extension).toBeNull(); // Token is null
      expect(mockedErrorMessage).toHaveBeenCalledWith(
        'Failed to load the jupyterlab-git server extension',
        'Git server extension is unavailable. Please ensure you have installed the ' +
          'JupyterLab Git server extension by running: pip install --upgrade jupyterlab-git. ' +
          'To confirm that the server extension is installed, run: jupyter server extension list.',
        [undefined] // The warning button is undefined as the module @jupyterlab/apputils is mocked
      );
    });
  });
});
