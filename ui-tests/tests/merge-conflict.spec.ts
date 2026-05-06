import { expect, galata, test } from '@jupyterlab/galata';
import path from 'path';
import { extractFile, waitForStableApplicationFixture } from './utils';

const baseRepositoryPath = 'test-repository.tar.gz';
test.use({
  autoGoto: false,
  mockSettings: galata.DEFAULT_SETTINGS,
  waitForApplication: waitForStableApplicationFixture
});

test.describe('Merge conflict tests', () => {
  test.beforeEach(async ({ page, request, tmpPath }) => {
    await extractFile(
      request,
      path.resolve(__dirname, 'data', baseRepositoryPath),
      path.join(tmpPath, 'repository.tar.gz')
    );

    // URL for merge conflict example repository
    await page.goto(`tree/${tmpPath}/test-repository`);

    await page.sidebar.openTab('jp-git-sessions');

    // Collapse Changes and History temporarily so Branches and Tags has
    // room for the branch list — otherwise the bottom of the list can be
    // obscured by the JupyterLab status bar.
    await page.getByRole('heading', { name: 'Changes' }).click();
    await page.getByRole('heading', { name: 'History' }).click();

    // Click on a-branch merge button
    await page.locator('text=a-branch').hover();
    await page
      .getByRole('button', {
        name: 'Merge this branch into the current one',
        exact: true
      })
      .click();

    // Re-expand Changes so the conflicted files are visible to the tests.
    await page.getByRole('heading', { name: 'Changes' }).click();

    // Force refresh
    await page
      .getByRole('button', {
        name: 'Refresh the repository to detect local and remote changes'
      })
      .click();
  });

  test('should diff conflicted text file', async ({ page }) => {
    await page
      .getByTitle('file.txt • Conflicted', { exact: true })
      .click({ clickCount: 2 });
    await page.waitForSelector(
      '.jp-git-diff-parent-widget[id^="Current-Incoming"] .jp-spinner',
      { state: 'detached' }
    );
    await page.waitForSelector('.jp-git-diff-root');

    // Verify 3-way merge view appears
    const banner = page.locator('.jp-git-merge-banner');
    await expect(banner).toHaveText(/Current/);
    await expect(banner).toHaveText(/Result/);
    await expect(banner).toHaveText(/Incoming/);

    const mergeDiff = page.locator('.cm-merge-3pane');
    await expect(mergeDiff).toBeVisible();
  });

  test('should diff conflicted notebook file', async ({ page }) => {
    await page.getByTitle('example.ipynb • Conflicted').click({
      clickCount: 2
    });
    await page.waitForSelector(
      '.jp-git-diff-parent-widget[id^="Current-Incoming"] .jp-spinner',
      { state: 'detached' }
    );
    await page.waitForSelector('.jp-git-diff-root');

    // Verify notebook merge view appears
    const banner = page.locator('.jp-git-merge-banner');
    await expect(banner).toHaveText(/Current/);
    await expect(banner).toHaveText(/Incoming/);

    const mergeDiff = page.locator('.jp-Notebook-merge');
    await expect(mergeDiff).toBeVisible();
  });
});
