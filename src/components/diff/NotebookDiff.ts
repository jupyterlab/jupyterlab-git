/**
 * Modified from nbdime
 * https://github.com/jupyter/nbdime/blob/master/packages/labextension/src/widget.ts
 */

/* eslint-disable no-inner-declarations */

import { Toolbar } from '@jupyterlab/apputils';
import { INotebookContent } from '@jupyterlab/nbformat';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { PromiseDelegate } from '@lumino/coreutils';
import { Message } from '@lumino/messaging';
import { Panel, Widget } from '@lumino/widgets';
import { IDiffEntry } from 'nbdime/lib/diff/diffentries';
import { NotebookDiffModel } from 'nbdime/lib/diff/model';
import { CELLDIFF_CLASS, NotebookDiffWidget } from 'nbdime/lib/diff/widget';
import {
  CHUNK_PANEL_CLASS,
  UNCHANGED_DIFF_CLASS
} from 'nbdime/lib/diff/widget/common';
import { requestAPI } from '../../git';
import { Git } from '../../tokens';
import { DiffModel } from './model';

/**
 * Class of the outermost widget, the draggable tab
 */
const NBDIME_CLASS = 'nbdime-Widget';

/**
 * Class of the root of the actual diff, the scroller element
 */
const ROOT_CLASS = 'nbdime-root';

/**
 * DOM class for whether or not to hide unchanged cells
 */
const HIDE_UNCHANGED_CLASS = 'jp-mod-hideUnchanged';

/**
 * Data return by the ndbime api endpoint
 */
interface INbdimeDiff {
  /**
   * Base notebook content
   */
  base: INotebookContent;
  /**
   * Diff to obtain challenger from base
   */
  diff: IDiffEntry[];
}

/**
 * Diff callback to be registered for notebook files.
 *
 * @param model Diff model
 * @param toolbar MainAreaWidget toolbar
 * @returns Diff notebook widget
 */
export const createNotebookDiff: Git.Diff.ICallback<string> = async (
  model: DiffModel<string>,
  toolbar?: Toolbar
): Promise<NotebookDiff> => {
  const data = await requestAPI<INbdimeDiff>('diffnotebook', 'POST', {
    currentContent: model.challenger.content,
    previousContent: model.reference.content
  });
  const nbModel = new NotebookDiffModel(data.base, data.diff);

  // Add element in toolbar
  const checkbox = document.createElement('input');
  if (toolbar) {
    const label = document.createElement('label');
    checkbox.className = 'nbdime-hide-unchanged';
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    label.appendChild(checkbox);
    label.appendChild(document.createElement('span')).textContent =
      'Hide unchanged cells';
    toolbar.addItem('hideUnchanged', new Widget({ node: label }));
  }

  // Create the notebook diff view
  const diffWidget = new NotebookDiff(model, nbModel);

  await diffWidget.ready;

  // Connect toolbar checkbox and notebook diff widget
  if (toolbar) {
    diffWidget.areUnchangedCellsHidden = checkbox.checked;
    checkbox.onchange = () => {
      diffWidget.areUnchangedCellsHidden = checkbox.checked;
    };
  }

  return diffWidget;
};

/**
 * NotebookDiff widget
 */
export class NotebookDiff extends Panel {
  constructor(model: DiffModel<string>, nbModel: NotebookDiffModel) {
    super();
    const getReady = new PromiseDelegate<void>();
    this._isReady = getReady.promise;

    this.addClass(NBDIME_CLASS);

    const header = Private.diffHeader(
      model.reference.label,
      model.challenger.label
    );
    this.addWidget(header);

    this._scroller = new Panel();
    this._scroller.addClass(ROOT_CLASS);
    this._scroller.node.tabIndex = -1;
    this.addWidget(this._scroller);

    const nbdWidget = this.createDiffView(nbModel, model.renderMime);

    this._scroller.addWidget(nbdWidget);
    nbdWidget
      .init()
      .then(() => {
        Private.markUnchangedRanges(this._scroller.node);
        getReady.resolve();
      })
      .catch(reason => {
        // FIXME there is a bug in nbdime and init got reject due to recursion limit hit
        // console.error(`Failed to init notebook diff view: ${reason}`);
        // getReady.reject(reason);
        console.debug(`Failed to init notebook diff view: ${reason}`);
        Private.markUnchangedRanges(this._scroller.node);
        getReady.resolve();
      });
  }

