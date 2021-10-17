/**
 * Modified from nbdime
 * https://github.com/jupyter/nbdime/blob/master/packages/labextension/src/widget.ts
 */

/* eslint-disable no-inner-declarations */

import { Toolbar } from '@jupyterlab/apputils';
import { Contents } from '@jupyterlab/services';
import { INotebookContent } from '@jupyterlab/nbformat';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { PromiseDelegate } from '@lumino/coreutils';
import { Message } from '@lumino/messaging';
import { Panel, Widget } from '@lumino/widgets';
import { IDiffEntry } from 'nbdime/lib/diff/diffentries';
import { IMergeDecision } from 'nbdime/lib/merge/decisions';
import { NotebookMergeModel } from 'nbdime/lib/merge/model';
import { CELLMERGE_CLASS, NotebookMergeWidget } from 'nbdime/lib/merge/widget';
import { UNCHANGED_MERGE_CLASS } from 'nbdime/lib/merge/widget/common';
import { NotebookDiffModel } from 'nbdime/lib/diff/model';
import { CELLDIFF_CLASS, NotebookDiffWidget } from 'nbdime/lib/diff/widget';
import {
  CHUNK_PANEL_CLASS,
  UNCHANGED_DIFF_CLASS
} from 'nbdime/lib/diff/widget/common';
import { requestAPI } from '../../git';
import { Git } from '../../tokens';
import {
  ITranslator,
  nullTranslator,
  TranslationBundle
} from '@jupyterlab/translation';

/**
 * Class of the outermost widget, the draggable tab
 */
const NBDIME_CLASS = 'nbdime-Widget';

/**
 * Class of the root of the actual diff, the scroller element
 */
export const ROOT_CLASS = 'nbdime-root';

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

interface INbdimeMergeDiff {
  /**
   * Base notebook content
   */
  base: INotebookContent;
  /**
   * Set of decisions made by comparing
   * reference, challenger, and base notebooks
   */
  merge_decisions: IMergeDecision[];
}

/**
 * Diff callback to be registered for notebook files.
 *
 * @param model Diff model
 * @param toolbar MainAreaWidget toolbar
 * @returns Diff notebook widget
 */
