import * as React from 'react';
import { IDiffContext } from './model';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { NBDiff } from './NbDiff';
import { PathExt } from '@jupyterlab/coreutils';

/**
 * A registry which maintains mappings of file extension to diff provider components.
 */
const DIFF_PROVIDER_REGISTRY = {
  '.ipynb': NBDiff
};

/**
 * Determines if a given file is supported for diffs.
 *
 * This will be removed when "Plaintext" diffs are supported since that will be used
 * for cases where there is not a dedicated diff provider.
 *
 * @param path the file path
 */
export function isDiffSupported(path: string): boolean {
  return PathExt.extname(path).toLocaleLowerCase() in DIFF_PROVIDER_REGISTRY;
}

export interface IDiffProps {
  renderMime: IRenderMimeRegistry;
  path: string;
  diffContext: IDiffContext;
}

/**
 * The parent diff component which maintains a registry of various diff providers.
 * Based on the extension of the file, it delegates to the relevant diff provider.
 */
export class Diff extends React.Component<IDiffProps, {}> {
  constructor(props) {
    super(props);
  }

  render() {
    const fileExtension = PathExt.extname(this.props.path).toLocaleLowerCase();

    if (fileExtension in DIFF_PROVIDER_REGISTRY) {
      const DiffProvider = DIFF_PROVIDER_REGISTRY[fileExtension];
      return <DiffProvider {...this.props} />;
    } else {
      // This will be removed and delegated to a "Plaintext" diff provider for
      // cases where the file extension does not have a dedicated diff provider.
      console.log(`Diff is not supported for ${fileExtension} files`);
      return null;
    }
  }
}
