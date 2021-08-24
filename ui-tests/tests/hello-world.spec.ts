import { test, expect } from '@playwright/test';

const TARGET_URL = process.env.TARGET_URL ?? 'http://localhost:8888';

test.describe('hello-world', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TARGET_URL}/lab`);
    await page.waitForSelector('#jupyterlab-splash', { state: 'detached' });
    await page.waitForSelector('div[role="main"] >> text=Launcher');
  });

  test('should find the git extension', async ({ page }) => {
    const gitTabbar = await page.waitForSelector(
      '.lm-TabBar-tab[data-id="jp-git-sessions"]'
    );

    expect(gitTabbar).toBeTruthy();
  });
});
