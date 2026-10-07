import { expect, galata, test } from '@jupyterlab/galata';
import fs from 'fs';
import path from 'path';
import { extractFile } from '../tests/utils';
import { createDemoRepository, DEMO_REPOSITORY } from './demo-repository';
import { installCursor, Pointer, Recorder } from './recorder';

const OUTPUT = path.resolve(
  __dirname,
  '..',
  'screencast-results',
  'jupyterlab-git.mp4'
);

test.use({ autoGoto: false });

test('README screencast', async ({ page, request }) => {
  const contents = galata.newContentsHelper(request);
  if (await contents.directoryExists(DEMO_REPOSITORY)) {
    await contents.deleteDirectory(DEMO_REPOSITORY);
  }
  const tarball = createDemoRepository();
  await extractFile(request, tarball, `${DEMO_REPOSITORY}.tar.gz`);
  fs.rmSync(path.dirname(tarball), { recursive: true });

  await installCursor(page);
  await page.goto(`tree/${DEMO_REPOSITORY}`);
  // Make room for the Git panel toolbar
  await page.sidebar.setWidth(340);

  const notebookItem = page.getByRole('listitem', {
    name: 'Name: analysis.ipynb'
  });
  await notebookItem.waitFor();

  const start = { x: 760, y: 460 };
  await page.mouse.move(start.x, start.y);
  const pointer = new Pointer(page, start);
  const recorder = new Recorder(page, { path: OUTPUT });
  await recorder.start();
  await page.waitForTimeout(1200);

  // Edit a notebook
  await pointer.dblclick(notebookItem);
  const plotLine = page.getByText('df.plot(title="Temperatures in Paris")');
  await plotLine.waitFor();
  await page.waitForTimeout(1000);
  await pointer.click(plotLine, { offset: { x: 340, y: 8 } });
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type(
    'df.resample("W").mean().plot(title="Weekly average")',
    { delay: 55 }
  );
  await page.waitForTimeout(400);
  await page.keyboard.press('Control+s');
  await page.waitForTimeout(1000);

  // Look at the changes
  await pointer.click(page.getByRole('tab', { name: 'Git' }));
  const changedFile = page.getByTitle('analysis.ipynb • Modified');
  await changedFile.waitFor();
  await page.waitForTimeout(1200);
  await pointer.moveTo(changedFile);
  await page.waitForTimeout(400);
  await pointer.click(
    changedFile.getByRole('button', { name: 'Diff this file' })
  );
  const addedLine = page
    .locator('.nbdime-Widget')
    .getByText('df.resample("W").mean().plot(title="Weekly average")');
  await addedLine.waitFor();
  await page.waitForTimeout(800);
  await pointer.moveTo(addedLine, { offset: { x: 60, y: 22 } });
  await page.waitForTimeout(2500);
  await pointer.click(
    page.locator(
      '#jp-main-dock-panel .lm-TabBar-tab.lm-mod-current .lm-TabBar-tabCloseIcon'
    )
  );
  await page.waitForTimeout(600);

  // Commit them
  await pointer.moveTo(changedFile);
  await page.waitForTimeout(300);
  await pointer.click(
    changedFile.getByRole('button', { name: 'Stage this change' })
  );
  await page.waitForTimeout(700);
  await pointer.click(
    page.getByPlaceholder('Commit message (Ctrl+Enter to commit)')
  );
  await page.keyboard.type('Plot the weekly average', { delay: 60 });
  await page.waitForTimeout(400);
  await pointer.click(
    page.getByRole('button', { name: 'Commit', exact: true })
  );
  const commit = page.getByText('Plot the weekly average');
  await expect(commit).toBeVisible();
  await page.waitForTimeout(1500);

  // Browse the history
  await pointer.click(commit);
  await page.waitForTimeout(2500);

  // Switch to another branch
  await pointer.click(page.getByTitle('Switch to branch: monthly-summary'));
  await expect(page.getByText('Add a monthly summary')).toBeVisible();
  await expect(plotLine).toBeVisible();
  await expect(
    page.locator('.jp-Notebook').getByText('Weekly average')
  ).toHaveCount(0);
  await page.waitForTimeout(3000);

  await recorder.stop();
});
