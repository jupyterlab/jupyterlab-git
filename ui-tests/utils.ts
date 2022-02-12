import { galata } from '@jupyterlab/galata';
import fetch from 'node-fetch';
import path from 'path';

export async function extractFile(
  baseURL: string,
  filePath: string,
  destination: string
): Promise<void> {
  const contents = galata.newContentsHelper(baseURL);
  await contents.uploadFile(filePath, destination);

  await fetch(`${contents.baseURL}/extract-archive/${destination}`, {
    method: 'GET'
  });

  const directory = path.dirname(destination);

  await contents.renameDirectory(
    [directory, path.basename(filePath, '.tar.gz')].join('/'),
    [directory, path.basename(destination, '.tar.gz')].join('/')
  );

  await contents.deleteFile(destination);
}
