import { expect, test } from '@jupyterlab/galata';
import path from 'path';
import { extractFile } from './utils';

const baseRepositoryPath = 'test-repository-dirty.tar.gz';
test.use({ autoGoto: false });

test.describe('File selection for normal staging', () => {
  test.beforeEach(async ({ baseURL, page, tmpPath }) => {
    await extractFile(
      baseURL,
      path.resolve(__dirname, 'data', baseRepositoryPath),
      path.join(tmpPath, 'repository.tar.gz')
    );

    // URL for merge conflict example repository
    await page.goto(`tree/${tmpPath}/test-repository`);
  });

  test('should select two files with ctlr-click', async ({ page }) => {
    await page.sidebar.openTab('jp-git-sessions');
    await page.click('button:has-text("Changes")');

    // Click another_file.txt
    await page.locator('#jp-git-sessions >> text=another_file.txt').click();
    // Control-click master_file.ts
    await page.locator('#jp-git-sessions >> text=master_file.ts').click({
      modifiers: ['Control', 'Meta']
    });

    const selectedFileCount = await page
      .locator('[data-test-selected=true]')
      .count();
    expect(selectedFileCount).toEqual(2);
  });

  test('should select four files with shift-click', async ({ page }) => {
    await page.sidebar.openTab('jp-git-sessions');
    await page.click('button:has-text("Changes")');

    // Click another_file.txt
    await page.locator('#jp-git-sessions >> text=another_file.txt').click();
    // Shift-click master_file.ts
    await page.locator('#jp-git-sessions >> text=master_file.ts').click({
      modifiers: ['Shift']
    });

    const selectedFiles = page.locator('[data-test-selected=true]');
    expect(await selectedFiles.count()).toBeGreaterThanOrEqual(4);
  });
});

test.describe('File selection for simple staging', () => {
  test.beforeEach(async ({ baseURL, page, tmpPath }) => {
    await extractFile(
      baseURL,
      path.resolve(__dirname, 'data', baseRepositoryPath),
      path.join(tmpPath, 'repository.tar.gz')
    );

    // URL for merge conflict example repository
    await page.goto(`tree/${tmpPath}/test-repository`);

    // Click [aria-label="main"] >> text=Git
    await page.locator('[aria-label="main"] >> text=Git').click();
    // Click text=Simple staging
    await page.getByRole('menuitem', { name: 'Simple staging' }).click();
  });

  test('should mark four files with shift-click', async ({ page }) => {
    await page.sidebar.openTab('jp-git-sessions');
    await page.click('button:has-text("Changes")');

    // Click another_file.txt
    await page.locator('#jp-git-sessions >> text=another_file.txt').click();
    // Shift-click master_file.ts
    await page.locator('#jp-git-sessions >> text=master_file.ts').click({
      modifiers: ['Shift']
    });

    const markedFiles = page.locator('[data-test-checked=true]');
    expect(await markedFiles.count()).toBeGreaterThanOrEqual(4);
  });

  test('should unmark all files by clicking de/select all button', async ({
    page
  }) => {
    await page.sidebar.openTab('jp-git-sessions');
    await page.click('button:has-text("Changes")');

    await page.getByText('(4)').waitFor();

    let markedFiles = page.locator('[data-test-checked=true]');
    expect(await markedFiles.count()).toBeGreaterThanOrEqual(4);

    await page.locator('[data-test-id=SelectAllButton]').click();

    markedFiles = page.locator('[data-test-checked=true]');
    expect(await markedFiles.count()).toBeLessThanOrEqual(0);
  });
});
