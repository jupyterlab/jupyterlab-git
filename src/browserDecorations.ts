import { Git, IGitExtension } from './tokens';
import * as fileStyle from './style/BrowserFile';
import { DirListing, FileBrowser } from '@jupyterlab/filebrowser';
import { Contents } from '@jupyterlab/services';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ITranslator } from '@jupyterlab/translation';

const statusStyles: Map<Git.StatusCode, string> = new Map([
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

class GitListingRenderer extends DirListing.Renderer {
  constructor(private gitExtension: IGitExtension) {
    super();
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

    for (const [otherStatus, className] of statusStyles.entries()) {
      if (status_code === otherStatus) {
        node.classList.add(className);
      } else {
        node.classList.remove(className);
      }
    }
  }
}

export function substituteListingRenderer(
  extension: IGitExtension,
  fileBrowser: FileBrowser
): void {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const listing: DirListing = fileBrowser._listing;
  const renderer = new GitListingRenderer(extension);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  listing._renderer = renderer;
}
