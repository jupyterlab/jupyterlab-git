import {
  IToolbarWidgetRegistry,
  ReactWidget,
  setToolbar,
  UseSignal
} from '@jupyterlab/apputils';
import type {
  createToolbarFactory,
  IMovableSectionDestination,
  IMovableSectionSource,
  ISectionEntry
} from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TranslationBundle } from '@jupyterlab/translation';
import { SidePanel } from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import { ISignal, Signal } from '@lumino/signaling';
import { AccordionPanel, PanelLayout, Widget } from '@lumino/widgets';
import * as React from 'react';
import type { SubmoduleMenu as SubmoduleMenuComponent } from '../components/SubmoduleMenu';
import { gitWidgetStyle } from '../style/GitWidgetStyle';
import { panelToolbarClass, toolbarMenuWrapperClass } from '../style/Toolbar';
import { IGitExtension, IGitSidebar } from '../tokens';

/**
 * The Git extension's main side-bar widget.
 *
 * It displays the sections registered in the Git sidebar, and lets the
 * move-sections plugin move them to other panels and host sections moved in
 * from other panels.
 */
export class GitWidget
  extends SidePanel
  implements IMovableSectionSource, IMovableSectionDestination
{
  constructor(
    model: IGitExtension,
    settings: ISettingRegistry.ISettings,
    commands: CommandRegistry,
    trans: TranslationBundle,
    sidebar: IGitSidebar,
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
    this._model = model;
    this._settings = settings;
    this._sidebar = sidebar;
    this._toolbarRegistry = toolbarRegistry;
    this._toolbarFactory = toolbarFactory;

    this.toolbar.addClass(panelToolbarClass);
    this.toolbar.addClass('jp-git-PanelToolbar');
    model.repositoryChanged.connect(this._onRepositoryChanged, this);
    this.toolbar.setHidden(model.pathRepository === null);

    sidebar.changed.connect(this._syncSections, this);
    this._syncSections();

    // Put the model refresh on standby when no Git content is displayed,
    // including the sections moved to other panels.
    model.refreshStandbyCondition = (): boolean =>
      !this._settings.composite['refreshIfHidden'] &&
      this.isHidden &&
      ![...this._movedOutSections].some(widget => widget.isVisible);
  }

  /**
   * The accordion panel rendering the sections.
   */
  get accordionPanel(): AccordionPanel {
    return this.content as AccordionPanel;
  }

  /**
   * A signal emitted when a Git section is attached to the accordion.
   */
  get sectionAdded(): ISignal<this, ISectionEntry> {
    return this._sectionAdded;
  }

  /**
   * The sections moved in from other panels.
   */
  get sections(): ReadonlyArray<Widget> {
    const gitSections = new Set(
      this._sidebar.sections.map(section => section.widget)
    );
    return this.widgets.filter(widget => !gitSections.has(widget));
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
   * Return the Git sections displayed in the accordion.
   */
  getSections(): ReadonlyArray<ISectionEntry> {
    return this._sidebar.sections
      .map(section => this._getEntry(section.id, section.widget))
      .filter((entry): entry is ISectionEntry => entry !== null);
  }

  /**
   * Detach a Git section so that it can be moved to another panel.
   *
   * The section stays out of the accordion until `reinsertSection` is called.
   */
  removeSectionById(sectionId: string): Widget | null {
    const section = this._sidebar.sections.find(
      section => section.id === sectionId
    );
    if (!section || section.widget.parent !== this.content) {
      return null;
    }
    this._movedOutSections.add(section.widget);
    section.widget.parent = null;
    return section.widget;
  }

  /**
   * Attach back a Git section detached by `removeSectionById`.
   */
  reinsertSection(widget: Widget): void {
    this._movedOutSections.delete(widget);
    this._syncSections();
  }

  /**
   * Host a section moved in from another panel.
   */
  addSection(widget: Widget): void {
    this.addWidget(widget);
  }

  /**
   * Detach a section moved in from another panel.
   */
  removeSectionWidget(widget: Widget): void {
    if (widget.parent === this.content) {
      widget.parent = null;
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
    if (!this._toolbarPromise) {
      this._toolbarPromise = this._createToolbar();
      this._toolbarPromise.catch(error => {
        console.error('Fail to load the toolbar of GitWidget.', error);
      });
    }
    super.onBeforeShow(msg);
  }

  /**
   * Load the toolbar items and the submodule menu the first time the widget
   * is shown, so that their code stays out of the application startup.
   */
  private async _createToolbar(): Promise<void> {
    const [{ SubmoduleMenu }, { addToolbarItems }] = await Promise.all([
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
  }

  /**
   * Synchronize the accordion with the sections registered in the sidebar.
   */
  private _syncSections(): void {
    const sections = this._sidebar.sections;
    const registered = new Set(sections.map(section => section.widget));
    for (const widget of this._movedOutSections) {
      if (!registered.has(widget)) {
        this._movedOutSections.delete(widget);
      }
    }
    // Sections may share a signal, which is connected only once.
    const signals = new Set<ISignal<any, void>>();
    for (const { visibilityChanged } of sections) {
      if (visibilityChanged) {
        signals.add(visibilityChanged);
        visibilityChanged.connect(this._syncSections, this);
      }
    }
    for (const signal of this._visibilitySignals) {
      if (!signals.has(signal)) {
        signal.disconnect(this._syncSections, this);
      }
    }
    this._visibilitySignals = signals;

    const attached: IGitSidebar.ISection[] = [];
    let previous: Widget | null = null;
    for (const section of sections) {
      const { widget } = section;
      if (this._movedOutSections.has(widget)) {
        continue;
      }
      if (section.isVisible?.() ?? true) {
        if (widget.parent !== this.content) {
          // Insert after the preceding Git section, to leave the sections
          // moved in from other panels where they are.
          this._insertSection(
            previous ? this.widgets.indexOf(previous) + 1 : 0,
            widget
          );
          attached.push(section);
        }
        previous = widget;
      } else if (widget.parent === this.content) {
        widget.parent = null;
      }
    }

    // Emit once the accordion is settled, as a listener may move the section.
    for (const section of attached) {
      const entry = this._getEntry(section.id, section.widget);
      if (entry) {
        this._sectionAdded.emit(entry);
      }
    }
  }

  /**
   * Insert a section in the accordion.
   *
   * Lumino appends the nodes of an inserted widget to the accordion node, so
   * they are moved before the next section to keep the keyboard navigation in
   * the display order.
   */
  private _insertSection(index: number, widget: Widget): void {
    this.insertWidget(index, widget);
    const { node, titles } = this.accordionPanel;
    const next = titles[index + 1];
    if (next) {
      node.insertBefore(titles[index], next);
      node.insertBefore(widget.node, next);
    }
  }

  private _getEntry(id: string, widget: Widget): ISectionEntry | null {
    const index = this.widgets.indexOf(widget);
    if (index < 0) {
      return null;
    }
    return { id, titleNode: this.accordionPanel.titles[index], widget };
  }

  private _onRepositoryChanged(): void {
    this.toolbar.setHidden(this._model.pathRepository === null);
    if (this._submoduleMenu) {
      this.toggleSubmoduleMenu();
    }
  }

  private _gitTrans: TranslationBundle;
  private _commands: CommandRegistry;
  private _model: IGitExtension;
  private _settings: ISettingRegistry.ISettings;
  private _sidebar: IGitSidebar;
  private _toolbarRegistry: IToolbarWidgetRegistry | null;
  private _toolbarFactory: ReturnType<typeof createToolbarFactory> | null;
  private _submoduleMenuComponent: typeof SubmoduleMenuComponent | null = null;
  private _submoduleMenu: Widget | null = null;
  private _submoduleMenuShownChanged = new Signal<GitWidget, boolean>(this);
  private _toolbarPromise: Promise<void> | null = null;
  private _movedOutSections = new Set<Widget>();
  private _visibilitySignals = new Set<ISignal<any, void>>();
  private _sectionAdded = new Signal<this, ISectionEntry>(this);
}
