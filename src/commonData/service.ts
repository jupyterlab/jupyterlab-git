import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

const settings = ServerConnection.makeSettings();
const getSecretsList = () =>
  ServerConnection.makeRequest(
    URLExt.join(settings.baseUrl, '/secrets/list'),
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    },
    settings
  );

export const updateSecretsList = () => {
  return getSecretsList().then(res => res.json());
};
