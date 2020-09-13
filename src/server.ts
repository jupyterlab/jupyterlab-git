import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { Git } from './tokens';
import { requestAPI } from './git';
import { version } from './version';

/**
 * Obtain the server settings or provide meaningful error message for the end user
 *
 * @returns The server settings
 *
 * @throws {ServerConnection.ResponseError} If the response was not ok
 * @throws {ServerConnection.NetworkError} If the request failed to reach the server
 */
export async function getServerSettings(): Promise<Git.IServerSettings> {
  try {
    const endpoint = 'settings' + URLExt.objectToQueryString({ version });
    const settings = await requestAPI<Git.IServerSettings>(endpoint, 'GET');
    return settings;
  } catch (error) {
    if (error instanceof Git.GitResponseError) {
      const response = error.response;
      if (response.status === 404) {
        const message =
          'Git server extension is unavailable. Please ensure you have installed the ' +
          'JupyterLab Git server extension by running: pip install --upgrade jupyterlab-git. ' +
          'To confirm that the server extension is installed, run: jupyter serverextension list.';
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
