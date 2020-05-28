import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { Git } from './tokens';
import { httpGitRequest } from './git';
import { version } from './version';

export async function getServerSettings(): Promise<Git.IServerSettings> {
  try {
    const endpoint = '/git/settings' + URLExt.objectToQueryString({ version });
    const response = await httpGitRequest(endpoint, 'GET', null);
    if (response.status === 404) {
      const message =
        'Git server extension is unavailable. Please ensure you have installed the ' +
        'JupyterLab Git server extension by running: pip install --upgrade jupyterlab-git. ' +
        'To confirm that the server extension is installed, run: jupyter serverextension list.';
      throw new ServerConnection.ResponseError(response, message);
    }
    let content: string | any = await response.text();
    if (content.length > 0) {
      content = JSON.parse(content);
    }
    if (!response.ok) {
      const message = content.message || content;
      console.error('Fail to get the server extension settings', message);
      throw new ServerConnection.ResponseError(response, message);
    }
    return content as Git.IServerSettings;
  } catch (error) {
    if (error instanceof ServerConnection.ResponseError) {
      throw error;
    } else {
      throw new Error(error);
    }
  }
}
