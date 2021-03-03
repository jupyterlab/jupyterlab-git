import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { Git } from './tokens';
import { requestAPI } from './git';
import { version } from './version';
import { TranslationBundle } from '@jupyterlab/translation';

/**
 * Obtain the server settings or provide meaningful error message for the end user
 *
 * @returns The server settings
 *
 * @throws {ServerConnection.ResponseError} If the response was not ok
 * @throws {ServerConnection.NetworkError} If the request failed to reach the server
 */
export async function getServerSettings(
  trans: TranslationBundle
): Promise<Git.IServerSettings> {
  try {
    const endpoint = 'settings' + URLExt.objectToQueryString({ version });
    const settings = await requestAPI<Git.IServerSettings>(endpoint, 'GET');
    return settings;
  } catch (error) {
    if (error instanceof Git.GitResponseError) {
      const response = error.response;
      if (response.status === 404) {
        const message = trans.__(
          'Git server extension is unavailable. Please ensure you have installed the ' +
            'JupyterLab Git server extension by running: pip install --upgrade jupyterlab-git. ' +
            'To confirm that the server extension is installed, run: jupyter server extension list.'
        );
        throw new ServerConnection.ResponseError(response, message);
      } else {
        const message = error.message;
        console.error('Failed to get the server extension settings', message);
        throw new ServerConnection.ResponseError(response, message);
      }
    } else {
      throw error;
    }
  }
}
