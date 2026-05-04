import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { createNotebookDiff } from './components/diff/NotebookDiff';
import { Git, IGitExtension } from './tokens';

/**
 * Registers the nbdime-backed notebook diff provider on the git extension.
 */
export const notebookDiffPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab/git:notebook-diff',
  description:
    'Registers the nbdime-backed diff provider for Jupyter notebook files.',
  requires: [IGitExtension, IRenderMimeRegistry],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    gitExtension: IGitExtension,
    renderMime: IRenderMimeRegistry
  ): void => {
    gitExtension.registerDiffProvider(
      'Nbdime',
      ['.ipynb'],
      (options: Git.Diff.IFactoryOptions) =>
        createNotebookDiff({ ...options, renderMime })
    );
  }
};