  /**
   * Whether the unchanged cells are hidden or not
   */
  get areUnchangedCellsHidden(): boolean {
    return this._areUnchangedCellsHidden;
  }
  set areUnchangedCellsHidden(v: boolean) {
    if (this._areUnchangedCellsHidden !== v) {
      Private.toggleShowUnchanged(
        this._scroller,
        this._areUnchangedCellsHidden
      );
      this._areUnchangedCellsHidden = v;
    }
  }

  /**
   * Promise which fulfills when the widget is ready.
   */
  get ready(): Promise<void> {
    return this._isReady;
  }

  protected createDiffView(
    model: NotebookDiffModel,
    renderMime: IRenderMimeRegistry
  ): NotebookDiffWidget {
    return new NotebookDiffWidget(model, renderMime);
  }

  /**
   * Handle `'activate-request'` messages.
   */
  protected onActivateRequest(msg: Message): void {
    this._scroller.node.focus();
  }

  protected _areUnchangedCellsHidden = false;
  protected _isReady: Promise<void>;
  protected _scroller: Panel;
}

namespace Private {
  /**
   * Create a header widget for the diff view.
   */
  export function diffHeader(baseLabel: string, remoteLabel: string): Widget {
    const node = document.createElement('div');
    node.className = 'nbdime-Diff';
    node.innerHTML = `<div class=nbdime-header-banner>
        <span class="nbdime-header-base">${baseLabel}</span>
        <span class="nbdime-header-remote">${remoteLabel}</span>
      </div>`;

    return new Widget({ node });
  }

  /**
   * Toggle whether to show or hide unchanged cells.
   *
   * This simply marks with a class, real work is done by CSS.
   */
  export function toggleShowUnchanged(root: Widget, show?: boolean): void {
    const hiding = root.hasClass(HIDE_UNCHANGED_CLASS);
    if (show === undefined) {
      show = hiding;
    } else if (hiding !== show) {
      // Nothing to do
      return;
    }
    if (show) {
      root.removeClass(HIDE_UNCHANGED_CLASS);
    } else {
      markUnchangedRanges(root.node);
      root.addClass(HIDE_UNCHANGED_CLASS);
    }
    root.update();
  }

  /**
   * Gets the chunk element of an added/removed cell, or the cell element for others
   * @param cellElement
   */
  function getChunkElement(cellElement: Element): Element {
    if (
      !cellElement.parentElement ||
      !cellElement.parentElement.parentElement
    ) {
      return cellElement;
    }
    const chunkCandidate = cellElement.parentElement.parentElement;
    if (chunkCandidate.classList.contains(CHUNK_PANEL_CLASS)) {
      return chunkCandidate;
    }
    return cellElement;
  }

  /**
   * Marks certain cells with
   */
  export function markUnchangedRanges(root: HTMLElement): void {
    const children = root.querySelectorAll(`.${CELLDIFF_CLASS}`);
    let rangeStart = -1;
    for (let i = 0; i < children.length; ++i) {
      const child = children[i];
      if (!child.classList.contains(UNCHANGED_DIFF_CLASS)) {
        // Visible
        if (rangeStart !== -1) {
          // Previous was hidden
          const N = i - rangeStart;
          getChunkElement(child).setAttribute(
            'data-nbdime-NCellsHiddenBefore',
            N.toString()
          );
          rangeStart = -1;
        }
      } else if (rangeStart === -1) {
        rangeStart = i;
      }
    }
    if (rangeStart !== -1) {
      // Last element was part of a hidden range, need to mark
      // the last cell that will be visible.
      const N = children.length - rangeStart;
      if (rangeStart === 0) {
        // All elements were hidden, nothing to mark
        // Add info on root instead
        const tag = root.querySelector('.jp-Notebook-diff') || root;
        tag.setAttribute('data-nbdime-AllCellsHidden', N.toString());
        return;
      }
      const lastVisible = children[rangeStart - 1];
      getChunkElement(lastVisible).setAttribute(
        'data-nbdime-NCellsHiddenAfter',
        N.toString()
      );
    }
  }
}
