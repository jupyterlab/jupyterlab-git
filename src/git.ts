import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

/**
 * Array of Git Auth Error Messages
 */
export const AUTH_ERROR_MESSAGES = [
  'Invalid username or password',
  'could not read Username',
  'could not read Password'
];

/** Makes a HTTP request, sending a git command to the backend */
export function httpGitRequest(
  url: string,
  method: string,
  request: Record<string, any> | null
): Promise<Response> {
  let fullRequest: RequestInit;
  if (request === null) {
    fullRequest = {
      method: method
    };
  } else {
    fullRequest = {
      method: method,
      body: JSON.stringify(request)
    };
  }

  const setting = ServerConnection.makeSettings();
  const fullUrl = URLExt.join(setting.baseUrl, url);
  return ServerConnection.makeRequest(fullUrl, fullRequest, setting);
}
