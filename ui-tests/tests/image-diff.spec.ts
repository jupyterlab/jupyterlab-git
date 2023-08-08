import { expect, test } from '@jupyterlab/galata';
import path from 'path';
import { extractFile } from './utils';

const baseRepositoryPath = 'test-repository.tar.gz';
test.use({ autoGoto: false });

test.describe('Image diff', () => {
  test.beforeEach(async ({ baseURL, page, tmpPath }) => {
    await extractFile(
      baseURL,
      path.resolve(__dirname, 'data', baseRepositoryPath),
      path.join(tmpPath, 'repository.tar.gz')
    );

    // URL for merge conflict example repository
    await page.goto(`tree/${tmpPath}/test-repository`);
  });

  test('should display image diff from history', async ({ page }) => {
    await page.sidebar.openTab('jp-git-sessions');
    await page.click('button:has-text("History")');
    const commits = page.getByTitle('View commit details');

    await commits.first().click();

    await page
      .getByTitle('git_workflow.jpg')
      .getByRole('button', { name: 'View file changes' })
      .click();

    expect
      .soft(await page.locator('.jp-git-image-diff').screenshot())
      .toMatchSnapshot('jpeg_diff.png');

    await page
      .getByTitle('jupyter.png')
      .getByRole('button', { name: 'View file changes' })
      .click();

    expect(
      await page.locator('.jp-git-image-diff').last().screenshot()
    ).toMatchSnapshot('png_diff.png');
  });
});
