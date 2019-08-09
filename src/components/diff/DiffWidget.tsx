import * as React from 'react';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import { getRefValue, IDiffContext } from './model';
import { Diff, isDiffSupported, RenderMimeProvider } from './Diff';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { style } from 'typestyle';
import { httpGitRequest } from '../../git';

/**
 * Method to open a main menu panel to show the diff of a given Notebook file.
 * If one already exists, just activates the existing one.
 *
 * @param filePath the path relative to the Git repo root.
 * @param app The JupyterLab application instance
 * @param diffContext the context in which the diff is being requested
 * @param renderMime the renderMime registry instance from the
 * @param topRepoPath the Git repo root path.
 */
export async function openDiffView(
  filePath: string,
  app: JupyterFrontEnd,
  diffContext: IDiffContext,
  renderMime: IRenderMimeRegistry,
  topRepoPath: string
) {
  if (isDiffSupported(filePath)) {
    const id = `nbdiff-${filePath}-${getRefValue(diffContext.currentRef)}`;
    let mainAreaItems = app.shell.widgets('main');
    let mainAreaItem = mainAreaItems.next();
    while (mainAreaItem) {
      if (mainAreaItem.id === id) {
        app.shell.activateById(id);
        break;
      }
      mainAreaItem = mainAreaItems.next();
    }
    if (!mainAreaItem) {
      const relativeFilePath: string = await getRelativeFilePath(
        filePath,
        topRepoPath
      );
      const nbDiffWidget = ReactWidget.create(
        <RenderMimeProvider value={renderMime}>
          <Diff path={relativeFilePath} diffContext={diffContext} />
        </RenderMimeProvider>
      );
      nbDiffWidget.id = id;
      nbDiffWidget.title.label = PathExt.basename(filePath);
      nbDiffWidget.title.iconClass = style({
        backgroundImage: 'var(--jp-icon-diff)'
      });
      nbDiffWidget.title.closable = true;
      nbDiffWidget.addClass('jp-git-diff-parent-diff-widget');

      app.shell.add(nbDiffWidget, 'main');
      app.shell.activateById(nbDiffWidget.id);
    }
  } else {
    showDialog({
      title: 'Diff Not Supported',
      body: `Diff is not supported for ${PathExt.extname(
        filePath
      ).toLocaleLowerCase()} files.`
    });
  }
}

/**
 * Gets the path of the file relative to the Jupyter server root. This resolves the server root path after calling
 * the `/git/server_root` REST API, and uses the Git repo root and the file path relative to the repo root to resolve
 * the rest.
 * @param path the file path relative to Git repo root
 * @param topRepoPath the Git repo root path
 */
export async function getRelativeFilePath(
  path: string,
  topRepoPath: string
): Promise<string> {
  const response = await httpGitRequest('/git/server_root', 'POST', {});
  const responseData = await response.json();
  return PathExt.join(
    PathExt.relative(responseData['server_root'], topRepoPath),
    path
  );
}
