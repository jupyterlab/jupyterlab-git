import { ReactWidget } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import { PanelLayout, Widget } from '@lumino/widgets';
import * as React from 'react';
import { PanelWithToolbar, SidePanel } from '@jupyterlab/ui-components';
import type { GitPanel as GitPanelComponent } from '../components/GitPanel';
import { GitExtension } from '../model';
import {
  gitWidgetStyle,
  sectionBodyStyle,
  sectionStyle
} from '../style/GitWidgetStyle';

/**
 * The Git extension's main side-bar widget.
 */
export class GitWidget extends SidePanel {
  constructor(
    model: GitExtension,
    settings: ISettingRegistry.ISettings,
    commands: CommandRegistry,
    fileBrowserModel: FileBrowserModel,
    trans: TranslationBundle,
    options?: Widget.IOptions
  ) {
    super({
      ...(options as any)
    } as SidePanel.IOptions);
    this.node.id = 'GitSession-root';
    this.addClass(gitWidgetStyle);

    this._gitTrans = trans;
    this._commands = commands;
    this._fileBrowserModel = fileBrowserModel;
    this._model = model;
    this._settings = settings;

    // Add refresh standby condition if this widget is hidden
    model.refreshStandbyCondition = (): boolean =>
      !this._settings.composite['refreshIfHidden'] && this.isHidden;
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  onBeforeShow(msg: Message): void {
    // Trigger refresh when the widget is displayed
    this._model.refresh().catch(error => {
      console.error('Fail to refresh model when displaying GitWidget.', error);
    });
    if (!this._contentPromise) {
      this._contentPromise = this._createContent();
      this._contentPromise.catch(error => {
        console.error('Fail to load the content of GitWidget.', error);
      });
    }
    super.onBeforeShow(msg);
  }

  /**
   * Load the toolbar and the sections the first time the widget is shown,
   * so that their code stays out of the application startup.
   */
  private async _createContent(): Promise<void> {
    const [{ GitPanel }, { Toolbar }] = await Promise.all([
      import('../components/GitPanel'),
      import('../components/Toolbar')
    ]);
    if (this.isDisposed) {
      return;
    }
    const topToolbar = ReactWidget.create(
      <Toolbar
        commands={this._commands}
        model={this._model}
        trans={this._gitTrans}
      />
    );
    topToolbar.addClass('jp-git-TopToolbar');
    (this.layout as PanelLayout).insertWidget(0, topToolbar);

    this.addWidget(
      this._createSection('Changes', this._createChangesSection(GitPanel))
    );
    this.addWidget(
      this._createSection('History', this._createHistorySection(GitPanel))
    );
    this.addWidget(
      this._createSection(
        'Branches and Tags',
        this._createBranchesSection(GitPanel)
      )
    );
  }

  private _createSection(
    title: string,
    body: React.ReactElement
  ): PanelWithToolbar {
    const section = new PanelWithToolbar();
    section.title.label = title;
    section.addClass(sectionStyle);
    const reactWidget = ReactWidget.create(body);
    reactWidget.addClass(sectionBodyStyle);
    section.addWidget(reactWidget);
    return section;
  }

  private _createChangesSection(
    GitPanel: typeof GitPanelComponent
  ): React.ReactElement {
    return (
      <GitPanel
        commands={this._commands}
        filebrowser={this._fileBrowserModel}
        model={this._model}
        settings={this._settings}
        trans={this._gitTrans}
        contentMode="changes"
        showNoRepositoryWarning
      />
    );
  }

  private _createHistorySection(
    GitPanel: typeof GitPanelComponent
  ): React.ReactElement {
    return (
      <GitPanel
        commands={this._commands}
        filebrowser={this._fileBrowserModel}
        model={this._model}
        settings={this._settings}
        trans={this._gitTrans}
        contentMode="history"
      />
    );
  }

  private _createBranchesSection(
    GitPanel: typeof GitPanelComponent
  ): React.ReactElement {
    return (
      <GitPanel
        commands={this._commands}
        filebrowser={this._fileBrowserModel}
        model={this._model}
        settings={this._settings}
        trans={this._gitTrans}
        contentMode="branches"
      />
    );
  }

  private _gitTrans: TranslationBundle;
  private _commands: CommandRegistry;
  private _fileBrowserModel: FileBrowserModel;
  private _model: GitExtension;
  private _settings: ISettingRegistry.ISettings;
  private _contentPromise: Promise<void> | null = null;
}
