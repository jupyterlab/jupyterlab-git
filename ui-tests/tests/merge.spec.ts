import { test, expect } from '@playwright/test';

const TARGET_URL = process.env.TARGET_URL ?? 'http://localhost:8888';

test.beforeEach(async ({ page }) => {
  await page.goto(`${TARGET_URL}/lab`);
  await page.waitForSelector('#jupyterlab-splash', { state: 'detached' });
  await page.waitForSelector('div[role="main"] >> text=Launcher');
});

// test('do something.', async ({ page }) => {
// });
