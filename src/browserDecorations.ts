import { Git, IGitExtension } from './tokens';
import * as fileStyle from './style/BrowserFile';
import { DirListing, FileBrowser } from '@jupyterlab/filebrowser';
import { Contents } from '@jupyterlab/services';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ITranslator } from '@jupyterlab/translation';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { STATUS_CODES } from './components/FileItem';

const fileTextStyles: Map<Git.StatusCode, string> = new Map([
  // note: the classes cannot repeat,
  // otherwise the assignments will be overwritten
  ['M', fileStyle.modified],
  ['A', fileStyle.added],
  ['D', fileStyle.deleted],
  ['R', fileStyle.renamed],
  ['C', fileStyle.copied],
  ['U', fileStyle.updated],
  ['?', fileStyle.untracked],
  ['!', fileStyle.ignored]
]);

const indicatorStyles: Map<Git.StatusCode, string> = new Map([
  ['M', fileStyle.modifiedIndicator],
  ['A', fileStyle.addedIndicator],
  ['D', fileStyle.deletedIndicator],
  ['R', fileStyle.renamedIndicator],
  ['C', fileStyle.copiedIndicator],
  ['U', fileStyle.updatedIndicator],
  ['?', fileStyle.untrackedIndicator],
  ['!', fileStyle.ignoredIndicator]
]);

const userFriendlyLetterCodes: Map<Git.StatusCode, string> = new Map([
  // conflicts with U for updated, but users are unlikely to see the updated status
  // and it will have a different background anyways
  ['?', 'U'],
  ['!', 'I']
]);

const HEADER_ITEM_CLASS = 'jp-DirListing-headerItem';
const HEADER_ITEM_TEXT_CLASS = 'jp-DirListing-headerItemText';

class GitListingRenderer extends DirListing.Renderer {
  constructor(
    protected gitExtension: IGitExtension,
    protected settings: ISettingRegistry.ISettings
  ) {
    super();
  }

  protected _setColor(node: HTMLElement, status_code: Git.StatusCode | null) {
    for (const [otherStatus, className] of fileTextStyles.entries()) {
      if (status_code === otherStatus) {
        node.classList.add(className);
      } else {
        node.classList.remove(className);
      }
    }
  }

  protected _findIndicatorSpan(node: HTMLElement): HTMLSpanElement | null {
    return node.querySelector('span.' + fileStyle.itemGitIndicator);
  }

  populateHeaderNode(node: HTMLElement, translator?: ITranslator): void {
    super.populateHeaderNode(node, translator);
    const div = document.createElement<'div'>('div');
    const text = document.createElement('span');
    div.className = HEADER_ITEM_CLASS;
    text.className = HEADER_ITEM_TEXT_CLASS;
    text.title = 'Git status';
    div.classList.add(fileStyle.headerGitIndicator);
    node.appendChild(div);
  }

  updateItemNode(
    node: HTMLElement,
    model: Contents.IModel,
    fileType?: DocumentRegistry.IFileType,
    translator?: ITranslator
  ) {
    super.updateItemNode(node, model, fileType, translator);
    const file = this.gitExtension.getFile(model.path);
    let status_code: Git.StatusCode = null;
    if (file) {
      status_code = file.status === 'staged' ? file.x : file.y;
    }

    if (this.settings.composite['colorFilesByStatus']) {
      this._setColor(node, status_code);
    } else {
      this._setColor(node, null);
    }

    if (this.settings.composite['showFileStatusIndicator']) {
      let span = this._findIndicatorSpan(node);
      let indicator: HTMLSpanElement;
      if (!span) {
        // always add indicator span, so that the items are nicely aligned
        span = document.createElement<'span'>('span');
        span.classList.add(fileStyle.itemGitIndicator);
        node.appendChild(span);
        indicator = document.createElement<'span'>('span');
        indicator.className = fileStyle.indicator;
        span.appendChild(indicator);
      } else {
        indicator = span.querySelector('.' + fileStyle.indicator);
      }
      if (indicator) {
        // reset the class list
        indicator.className = fileStyle.indicator;
      }
      if (status_code) {
        indicator.innerText = userFriendlyLetterCodes.has(status_code)
          ? userFriendlyLetterCodes.get(status_code)
          : status_code;
        indicator.classList.add(indicatorStyles.get(status_code));
        span.title = STATUS_CODES[status_code];
      } else if (indicator) {
        indicator.innerText = '';
      }
    } else {
      const span = this._findIndicatorSpan(node);
      if (span) {
        node.removeChild(span);
      }
    }
  }
}

export function substituteListingRenderer(
  extension: IGitExtension,
  fileBrowser: FileBrowser,
  settings: ISettingRegistry.ISettings
): void {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const listing: DirListing = fileBrowser._listing;
  const renderer = new GitListingRenderer(extension, settings);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  listing._renderer = renderer;

  // the problem is that the header node gets populated in the constructor of file browser
  const headerNode = listing.headerNode;
  // remove old content of header node
  headerNode.innerHTML = '';
  // populate it again, using our renderer
  renderer.populateHeaderNode(headerNode);
}
