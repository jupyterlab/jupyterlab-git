import { test, expect, Locator } from '@playwright/test';

const TARGET_URL = process.env.TARGET_URL ?? 'http://localhost:8888';

test.describe('Merge conflict tests', () => {
  test.beforeEach(async ({ page }) => {
    // URL for merge conflict example repository
    await page.goto(`${TARGET_URL}/lab/tree/merge-conflict-example`);

    await page.waitForSelector('#jupyterlab-splash', { state: 'detached' });
    await page.waitForSelector('div[role="main"] >> text=Launcher');

    const gitTabBar = await page.waitForSelector(
      '.lm-TabBar-tab[data-id="jp-git-sessions"]'
    );
    const selected = await gitTabBar.getAttribute('aria-selected');

    // Git panel may be already open on launch
    if (selected === 'false') {
      await gitTabBar.click();
    }
  });

  test('should diff conflicted text file', async ({ page }) => {
    await page.click('[title="file.txt • Conflicted"]', { clickCount: 2 });
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

    const mergeDiff = page.locator('.CodeMirror-merge-3pane');
    await expect(mergeDiff).toBeVisible();
  });

  test('should diff conflicted notebook file', async ({ page }) => {
    await page.click('[title="Untitled.ipynb • Conflicted"]', {
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
