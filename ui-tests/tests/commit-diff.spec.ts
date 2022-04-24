import { test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';
import path from 'path';
import { extractFile } from './utils';

const baseRepositoryPath = 'test-repository.tar.gz';
test.use({ autoGoto: false });

test.describe('Commits diff', () => {
  test.beforeEach(async ({ baseURL, page, tmpPath }) => {
    await extractFile(
      baseURL,
      path.resolve(__dirname, 'data', baseRepositoryPath),
      path.join(tmpPath, 'repository.tar.gz')
    );

    // URL for merge conflict example repository
    await page.goto(`tree/${tmpPath}/repository`);

    await page.sidebar.openTab('jp-git-sessions');
  });

  test('should display commits diff from history', async ({ page }) => {
    await page.click('button:has-text("History")');
    const commits = page.locator('li[title="View commit details"]');

    expect(await commits.count()).toBeGreaterThanOrEqual(2);

    await commits.last().locator('button[title="Select for compare"]').click();

    expect(
      await page.waitForSelector('text=No challenger commit selected.')
    ).toBeTruthy();
    await commits
      .first()
      .locator('button[title="Compare with selected"]')
      .click();

    expect(await page.waitForSelector('text=Changed')).toBeTruthy();
  });
});
