import { expect, galata, test } from '@jupyterlab/galata';
import path from 'path';
import { extractFile } from './utils';

const baseRepositoryPath = 'test-repository.tar.gz';
test.use({ autoGoto: false, mockSettings: galata.DEFAULT_SETTINGS });

test.describe('Git Worktrees', () => {
  test.beforeEach(async ({ page, request, tmpPath }) => {
    await extractFile(
      request,
      path.resolve(__dirname, 'data', baseRepositoryPath),
      path.join(tmpPath, 'repository.tar.gz')
    );

    await page.goto(`tree/${tmpPath}/test-repository`);

    await page.sidebar.openTab('jp-git-sessions');
    // Wait for the panel to load the repository
    await page.getByTitle('Current branch: master').waitFor();
  });

  test('should not show the worktrees section without linked worktrees', async ({
    page
  }) => {
    await expect(page.getByText('Worktrees', { exact: true })).toHaveCount(0);
  });

  test('should add a worktree for a new branch and open it', async ({
    page,
    tmpPath
  }) => {
    // Open the add worktree dialog from the main menu
    await page.menu.clickMenuItem('Git>Add Worktree…');

    const dialog = page.getByRole('dialog');
    await dialog.waitFor();

    await dialog
      .getByRole('textbox', { name: 'Enter a new branch name' })
      .fill('my-worktree');

    // The worktree path is derived from the branch name
    await expect(
      dialog.getByRole('textbox', { name: 'Enter the new worktree path' })
    ).toHaveValue('worktrees/my-worktree');

    await dialog.getByRole('button', { name: 'Add Worktree' }).click();

    // The worktrees section appears with the new worktree
    await page.getByText('Worktrees', { exact: true }).waitFor();
    const worktreeItem = page.getByRole('listitem', {
      name: `Open worktree: ${tmpPath}/test-repository/worktrees/my-worktree`
    });
    await worktreeItem.waitFor();

    // The worktrees section toolbar offers to create another worktree
    await page.getByRole('button', { name: 'Create a new worktree' }).click();
    await dialog.waitFor();
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    // Open the worktree; the whole panel now targets it
    await worktreeItem.click();

    await page
      .getByRole('listitem', {
        name: `Current worktree: ${tmpPath}/test-repository/worktrees/my-worktree`
      })
      .waitFor();
    await expect(page.getByTitle('Current branch: my-worktree')).toHaveCount(1);
  });

  test('should show a dialog when switching to a branch checked out in another worktree', async ({
    page
  }) => {
    // Create a worktree for a new branch
    await page.menu.clickMenuItem('Git>Add Worktree…');
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await dialog
      .getByRole('textbox', { name: 'Enter a new branch name' })
      .fill('busy-branch');
    await dialog.getByRole('button', { name: 'Add Worktree' }).click();
    await page.getByText('Worktrees', { exact: true }).waitFor();

    // Open the branches section and try to switch to the branch of the worktree
    const branchesRegion = page.getByRole('region', {
      name: 'Branches and Tags Section'
    });
    if (!(await branchesRegion.isVisible())) {
      await page.getByText('Branches and Tags', { exact: true }).click();
    }
    const branchItem = page.getByRole('listitem', {
      name: 'Switch to branch: busy-branch'
    });
    await branchItem.waitFor();

    // The branch is flagged with its worktree
    await expect(branchItem.getByTitle(/Checked out in worktree:/)).toHaveCount(
      1
    );

    await branchItem.click();

    // A dialog offers to open the worktree instead of failing the checkout
    await page.getByText('Branch checked out in another worktree').waitFor();
    await page.getByRole('button', { name: 'Dismiss' }).click();

    // Still on the original branch
    await expect(page.getByTitle('Current branch: master')).toHaveCount(1);
  });
});
