import { ReactWidget } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/coreutils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import * as React from 'react';
import { GitPanel } from '../components/GitPanel';
import { GitExtension } from '../model';

/**
 * create the git plugin Widget.
 */
export const createGitWidget = (
  model: GitExtension,
  settings: ISettingRegistry.ISettings,
  renderMime: IRenderMimeRegistry,
  fileBrowserModel: FileBrowserModel
) =>
  ReactWidget.create(
    <GitPanel
      model={model}
      renderMime={renderMime}
      settings={settings}
      fileBrowserModel={fileBrowserModel}
    />
  );
