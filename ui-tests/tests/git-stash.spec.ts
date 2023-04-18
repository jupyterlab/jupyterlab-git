import { expect } from '@playwright/test';
import { test } from '@jupyterlab/galata';
import path from 'path';
import { extractFile } from './utils';

const baseRepositoryPath = 'test-repository-stash.tar.gz';
test.use({ autoGoto: false });

test.describe('Git Stash Stash Stash', () => {
  test.beforeEach(async ({ baseURL, page, tmpPath }) => {
    await extractFile(
      baseURL,
      path.resolve(__dirname, 'data', baseRepositoryPath),
      path.join(tmpPath, 'repository.tar.gz')
    );

    // Open Git panel
    await page.goto(`tree/${tmpPath}/test-repository`);
    await page.sidebar.openTab('jp-git-sessions');
    await page.getByRole('tab', { name: 'Changes' }).click();
    // Let stash list finish loading
    await page.waitForSelector(
      '[data-test-id="num-stashes"][data-loading="false"]'
    );
  });

  test('should show the current stash list', async ({ page }) => {
    const stashButton = await page.getByRole('button', {
      name: 'Stash latest changes'
    });
    const numberOfStashes = await page.locator('[data-test-id="num-stashes"]');

    await page.locator('div:nth-child(4) > .fkumj3x > .fp5mvxw').click();

    expect(stashButton).toBeTruthy();
    await expect(await numberOfStashes.innerText()).toBe('(2)');
  });

  test('should clear the entire stash when `stash clear` button is clicked', async ({
    page
  }) => {
    // Hover on the stash section
    const stashSection = await page.getByText('Stash(2)');

    await stashSection.hover();

    // click 'stash clear'
    const clearStashBtn = await page.getByRole('button', {
      name: 'Clear the entire stash'
    });
    await clearStashBtn.click();

    // Wait for the number of stashes to change
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-test-id="num-stashes"]');
      return element && (element.textContent ?? '').includes('(0)');
    });

    // Now there should be zero stashes
    const numberOfStashes = await page.locator('[data-test-id="num-stashes"]');

    await expect(await numberOfStashes.innerText()).toBe('(0)');
  });

  test.skip('should clear the a single stash entry when `stash drop` button is clicked', async ({
    page
  }) => {
    /**
     * CURRENTLY DEBUGGING THIS TEST, NOT REFLECTING LATEST UI CHANGES.
     */

    // Open the stash list
    await page.locator('div:nth-child(4) > .fkumj3x > .fp5mvxw').click();
    // Hover on the stash list
    const stashSection = await page.getByText('Stash(2)');
    await stashSection.hover();

    // Click drop stash on the first item
    const dropFirstStashBtn = await page.locator(
      ':nth-match(button[role="button"]:has-text("Drop stash entry"), 1)'
    );

    await dropFirstStashBtn.click();

    // Wait for the number of stashes to change
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-test-id="num-stashes"]');
      return element && (element.textContent ?? '').includes('(1)');
    });

    // Now there should be only one stash
    const numberOfStashes = await page.locator('[data-test-id="num-stashes"]');

    await expect(await numberOfStashes.innerText()).toBe('(1)');
  });

  test.only('should add a stash when the `stash changes` button is clicked', async ({
    page
  }) => {
    // Click stash changes
    // Hover
    await page.getByText('Stash(2)').hover();

    const stashButton = await page.getByRole('button', {
      name: 'Stash latest changes'
    });
    await stashButton.click();
    // Wait
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-test-id="num-stashes"]');
      return element && (element.textContent ?? '').includes('(3)');
    });

    // See if the nStashes becomes (3)
    const numberOfStashes = await page.locator('[data-test-id="num-stashes"]');

    await expect(await numberOfStashes.innerText()).toBe('(0)');
  });
});
