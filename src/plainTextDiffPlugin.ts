import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';
import { createPlainTextDiff } from './components/diff/PlainTextDiff';
import { Git, IGitExtension } from './tokens';

/**
 * Registers the fallback text diff provider on the git extension, used for
 * any text file that does not have a more specific provider.
 */
export const plainTextDiffPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab/git:plain-text-diff',
  description:
    'Registers the fallback CodeMirror-based diff provider for text files.',
  requires: [IGitExtension, IEditorServices, IEditorLanguageRegistry],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    gitExtension: IGitExtension,
    editorServices: IEditorServices,
    languageRegistry: IEditorLanguageRegistry
  ): void => {
    const editorFactory = editorServices.factoryService;
    gitExtension.registerFallbackDiffProvider(
      (options: Git.Diff.IFactoryOptions) =>
        createPlainTextDiff({
          ...options,
          editorFactory: editorFactory.newInlineEditor.bind(editorFactory),
          languageRegistry
        })
    );
  }
};
