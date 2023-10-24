import { expect, test } from '@jupyterlab/galata';
import path from 'path';
import { extractFile } from './utils';

const baseRepositoryPath = 'test-repository-stash.tar.gz';
test.use({ autoGoto: false });

test.describe('Git Stash Commands', () => {
  test.beforeEach(async ({ page, request, tmpPath }) => {
    await extractFile(
      request,
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

  test('should show the current stash list of two items', async ({ page }) => {
    const stashButton = page.getByRole('button', {
      name: 'Stash latest changes'
    });
    const numberOfStashes = page.locator('[data-test-id="num-stashes"]');

    await page.getByText('Stash', { exact: true }).click();

    expect.soft(stashButton).toBeTruthy();
    await expect(numberOfStashes).toHaveText('(2)');
  });

  test('should drop a single stash entry when `stash drop` button is clicked', async ({
    page
  }) => {
    // Open the stash list
    await page.getByText('Stash', { exact: true }).click();
    // Hover on the stash list
    const stashSection = page.getByText('Stash(2)');
    await stashSection.hover();

    // Click drop stash on the first item
    const dropFirstStashBtn = page
      .locator('div')
      .filter({ hasText: /^notebook stash \(on master\)$/ })
      .last()
      .getByRole('button', { name: 'Drop stash entry' });

    await dropFirstStashBtn.click();

    // Wait for the number of stashes to change
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-test-id="num-stashes"]');
      return element && !(element.textContent ?? '').includes('(2)');
    });

    // Now there should be only one stash
    const numberOfStashes = page.locator('[data-test-id="num-stashes"]');

    await expect(numberOfStashes).toHaveText('(1)');
  });

  test('should clear all the stashes when `stash clear` button is clicked', async ({
    page
  }) => {
    // Open the stash list
    await page.getByText('Stash', { exact: true }).click();
    // Hover on the stash list
    const stashSection = page.getByText('Stash(2)');
    await stashSection.hover();

    // Click clear all stash button
    await page
      .getByRole('button', {
        name: 'Clear the entire stash'
      })
      .click();

    // Wait for the number of stashes to change
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-test-id="num-stashes"]');
      return element && !(element.textContent ?? '').includes('(2)');
    });

    // Now there should be only one stash
    const numberOfStashes = page.locator('[data-test-id="num-stashes"]');

    await expect(numberOfStashes).toHaveText('(0)');
  });

  test('should add a stash when the `stash changes` button is clicked', async ({
    page
  }) => {
    // open the first affected file in the stash entry
    await page.getByRole('tab', { name: 'File Browser ' }).click();

    await page
      .getByRole('region', { name: 'File Browser Section' })
      .getByText('file.txt', { exact: true })
      .dblclick();

    // go back to git panel
    await page.getByRole('tab', { name: 'Git' }).click();

    // Click stash changes
    // Hover
    await page.getByText('Stash(2)').hover();

    // Should have the old tetx

    const oldText = page.locator('text="This is some dirty changes"');
    await expect.soft(oldText).toHaveCount(1);
    const stashButton = page.getByRole('button', {
      name: 'Stash latest changes'
    });
    await stashButton.click();

    // add placeholder
    await page
      .getByPlaceholder('Stash message (optional)')
      .fill('some stash message');
    // click yes
    await page.getByRole('button', { name: 'Stash' }).click();

    // Wait
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-test-id="num-stashes"]');
      return element && !(element.textContent ?? '').includes('(2)');
    });

    // See if the nStashes becomes (3)
    const numberOfStashes = page.locator('[data-test-id="num-stashes"]');

    await expect.soft(numberOfStashes).toHaveText('(3)');
    // check that our stash message showed up properly
    await expect
      .soft(page.getByText('some stash message (on master)'))
      .toBeVisible();
    await page.waitForTimeout(100);
    // Check that the stash removed the old text disappears
    await expect(oldText).toHaveCount(0);
  });

  test('should apply a stash entry when the `stash apply` button is clicked (does not remove stash entry from list)', async ({
    page
  }) => {
    // open the first affected file in hte stash entry
    await page.getByRole('tab', { name: 'File Browser' }).click();

    await page
      .getByRole('region', { name: 'File Browser Section' })
      .getByText('master_file.ts')
      .dblclick();

    // go back to git panel
    await page.getByRole('tab', { name: 'Git' }).click();

    // Show the stash entries and hover on the stash entry
    await page.getByText('Stash(2)').click();
    await page
      .locator('div')
      .filter({ hasText: /^stashy stash \(on master\)$/ })
      .last()
      .hover();

    const applyStashBtn = page
      .locator('div')
      .filter({ hasText: /^stashy stash \(on master\)$/ })
      .last()
      .getByRole('button', { name: 'Apply stash entry' });

    await applyStashBtn.click();

    // Check that the stash applies
    await expect
      .soft(page.getByText('console.log("dirty changes");'))
      .toHaveCount(1);

    // open the second file has changes applied
    await page.getByRole('tab', { name: 'File Browser' }).click();

    await page
      .getByRole('region', { name: 'File Browser Section' })
      .getByText('another_file.txt')
      .dblclick();

    await expect
      .soft(page.getByText('This is some dirty changes'))
      .toHaveCount(1);

    // See if the nStashes remains the same
    const numberOfStashes = page.locator('[data-test-id="num-stashes"]');
    await expect(numberOfStashes).toHaveText('(2)');
  });

  test('should pop a stash entry when the `stash pop` button is clicked (apply stash then remove from list)', async ({
    page
  }) => {
    // open the first affected file in hte stash entry
    await page.getByRole('tab', { name: 'File Browser' }).click();

    await page
      .getByRole('region', { name: 'File Browser Section' })
      .getByText('master_file.ts')
      .dblclick();

    // go back to git panel
    await page.getByRole('tab', { name: 'Git' }).click();

    // Discard all changes so we can pop the stash
    await page.getByText('Changed').hover();
    await page.getByRole('button', { name: 'Discard All Changes' }).click();
    await page.getByRole('button', { name: 'Discard', exact: true }).click();

    // Show the stash entries and hover on the stash entry
    // await page.getByText('Stash(2)').hover();
    await page.getByText('Stash', { exact: true }).click();

    await page
      .locator('div')
      .filter({ hasText: /^stashy stash \(on master\)$/ })
      .last()
      .hover();

    await page
      .locator('div')
      .filter({ hasText: /^stashy stash \(on master\)$/ })
      .last()
      .getByRole('button', { name: 'Pop stash entry' })
      .click();

    // Wait for the number of stashes to change
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-test-id="num-stashes"]');
      return element && !(element.textContent ?? '').includes('(2)');
    });
    await page.waitForTimeout(100);
    // Check that the stash applies
    const firstStashFileText = page.getByText('console.log("dirty changes");');

    await expect.soft(firstStashFileText).toHaveCount(1);

    // open the second file has changes applied
    await page.getByRole('tab', { name: 'File Browser' }).click();

    await page
      .getByRole('region', { name: 'File Browser Section' })
      .getByText('another_file.txt')
      .dblclick();

    // Wait for revertFile to finish
    await page.waitForTimeout(100);

    const secondStashFileText = page.getByText('This is some dirty changes');

    await expect.soft(secondStashFileText).toHaveCount(1);

    // See if the nStashes remains the same

    await page.waitForFunction(() => {
      const element = document.querySelector('[data-test-id="num-stashes"]');
      return element && !(element.textContent ?? '').includes('(2)');
    });

    const numberOfStashes = page.locator('[data-test-id="num-stashes"]');
    await expect(numberOfStashes).toHaveText('(1)');
  });
});
