import { IThemeManager } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { IDiffContext } from './model';
import { NBDiff } from './NbDiff';
import { isMonacoSupported, PlainTextDiff } from './PlainTextDiff';

/**
 * A registry which maintains mappings of file extension to diff provider components.
 */
const DIFF_PROVIDER_REGISTRY = {
  '.ipynb': NBDiff
};

/**
 * Determines if a given file is supported for diffs.
 *
 * @param path the file path
 */
export function isDiffSupported(path: string): boolean {
  return (
    PathExt.extname(path).toLocaleLowerCase() in DIFF_PROVIDER_REGISTRY ||
    isMonacoSupported(path)
  );
}

export interface IDiffProps {
  path: string;
  topRepoPath: string;
  diffContext: IDiffContext;
}

/**
 * The parent diff component which maintains a registry of various diff providers.
 * Based on the extension of the file, it delegates to the relevant diff provider.
 */
export function Diff(props: IDiffProps) {
  const fileExtension = PathExt.extname(props.path).toLocaleLowerCase();

  if (fileExtension in DIFF_PROVIDER_REGISTRY) {
    const DiffProvider = DIFF_PROVIDER_REGISTRY[fileExtension];
    return <DiffProvider {...props} />;
  } else if (isMonacoSupported(props.path)) {
    // Workaround to access context in lifecycle methods, caveat with react 16.4
    // See https://stackoverflow.com/questions/53387299/reactjs-this-context-is-deprecated
    return (
      <ThemeManagerConsumer>
        {context => <PlainTextDiff props={props} themeManager={context} />}
      </ThemeManagerConsumer>
    );
  } else {
    console.log(`Diff is not supported for ${fileExtension} files`);
    return null;
  }
}

const renderMimeContext = React.createContext<IRenderMimeRegistry | null>(null);
export const RenderMimeProvider = renderMimeContext.Provider;
export const RenderMimeConsumer = renderMimeContext.Consumer;

const themeManagerContext = React.createContext<IThemeManager | null>(null);
export const ThemeManagerConsumer = themeManagerContext.Consumer;
export const ThemeManagerProvider = themeManagerContext.Provider;
