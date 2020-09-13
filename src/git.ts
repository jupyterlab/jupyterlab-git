import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { ReadonlyJSONObject } from '@lumino/coreutils';
import { Git } from './tokens';

/**
 * Array of Git Auth Error Messages
 */
export const AUTH_ERROR_MESSAGES = [
  'Invalid username or password',
  'could not read Username',
  'could not read Password'
];

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension; default ''
 * @param method HTML method; default 'GET'
 * @param body JSON object to be passed as body or null; default null
 * @param namespace API namespace; default 'git'
 * @returns The response body interpreted as JSON
 *
 * @throws {Git.GitResponseError} If the server response is not ok
 * @throws {ServerConnection.NetworkError} If the request cannot be made
 */
export async function requestAPI<T>(
  endPoint = '',
  method = 'GET',
  body: ReadonlyJSONObject | null = null,
  namespace = 'git'
): Promise<T> {
  // Make request to Jupyter API
  const settings = ServerConnection.makeSettings();
  const requestUrl = URLExt.join(
    settings.baseUrl,
    namespace, // API Namespace
    endPoint
  );

  const init: RequestInit = {
    method,
    body: body ? JSON.stringify(body) : undefined
  };

  let response: Response;
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error);
  }

  let data: any = await response.text();
  let isJSON = false;
  if (data.length > 0) {
    try {
      data = JSON.parse(data);
      isJSON = true;
    } catch (error) {
      console.log('Not a JSON response body.', response);
    }
  }

  if (!response.ok) {
    if (isJSON) {
      const { message, traceback, ...json } = data;
      throw new Git.GitResponseError(
        response,
        message ||
          `Invalid response: ${response.status} ${response.statusText}`,
        traceback || '',
        json
      );
    } else {
      throw new Git.GitResponseError(response, data);
    }
  }

  return data;
}
