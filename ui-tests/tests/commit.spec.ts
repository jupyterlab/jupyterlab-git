import { expect, test } from '@jupyterlab/galata';
import path from 'path';
import { extractFile } from './utils';

const baseRepositoryPath = 'test-repository.tar.gz';
test.use({ autoGoto: false });

test.describe('Commit', () => {
  test.beforeEach(async ({ page, request, tmpPath }) => {
    await extractFile(
      request,
      path.resolve(__dirname, 'data', baseRepositoryPath),
      path.join(tmpPath, 'repository.tar.gz')
    );

    // URL for merge conflict example repository
    await page.goto(`tree/${tmpPath}/test-repository`);
  });

  test('should commit a change', async ({ page }) => {
    await page
      .getByRole('listitem', { name: 'Name: another_file.txt' })
      .dblclick();
    await page
      .getByLabel('another_file.txt')
      .getByRole('textbox')
      .fill('My new content');
    await page.keyboard.press('Control+s');

    await page.getByRole('tab', { name: 'Git' }).click();
    //await page.getByTitle('another_file.txt • Modified').hover();
    await page.getByRole('button', { name: 'Stage this change' }).click();

    await page
      .getByPlaceholder('Summary (Ctrl+Enter to commit)')
      .fill('My new commit');

    await page.getByRole('button', { name: 'Commit', exact: true }).click();

    await page.getByRole('tab', { name: 'History' }).click();

    await expect(page.getByText('My new commit')).toBeVisible();
  });
});
