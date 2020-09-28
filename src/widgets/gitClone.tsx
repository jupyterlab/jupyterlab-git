import {
  ReactWidget,
  ToolbarButtonComponent,
  UseSignal
} from '@jupyterlab/apputils';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { FileBrowser } from '@jupyterlab/filebrowser';
import { CommandRegistry } from '@phosphor/commands';
import * as React from 'react';
import { CommandIDs } from '../commandsAndMenu';
import { cloneButtonStyle } from '../style/CloneButton';
import { IGitExtension } from '../tokens';

export function addCloneButton(
  model: IGitExtension,
  filebrowser: FileBrowser,
  commands: CommandRegistry
) {
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
            iconClassName={`${cloneButtonStyle} jp-Icon jp-Icon-16`}
            onClick={async () => {
              commands.execute(CommandIDs.gitClone);
            }}
            tooltip={'Git Clone'}
          />
        )}
      </UseSignal>
    )
  );
}
