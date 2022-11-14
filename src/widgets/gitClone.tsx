import {
  ReactWidget,
  ToolbarButtonComponent,
  UseSignal
} from '@jupyterlab/apputils';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { FileBrowser } from '@jupyterlab/filebrowser';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import * as React from 'react';
import { cloneIcon } from '../style/icons';
import { CommandIDs, IGitExtension } from '../tokens';

export function addCloneButton(
  model: IGitExtension,
  filebrowser: FileBrowser,
  commands: CommandRegistry,
  trans: TranslationBundle
): void {
  filebrowser.toolbar.addItem(
    'gitClone',
    ReactWidget.create(
      <UseSignal
        signal={model.repositoryChanged}
        initialArgs={{
          name: 'pathRepository',
          oldValue: null,
          newValue: model.pathRepository
        }}
      >
        {(_, change: IChangedArgs<string | null>) => (
          <ToolbarButtonComponent
            enabled={change.newValue === null}
            icon={cloneIcon}
            onClick={() => {
              commands.execute(CommandIDs.gitClone);
            }}
            tooltip={trans.__('Git Clone')}
          />
        )}
      </UseSignal>
    )
  );
}
