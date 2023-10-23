import { galata } from '@jupyterlab/galata';
import { APIRequestContext } from '@playwright/test';

export async function extractFile(
  request: APIRequestContext,
  filePath: string,
  destination: string
): Promise<void> {
  const contents = galata.newContentsHelper(request);
  await contents.uploadFile(filePath, destination);

  await request.get(`/extract-archive/${destination}`);

  await contents.deleteFile(destination);
}
