import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { createImageDiff } from './components/diff/ImageDiff';
import { IGitExtension } from './tokens';

/**
 * Registers the image diff provider on the git extension.
 */
export const imageDiffPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab/git:image-diff',
  description: 'Registers the diff provider for image files.',
  requires: [IGitExtension],
  autoStart: true,
  activate: (app: JupyterFrontEnd, gitExtension: IGitExtension): void => {
    gitExtension.registerDiffProvider(
      'ImageDiff',
      ['.jpeg', '.jpg', '.png'],
      createImageDiff
    );
  }
};
