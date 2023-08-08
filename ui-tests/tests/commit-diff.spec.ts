import { expect, test } from '@jupyterlab/galata';
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
    await page.goto(`tree/${tmpPath}/test-repository`);
  });

  test('should display commits diff from history', async ({ page }) => {
    await page.sidebar.openTab('jp-git-sessions');
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

  test('should display diff from single file history', async ({ page }) => {
    await page.sidebar.openTab('filebrowser');
    await page.click('#filebrowser >> text=example.ipynb', {
      button: 'right'
    });
    await page.hover('ul[role="menu"] >> text=Git');
    await page.click('#jp-contextmenu-git >> text=History');

    await page.waitForSelector('#jp-git-sessions >> ol >> text=example.ipynb');

    const commits = page.locator('li[title="View file changes"]');

    expect(await commits.count()).toBeGreaterThanOrEqual(2);

    await commits.last().locator('button[title="Select for compare"]').click();
    await commits
      .first()
      .locator('button[title="Compare with selected"]')
      .click();

    await expect(
      page.locator('.nbdime-Widget >> .jp-git-diff-banner')
    ).toHaveText(
      /79fe96219f6eaec1ae607c7c8d21d5b269a6dd29[\n\s]+51fe1f8995113884e943201341a5d5b7a1393e24/
    );
  });
});
