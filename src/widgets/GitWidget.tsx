import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import { ISignal, Signal } from '@lumino/signaling';
import { PanelLayout, Widget } from '@lumino/widgets';
import * as React from 'react';
import { PanelWithToolbar, SidePanel } from '@jupyterlab/ui-components';
import { GitPanel } from '../components/GitPanel';
import { SubmoduleMenu } from '../components/SubmoduleMenu';
import { GitExtension } from '../model';
import {
  gitWidgetStyle,
  sectionBodyStyle,
  sectionStyle
} from '../style/GitWidgetStyle';
import { panelToolbarClass, toolbarMenuWrapperClass } from '../style/Toolbar';

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

    this.toolbar.addClass(panelToolbarClass);
    this.toolbar.addClass('jp-git-PanelToolbar');
    model.repositoryChanged.connect(this._onRepositoryChanged, this);
    this.toolbar.setHidden(model.pathRepository === null);

    this.addWidget(
      this._createSection('Changes', this._createChangesSection())
    );
    this.addWidget(
      this._createSection('History', this._createHistorySection())
    );
    this.addWidget(
      this._createSection('Branches and Tags', this._createBranchesSection())
    );

    // Add refresh standby condition if this widget is hidden
    model.refreshStandbyCondition = (): boolean =>
      !this._settings.composite['refreshIfHidden'] && this.isHidden;
  }

  /**
   * Whether the submodule menu is currently shown below the toolbar.
   */
  get submoduleMenuShown(): boolean {
    return this._submoduleMenu !== null;
  }

  /**
   * A signal emitted when the submodule menu is shown or hidden.
   */
  get submoduleMenuShownChanged(): ISignal<GitWidget, boolean> {
    return this._submoduleMenuShownChanged;
  }

  /**
   * Show or hide the submodule menu below the panel toolbar.
   */
  toggleSubmoduleMenu(): void {
    if (this._submoduleMenu) {
      this._submoduleMenu.dispose();
      this._submoduleMenu = null;
      this._submoduleMenuShownChanged.emit(false);
    } else {
      const menu = ReactWidget.create(
        <UseSignal signal={this._model.submodulesChanged}>
          {() => (
            <SubmoduleMenu
              model={this._model}
              submodules={this._model.submodules}
              trans={this._gitTrans}
            />
          )}
        </UseSignal>
      );
      menu.addClass(toolbarMenuWrapperClass);
      const layout = this.layout as PanelLayout;
      layout.insertWidget(layout.widgets.indexOf(this.content), menu);
      this._submoduleMenu = menu;
      this._submoduleMenuShownChanged.emit(true);
    }
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  onBeforeShow(msg: Message): void {
    // Trigger refresh when the widget is displayed
    this._model.refresh().catch(error => {
      console.error('Fail to refresh model when displaying GitWidget.', error);
    });
    super.onBeforeShow(msg);
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

  private _createChangesSection(): React.ReactElement {
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

  private _createHistorySection(): React.ReactElement {
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

  private _createBranchesSection(): React.ReactElement {
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

  private _onRepositoryChanged(): void {
    this.toolbar.setHidden(this._model.pathRepository === null);
    if (this._submoduleMenu) {
      this.toggleSubmoduleMenu();
    }
  }

  private _gitTrans: TranslationBundle;
  private _commands: CommandRegistry;
  private _fileBrowserModel: FileBrowserModel;
  private _model: GitExtension;
  private _settings: ISettingRegistry.ISettings;
  private _submoduleMenu: Widget | null = null;
  private _submoduleMenuShownChanged = new Signal<GitWidget, boolean>(this);
}