export const createNotebookDiff = async (
  model: Git.Diff.IModel,
  renderMime: IRenderMimeRegistry,
  toolbar?: Toolbar,
  translator?: ITranslator
): Promise<NotebookDiff> => {
  // Create the notebook diff view
  const trans = translator.load('jupyterlab_git');
  const diffWidget = new NotebookDiff(model, renderMime, trans);
  diffWidget.addClass('jp-git-diff-root');

  await diffWidget.ready;

  // Add elements in toolbar
  if (toolbar) {
    const checkbox = document.createElement('input');
    const label = document.createElement('label');
    checkbox.className = 'nbdime-hide-unchanged';
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    label.appendChild(checkbox);
    label.appendChild(document.createElement('span')).textContent = trans.__(
      'Hide unchanged cells'
    );
    toolbar.addItem('hideUnchanged', new Widget({ node: label }));

    if (model.hasConflict) {
      // Move merge notebook controls in the toolbar
      toolbar.addItem('clear-outputs', diffWidget.nbdimeWidget.widgets[0]);
    }

    // Connect toolbar checkbox and notebook diff widget
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
export class NotebookDiff extends Panel implements Git.Diff.IDiffWidget {
  constructor(
    model: Git.Diff.IModel,
    renderMime: IRenderMimeRegistry,
    translator?: TranslationBundle
  ) {
    super();
    const getReady = new PromiseDelegate<void>();
    this._isReady = getReady.promise;
    this._model = model;
    this._renderMime = renderMime;
    this._trans = translator ?? nullTranslator.load('jupyterlab_git');

    this.addClass(NBDIME_CLASS);

    this.refresh()
      .then(() => {
        getReady.resolve();
      })
      .catch(reason => {
        console.error(
          this._trans.__('Failed to refresh Notebook diff.'),
          reason,
          reason?.traceback
        );
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
        this._hasConflict,
        this._areUnchangedCellsHidden
      );
      this._areUnchangedCellsHidden = v;
    }
  }

  /**
   * Helper to determine if a notebook merge should be shown.
   */
  private get _hasConflict(): boolean {
    return this._model.hasConflict;
  }

  /**
   * Nbdime notebook widget.
   */
  get nbdimeWidget(): NotebookDiffWidget | NotebookMergeWidget {
    return this._nbdWidget;
  }

  /**
   * Promise which fulfills when the widget is ready.
   */
  get ready(): Promise<void> {
    return this._isReady;
  }

  /**
   * Checks if all conflicts have been resolved.
   *
   * @see https://github.com/jupyter/nbdime/blob/a74b538386d05e3e9c26753ad21faf9ff4d269d7/packages/webapp/src/app/save.ts#L2
   */
  get isFileResolved(): boolean {
    const widget = this.nbdimeWidget as NotebookMergeWidget;
    this._lastSerializeModel = widget.model.serialize();
    const validated = widget.validateMerged(this._lastSerializeModel);
    return (
      JSON.stringify(this._lastSerializeModel) === JSON.stringify(validated)
    );
  }

  /**
   * Gets the file model of a resolved merge conflict,
   * and rejects if unable to retrieve.
   *
   * Note: `isFileResolved` is assumed to not have been called,
   * or to have been called just before calling this method for caching purposes.
   */
  async getResolvedFile(): Promise<Partial<Contents.IModel>> {
    return Promise.resolve({
      format: 'json',
      type: 'notebook',
      content:
        this._lastSerializeModel ??
        (this.nbdimeWidget as NotebookMergeWidget).model.serialize()
    });
  }

  /**
   * Refresh diff
   *
   * Note: Update the content and recompute the diff
   */
  async refresh(): Promise<void> {
    if (!this._scroller?.parent) {
      while (this.widgets.length > 0) {
        this.widgets[0].dispose();
      }

      const header = Private.diffHeader(
        this._model.reference.label,
        this._model.challenger.label,
        this._hasConflict,
        this._trans.__('Common Ancestor')
      );
      this.addWidget(header);

      this._scroller = new Panel();
      this._scroller.addClass(ROOT_CLASS);
      this._scroller.node.tabIndex = -1;
      this.addWidget(this._scroller);
    }

    try {
      // ENH request content only if it changed
      const referenceContent = await this._model.reference.content();
      const challengerContent = await this._model.challenger.content();
      const baseContent = await this._model.base?.content();

      const createView = baseContent
        ? this.createMergeView.bind(this)
        : this.createDiffView.bind(this);

      this._nbdWidget = await createView(
        challengerContent,
        referenceContent,
        baseContent
      );

      while (this._scroller.widgets.length > 0) {
        this._scroller.widgets[0].dispose();
      }
      this._scroller.addWidget(this._nbdWidget);
      try {
        await this._nbdWidget.init();

        Private.markUnchangedRanges(this._scroller.node, this._hasConflict);
      } catch (reason) {
        // FIXME there is a bug in nbdime and init got reject due to recursion limit hit
        // console.error(`Failed to init notebook diff view: ${reason}`);
        // getReady.reject(reason);
        console.debug(
          this._trans.__('Failed to init notebook diff view: %1', reason)
        );
        Private.markUnchangedRanges(this._scroller.node, this._hasConflict);
      }
    } catch (reason) {
      this.showError(reason as Error);
    }
  }

  protected async createDiffView(
    challengerContent: string,
    referenceContent: string
  ): Promise<NotebookDiffWidget> {
    const data = await requestAPI<INbdimeDiff>('diffnotebook', 'POST', {
      currentContent: challengerContent,
      previousContent: referenceContent
    });

    const model = new NotebookDiffModel(data.base, data.diff);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new NotebookDiffWidget(model, this._renderMime);
  }

  protected async createMergeView(
    challengerContent: string,
    referenceContent: string,
    baseContent: string
  ): Promise<NotebookMergeWidget> {
    const data = await requestAPI<INbdimeMergeDiff>('diffnotebook', 'POST', {
      currentContent: challengerContent,
      previousContent: referenceContent,
      baseContent
    });

    const model = new NotebookMergeModel(data.base, data.merge_decisions);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new NotebookMergeWidget(model, this._renderMime);
  }

  /**
   * Handle `'activate-request'` messages.
   */
  protected onActivateRequest(msg: Message): void {
    if (this._scroller?.parent) {
      this._scroller.node.focus();
    }
  }

  /**
   * Display an error instead of the file diff
   *
   * @param error Error object
   */
  protected showError(error: Error): void {
    console.error(
      this._trans.__('Failed to load file diff.'),
      error,
      (error as any)?.traceback
    );

    while (this.widgets.length > 0) {
      this.widgets[0].dispose();
    }

    const msg = ((error.message || error) as string).replace('\n', '<br />');
    this.node.innerHTML = `<p class="jp-git-diff-error">
      <span>${this._trans.__('Error Loading Notebook Diff:')}</span>
      <span class="jp-git-diff-error-message">${msg}</span>
    </p>`;
  }

  protected _areUnchangedCellsHidden = false;
  protected _isReady: Promise<void>;
  protected _lastSerializeModel: INotebookContent | null = null;
  protected _model: Git.Diff.IModel;
  protected _nbdWidget: NotebookMergeWidget | NotebookDiffWidget;
  protected _renderMime: IRenderMimeRegistry;
  protected _scroller: Panel;
  protected _trans: TranslationBundle;
}

namespace Private {
  /**
   * Create a header widget for the diff view.
   */
  export function diffHeader(
    localLabel: string,
    remoteLabel: string,
    hasConflict: boolean,
    baseLabel?: string
  ): Widget {
    const bannerClass = hasConflict
      ? 'jp-git-merge-banner'
      : 'jp-git-diff-banner';
    const node = document.createElement('div');
    node.className = 'jp-git-diff-header';
    node.innerHTML = `<div class="${bannerClass}">
        <span>${localLabel}</span>
        <span class="jp-spacer"></span>
        ${
          hasConflict
            ? // Add extra space during notebook merge view
              `<span>${baseLabel}</span><span class="jp-spacer"></span>`
            : ''
        }
        <span>${remoteLabel}</span>
      </div>`;

    return new Widget({ node });
  }

  /**
   * Toggle whether to show or hide unchanged cells.
   *
   * This simply marks with a class, real work is done by CSS.
   */
  export function toggleShowUnchanged(
    root: Widget,
    hasConflict: boolean,
    show?: boolean
  ): void {
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
      markUnchangedRanges(root.node, hasConflict);
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
  export function markUnchangedRanges(
    root: HTMLElement,
    hasConflict: boolean
  ): void {
    const CELL_CLASS = hasConflict ? CELLMERGE_CLASS : CELLDIFF_CLASS;
    const UNCHANGED_CLASS = hasConflict
      ? UNCHANGED_MERGE_CLASS
      : UNCHANGED_DIFF_CLASS;
    const NOTEBOOK_CLASS = hasConflict
      ? '.jp-Notebook-merge'
      : '.jp-Notebook-diff';

    const children = root.querySelectorAll(`.${CELL_CLASS}`);
    let rangeStart = -1;
    for (let i = 0; i < children.length; ++i) {
      const child = children[i];
      if (!child.classList.contains(UNCHANGED_CLASS)) {
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
        const tag = root.querySelector(NOTEBOOK_CLASS) ?? root;
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
