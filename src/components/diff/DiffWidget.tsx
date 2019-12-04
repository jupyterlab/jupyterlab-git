import { ReactWidget, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { style } from 'typestyle';
import { Diff, isDiffSupported, RenderMimeProvider } from './Diff';
import { getRefValue, IDiffContext } from './model';
import { GitExtension } from '../../model';

/**
 * Method to open a main menu panel to show the diff of a given Notebook file.
 * If one already exists, just activates the existing one.
 *
 * @param filePath the path relative to the Git repo root.
 * @param shell The JupyterLab shell instance
 * @param diffContext the context in which the diff is being requested
 * @param renderMime the renderMime registry instance from the
 * @param topRepoPath the Git repo root path.
 */
export async function openDiffView(
  filePath: string,
  model: GitExtension,
  diffContext: IDiffContext,
  renderMime: IRenderMimeRegistry
) {
  if (isDiffSupported(filePath)) {
    const id = `nbdiff-${filePath}-${getRefValue(diffContext.currentRef)}`;
    let mainAreaItems = model.shell.widgets('main');
    let mainAreaItem = mainAreaItems.next();
    while (mainAreaItem) {
      if (mainAreaItem.id === id) {
        model.shell.activateById(id);
        break;
      }
      mainAreaItem = mainAreaItems.next();
    }
    if (!mainAreaItem) {
      const serverRepoPath = model.getRelativeFilePath();
      const nbDiffWidget = ReactWidget.create(
        <RenderMimeProvider value={renderMime}>
          <Diff
            diffContext={diffContext}
            path={filePath}
            topRepoPath={serverRepoPath}
          />
        </RenderMimeProvider>
      );
      nbDiffWidget.id = id;
      nbDiffWidget.title.label = PathExt.basename(filePath);
      nbDiffWidget.title.iconClass = style({
        backgroundImage: 'var(--jp-icon-diff)'
      });
      nbDiffWidget.title.closable = true;
      nbDiffWidget.addClass('jp-git-diff-parent-diff-widget');

      model.shell.add(nbDiffWidget, 'main');
      model.shell.activateById(nbDiffWidget.id);
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
