import { Widget } from '@phosphor/widgets';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import { getRefValue, IDiffContext } from './model';
import { Diff, isDiffSupported, RenderMimeProvider } from './Diff';
import { JupyterLab } from '@jupyterlab/application';
import { showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { style } from 'typestyle';

export class DiffWidget extends Widget {
  private readonly _renderMime: IRenderMimeRegistry;
  private readonly _path: string;
  private readonly _diffContext: IDiffContext;

  constructor(
    renderMime: IRenderMimeRegistry,
    path: string,
    gitContext: IDiffContext
  ) {
    super();
    this._renderMime = renderMime;
    this._path = path;
    this._diffContext = gitContext;

    this.title.label = PathExt.basename(path);
    this.title.iconClass = style({
      backgroundImage: 'var(--jp-icon-diff)'
    });
    this.title.closable = true;
    this.addClass('jp-git-diff-parent-diff-widget');

    ReactDOM.render(
      <RenderMimeProvider value={this._renderMime}>
        <Diff path={this._path} diffContext={this._diffContext} />
      </RenderMimeProvider>,
      this.node
    );
  }

  onUpdateRequest(): void {
    ReactDOM.unmountComponentAtNode(this.node);
    ReactDOM.render(
      <RenderMimeProvider value={this._renderMime}>
        <Diff path={this._path} diffContext={this._diffContext} />
      </RenderMimeProvider>,
      this.node
    );
  }
}

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
  app: JupyterLab,
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
      const nbDiffWidget = new DiffWidget(renderMime, path, diffContext);
      nbDiffWidget.id = id;
      app.shell.addToMainArea(nbDiffWidget);
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
