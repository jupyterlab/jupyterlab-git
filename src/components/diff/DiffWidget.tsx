import * as React from 'react';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import { getRefValue, IDiffContext } from './model';
import { Diff, isDiffSupported, RenderMimeProvider } from './Diff';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { style } from 'typestyle';

/**
 * Method to open a main menu panel to show the diff of a given Notebook file.
 * If one already exists, just activates the existing one.
 *
 * @param path the path relative to the Jupyter server root.
 * @param app The JupyterLab application instance
 * @param diffContext the context in which the diff is being requested
 * @param renderMime the renderMime registry instance from the
 */
export function openDiffView(
  path: string,
  app: JupyterFrontEnd,
  diffContext: IDiffContext,
  renderMime: IRenderMimeRegistry
) {
  if (isDiffSupported(path)) {
    const id = `nbdiff-${path}-${getRefValue(diffContext.currentRef)}`;
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
      const nbDiffWidget = ReactWidget.create(
        <RenderMimeProvider value={renderMime}>
          <Diff path={path} diffContext={diffContext} />
        </RenderMimeProvider>
      );
      nbDiffWidget.id = id;
      nbDiffWidget.title.label = PathExt.basename(path);
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
        path
      ).toLocaleLowerCase()} files.`
    });
  }
}
