import { expect, galata, test } from '@jupyterlab/galata';
import path from 'path';
import { extractFile } from './utils';

const baseRepositoryPath = 'test-repository.tar.gz';
test.use({ autoGoto: false, mockSettings: galata.DEFAULT_SETTINGS });

test.describe('Rebase', () => {
  test.beforeEach(async ({ baseURL, page, tmpPath }) => {
    await extractFile(
      baseURL,
      path.resolve(__dirname, 'data', baseRepositoryPath),
      path.join(tmpPath, 'repository.tar.gz')
    );

    // URL for merge conflict example repository
    await page.goto(`tree/${tmpPath}/test-repository`);

    await page.sidebar.openTab('jp-git-sessions');

    await page.getByRole('button', { name: 'Current Branch master' }).click();

    // Switch to a-branch
    await page.getByRole('button', { name: 'a-branch' }).click();

    // Hide branch panel
    await page.getByRole('button', { name: 'Current Branch a-branch' }).click();

    // Rebase on master
    await page.getByRole('main').press('Control+Shift+C');
    await page.getByRole('textbox', { name: 'SEARCH' }).fill('rebase');
    await page.getByText('Rebase branch…').click();
    await page.getByRole('button', { name: 'master' }).click();
    await page.getByRole('button', { name: 'Rebase' }).click();

    // Force refresh
    await page
      .getByRole('button', {
        name: 'Refresh the repository to detect local and remote changes'
      })
      .click();
  });

  test('should resolve a conflicted rebase', async ({ page }) => {
    // Resolve conflicts
    await page.getByTitle('file.txt • Conflicted', { exact: true }).dblclick();
    await page.waitForSelector(
      '.jp-git-diff-parent-widget[id^="Current-Incoming"] .jp-spinner',
      { state: 'detached' }
    );
    await page.waitForSelector('.jp-git-diff-root');

    // Verify 3-way merge view appears
    const banner = page.locator('.jp-git-merge-banner');
    await expect.soft(banner).toHaveText(/Current/);
    await expect.soft(banner).toHaveText(/Result/);
    await expect.soft(banner).toHaveText(/Incoming/);

    await page.getByRole('button', { name: 'Mark as resolved' }).click();

    await page
      .getByTitle('another_file.txt • Conflicted', { exact: true })
      .dblclick();

    await page.getByRole('button', { name: 'Mark as resolved' }).click();

    await page.getByTitle('example.ipynb • Conflicted').click({
      clickCount: 2
    });
    await page.waitForSelector(
      '.jp-git-diff-parent-widget[id^="Current-Incoming"] .jp-spinner',
      { state: 'detached' }
    );
    await page.waitForSelector('.jp-git-diff-root');

    // Verify notebook merge view appears
    await expect.soft(banner).toHaveText(/Current/);
    await expect.soft(banner).toHaveText(/Incoming/);

    await page.getByRole('button', { name: 'Mark as resolved' }).click();

    // Continue rebase as all conflicts are resolved
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByRole('tab', { name: 'History' }).click();

    // Master changes must be part of the history following the rebase
    await expect.soft(page.getByTitle('View commit details')).toHaveCount(3);
    await expect(page.getByText('master changes')).toBeVisible();
  });

  test('should abort a rebase', async ({ page }) => {
    await page.getByTitle('Pick another rebase action.').click();

    await page.getByRole('menuitem', { name: 'Abort' }).click();

    await page.getByRole('button', { name: 'Abort' }).click();

    await page.getByRole('tab', { name: 'History' }).click();

    // Master changes must not be part of the history following the abort
    await expect.soft(page.getByTitle('View commit details')).toHaveCount(2);
    await expect(page.getByText('a-branch changes')).toBeVisible();
  });

  test('should skip the current commit', async ({ page }) => {
    await page.getByTitle('Pick another rebase action.').click();

    await page.getByRole('menuitem', { name: 'Skip' }).click();

    await page.getByRole('tab', { name: 'History' }).click();

    // Master changes must be part of the history following the rebase but not
    // the old a-branch commit.
    await expect(page.getByTitle('View commit details')).toHaveCount(2);
    await expect(page.getByText('master changes')).toBeVisible();
  });
});
