import { test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';
import path from 'path';
import { extractFile } from './utils';

const baseRepositoryPath = 'test-repository-merge-commits.tar.gz';
test.use({ autoGoto: false });

test.describe('Merge commit tests', () => {
  test.beforeEach(async ({ baseURL, page, tmpPath }) => {
    await extractFile(
      baseURL,
      path.resolve(__dirname, 'data', baseRepositoryPath),
      path.join(tmpPath, 'repository.tar.gz')
    );

    // URL for merge commit example repository
    await page.goto(`tree/${tmpPath}/repository`);

    await page.sidebar.openTab('jp-git-sessions');

    await page.getByRole('tab', { name: 'History' }).click();
  });

  test('should correctly display num files changed, insertions, and deletions', async ({
    page
  }) => {
    const mergeCommit = await page.getByText("Merge branch 'sort-names'");

    await mergeCommit.click();

    const filesChanged = await mergeCommit.getByTitle('# Files Changed');
    const insertions = await mergeCommit.getByTitle('# Insertions');
    const deletions = await mergeCommit.getByTitle('# Deletions');

    await filesChanged.waitFor();

    await expect(await filesChanged.innerText()).toBe('3');
    await expect(await insertions.innerText()).toBe('18240');
    await expect(await deletions.innerText()).toBe('18239');
  });

  test('should correctly display files changed', async ({ page }) => {
    const mergeCommit = await page.getByText("Merge branch 'sort-names'");

    await mergeCommit.click();

    const helloWorldFile = page.getByRole('listitem', {
      name: 'hello-world.py'
    });
    const namesFile = page.getByRole('listitem', { name: 'names.txt' });
    const newFile = page.getByRole('listitem', { name: 'new-file.txt' });

    expect(helloWorldFile).toBeTruthy();
    expect(namesFile).toBeTruthy();
    expect(newFile).toBeTruthy();
  });

  test('should diff file after clicking', async ({ page }) => {
    const mergeCommit = await page.getByText("Merge branch 'sort-names'");

    await mergeCommit.click();

    const file = page.getByRole('listitem', { name: 'hello-world.py' });
    await file.click();

    await page
      .getByRole('tab', { name: 'hello-world.py' })
      .waitFor({ state: 'visible' });

    expect(page.waitForSelector('.jp-git-diff-root')).toBeTruthy();
  });

  test('should revert merge commit', async ({ page }) => {
    const mergeCommit = await page.getByText("Merge branch 'sort-names'");

    await mergeCommit.click();
    await page
      .getByRole('button', { name: 'Revert changes introduced by this commit' })
      .click();

    const dialog = await page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });

    await expect(dialog).toBeTruthy();

    await dialog.getByRole('button', { name: 'Submit' }).click();
    await dialog.waitFor({ state: 'detached' });

    const revertMergeCommit = await page
      .locator('#jp-git-sessions')
      .getByText("Revert 'Merge branch 'sort-names''");

    await revertMergeCommit.waitFor({ state: 'visible' });

    expect(revertMergeCommit).toBeTruthy();
  });
});
