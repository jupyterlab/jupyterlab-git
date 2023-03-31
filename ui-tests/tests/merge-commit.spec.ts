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
    const mergeCommit = page.locator(
      '#8d6c5d068c9bb63ba67712d61ae7be49eae9d887'
    );

    await mergeCommit.click();

    const filesChanged = mergeCommit.locator("span[title='# Files Changed']");
    const insertions = mergeCommit.locator("span[title='# Insertions']");
    const deletions = mergeCommit.locator("span[title='# Deletions']");

    filesChanged.waitFor();

    await expect(filesChanged.innerText()).toBe('3');
    await expect(insertions.innerText()).toBe('18240');
    await expect(deletions.innerText()).toBe('18239');
  });

  test('should correctly display files changed', async ({ page }) => {
    const mergeCommit = page.locator(
      '#8d6c5d068c9bb63ba67712d61ae7be49eae9d887'
    );

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
    const mergeCommit = page.locator(
      '#8d6c5d068c9bb63ba67712d61ae7be49eae9d887'
    );

    await mergeCommit.click();

    const file = page.getByRole('listitem', { name: 'hello-world.py' });
    await file.click();

    await page
      .getByRole('tab', { name: 'hello-world.py' })
      .waitFor({ state: 'visible' });

    expect(page.waitForSelector('.jp-git-diff-root')).toBeTruthy();
  });

  test('should revert merge commit', async ({ page }) => {
    const mergeCommit = page.locator(
      '#8d6c5d068c9bb63ba67712d61ae7be49eae9d887'
    );

    await mergeCommit.click();
    await page
      .getByRole('button', { name: 'Revert changes introduced by this commit' })
      .click();

    const dialog = page.getByRole('dialog');
    dialog.waitFor({ state: 'visible' });

    expect(dialog).toBeTruthy();

    await dialog.getByRole('button', { name: 'Submit' }).click();
    dialog.waitFor({ state: 'detached' });

    const revertMergeCommit = page
      .locator('#jp-git-sessions')
      .locator("div:contains('Revert 'Merge branch 'sort-names''')");

    await revertMergeCommit.waitFor({ state: 'visible' });

    expect(revertMergeCommit).toBeTruthy();
  });
});
