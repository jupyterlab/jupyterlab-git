import { expect } from '@playwright/test';
import { test } from '@jupyterlab/galata';
import path from 'path';
import { extractFile } from './utils';

const baseRepositoryPath = 'test-repository-stash.tar.gz';
test.use({ autoGoto: false });

test.describe('Git Stash Stash Stash', () => {
  test.beforeEach(async ({ baseURL, page, tmpPath }) => {
    await extractFile(
      baseURL,
      path.resolve(__dirname, 'data', baseRepositoryPath),
      path.join(tmpPath, 'repository.tar.gz')
    );

    // Open Git panel
    await page.goto(`tree/${tmpPath}/test-repository`);
    await page.sidebar.openTab('jp-git-sessions');
    await page.getByRole('tab', { name: 'Changes' }).click();
    // Let stash list finish loading
    await page.waitForSelector(
      '[data-test-id="num-stashes"][data-loading="false"]'
    );
  });

  test('should show our current stash list', async ({ page }) => {
    const numberOfStashes = await page.getByText('(2)').nth(2);
    const stashButton = await page.getByRole('button', {
      name: 'Stash latest changes'
    });
    const vanilla = await page.locator('[data-test-id="num-stashes"]');

    await page.locator('div:nth-child(4) > .fkumj3x > .fp5mvxw').click();

    expect(stashButton).toBeTruthy();
    expect(numberOfStashes).toBeTruthy();
    await expect(await vanilla.innerText()).toBe('(3)');
  });

  test('clear the entire stash', async ({ page }) => {
    // Hover on the stash section, click 'stash clear', then check that text=Stash(0)
    const stashSection = await page.getByText('Stash(2)');

    await stashSection.hover();

    const clearStashBtn = await page.getByRole('button', {
      name: 'Clear the entire stash'
    });
    await clearStashBtn.click();

    const numberOfStashes = await page.locator('[data-test-id="num-stashes"]');

    await expect(await numberOfStashes.innerText()).toBe('(0)');
  });
});
