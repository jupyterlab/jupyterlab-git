import { galata } from '@jupyterlab/galata';
import type { IJupyterLabPage } from '@jupyterlab/galata';
import type { APIRequestContext, Page } from '@playwright/test';

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

export async function waitForStableApplication(
  page: Page,
  helpers: IJupyterLabPage
): Promise<void> {
  await page.waitForSelector('#jupyterlab-splash', {
    state: 'detached'
  });

  const launcher = page.getByRole('main').getByRole('tab', {
    name: 'Launcher'
  });
  await launcher.waitFor();

  if (!(await helpers.isInSimpleMode())) {
    await launcher.click();
    await helpers.waitForCondition(async () => {
      try {
        return await launcher.evaluate(tab =>
          tab.classList.contains('jp-mod-current')
        );
      } catch {
        return false;
      }
    });
  }
}

export async function waitForStableApplicationFixture(
  {}: Record<string, never>,
  use: (waitForApplication: typeof waitForStableApplication) => Promise<void>
): Promise<void> {
  await use(waitForStableApplication);
}
