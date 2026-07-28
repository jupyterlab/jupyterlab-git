import {
  IToolbarWidgetRegistry,
  ReactWidget,
  setToolbar,
  UseSignal
} from '@jupyterlab/apputils';
import type { createToolbarFactory } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import { ISignal, Signal } from '@lumino/signaling';
import { PanelLayout, Widget } from '@lumino/widgets';
import * as React from 'react';
import { PanelWithToolbar, SidePanel } from '@jupyterlab/ui-components';
import type { GitPanel as GitPanelComponent } from '../components/GitPanel';
import type { SubmoduleMenu as SubmoduleMenuComponent } from '../components/SubmoduleMenu';
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
    toolbarRegistry: IToolbarWidgetRegistry | null,
    toolbarFactory: ReturnType<typeof createToolbarFactory> | null,
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
    this._toolbarRegistry = toolbarRegistry;
    this._toolbarFactory = toolbarFactory;

    this.toolbar.addClass(panelToolbarClass);
    this.toolbar.addClass('jp-git-PanelToolbar');
    model.repositoryChanged.connect(this._onRepositoryChanged, this);
    this.toolbar.setHidden(model.pathRepository === null);

    // Add refresh standby condition if this widget is hidden
    model.refreshStandbyCondition = (): boolean =>
      !this._settings.composite['refreshIfHidden'] && this.isHidden;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._model.worktreesChanged.disconnect(this._updateWorktreesSection, this);
    if (this._worktreesSection?.parent === null) {
      this._worktreesSection.dispose();
    }
    super.dispose();
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
    } else if (this._submoduleMenuComponent) {
      const SubmoduleMenu = this._submoduleMenuComponent;
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
    if (!this._contentPromise) {
      this._contentPromise = this._createContent();
      this._contentPromise.catch(error => {
        console.error('Fail to load the content of GitWidget.', error);
      });
    }
    super.onBeforeShow(msg);
  }

  /**
   * Load the toolbar items and the sections the first time the widget is
   * shown, so that their code stays out of the application startup.
   */
  private async _createContent(): Promise<void> {
    const [{ GitPanel }, { SubmoduleMenu }, { addToolbarItems }] =
      await Promise.all([
        import('../components/GitPanel'),
        import('../components/SubmoduleMenu'),
        import('../components/Toolbar')
      ]);
    if (this.isDisposed) {
      return;
    }
    this._submoduleMenuComponent = SubmoduleMenu;

    // The factory names must match the `jupyter.lab.toolbars` entries in the
    // schema and user settings, and must be registered before `setToolbar` runs.
    if (this._toolbarRegistry && this._toolbarFactory) {
      addToolbarItems(
        this._toolbarRegistry,
        this._model,
        this._commands,
        this._gitTrans
      );
      setToolbar(this, this._toolbarFactory);
    }

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

    // The worktrees section is only shown when the repository has linked
    // worktrees.
    this._worktreesSection = this._createSection(
      'Worktrees',
      this._createWorktreesSection(GitPanel)
    );
    this._updateWorktreesSection();
    this._model.worktreesChanged.connect(this._updateWorktreesSection, this);
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

  private _createWorktreesSection(
    GitPanel: typeof GitPanelComponent
  ): React.ReactElement {
    return (
      <GitPanel
        commands={this._commands}
        filebrowser={this._fileBrowserModel}
        model={this._model}
        settings={this._settings}
        trans={this._gitTrans}
        contentMode="worktrees"
      />
    );
  }

  /**
   * Attach or detach the worktrees section depending on whether the current
   * repository has linked worktrees.
   */
  private _updateWorktreesSection(): void {
    const section = this._worktreesSection;
    if (!section) {
      return;
    }
    const hasLinkedWorktrees = this._model.worktrees.some(
      worktree => !worktree.is_main
    );
    if (hasLinkedWorktrees && section.parent === null) {
      this.addWidget(section);
    } else if (!hasLinkedWorktrees && section.parent !== null) {
      section.parent = null;
    }
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
  private _toolbarRegistry: IToolbarWidgetRegistry | null;
  private _toolbarFactory: ReturnType<typeof createToolbarFactory> | null;
  private _submoduleMenuComponent: typeof SubmoduleMenuComponent | null = null;
  private _submoduleMenu: Widget | null = null;
  private _submoduleMenuShownChanged = new Signal<GitWidget, boolean>(this);
  private _worktreesSection: PanelWithToolbar | null = null;
  private _contentPromise: Promise<void> | null = null;
}
