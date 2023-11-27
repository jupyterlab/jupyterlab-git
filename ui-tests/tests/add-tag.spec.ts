import { expect, galata, test } from '@jupyterlab/galata';
import path from 'path';
import { extractFile } from './utils';

const baseRepositoryPath = 'test-repository-dirty.tar.gz';
test.use({ autoGoto: false, mockSettings: galata.DEFAULT_SETTINGS });

test.describe('Add tag', () => {
  test.beforeEach(async ({ page, request, tmpPath }) => {
    await extractFile(
      request,
      path.resolve(__dirname, 'data', baseRepositoryPath),
      path.join(tmpPath, 'repository.tar.gz')
    );

    // URL for merge conflict example repository
    await page.goto(`tree/${tmpPath}/test-repository`);

    await page.sidebar.openTab('jp-git-sessions');
  });

  test('should show Add Tag command on commit from history sidebar', async ({
    page
  }) => {
    await page.click('button:has-text("History")');

    const commits = page.locator('li[title="View commit details"]');

    expect(await commits.count()).toBeGreaterThanOrEqual(2);

    // Right click the first commit to open the context menu, with the add tag command
    await page.getByText('master changes').click({ button: 'right' });

    expect(await page.getByRole('menuitem', { name: 'Add Tag' })).toBeTruthy();
  });

  test('should open new tag dialog box', async ({ page }) => {
    await page.click('button:has-text("History")');

    const commits = page.locator('li[title="View commit details"]');

    expect(await commits.count()).toBeGreaterThanOrEqual(2);

    // Right click the first commit to open the context menu, with the add tag command
    await page.getByText('master changes').click({ button: 'right' });

    // Click on the add tag command
    await page.getByRole('menuitem', { name: 'Add Tag' }).click();

    expect(page.getByText('Create a Tag')).toBeTruthy();
  });

  test('should create new tag pointing to selected commit', async ({
    page
  }) => {
    await page.click('button:has-text("History")');

    const commits = page.locator('li[title="View commit details"]');
    expect(await commits.count()).toBeGreaterThanOrEqual(2);

    // Right click the first commit to open the context menu, with the add tag command
    await page.getByText('master changes').click({ button: 'right' });

    // Click on the add tag command
    await page.getByRole('menuitem', { name: 'Add Tag' }).click();

    // Create a test tag
    await page.getByRole('textbox').fill('testTag');
    await page.getByRole('button', { name: 'Create Tag' }).click();

    expect(await page.getByText('testTag')).toBeTruthy();
  });
});
