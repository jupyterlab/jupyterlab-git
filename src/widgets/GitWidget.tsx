import { ReactWidget } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import {
  AccordionLayout,
  AccordionPanel,
  PanelLayout,
  Title,
  Widget
} from '@lumino/widgets';
import * as React from 'react';
import { PanelWithToolbar, SidePanel } from '@jupyterlab/ui-components';
// `AccordionToolbar` is part of `@jupyterlab/ui-components` but is not
// re-exported from the package's barrel index in the version we depend on,
// so we import it from its deep path.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { AccordionToolbar } from '@jupyterlab/ui-components/lib/components/accordiontoolbar';
import { GitPanel } from '../components/GitPanel';
import { Toolbar } from '../components/Toolbar';
import { GitExtension } from '../model';
import { sectionCountBadgeClass } from '../style/AccordionRenderer';
import {
  gitWidgetStyle,
  sectionBodyStyle,
  sectionStyle
} from '../style/GitWidgetStyle';

/**
 * Custom AccordionPanel renderer that draws a count badge in the section
 * title when `widget.title.dataset.count` is set. Sections that need a count
 * (e.g. Changes, History) update their `dataset` and trigger
 * `AccordionLayout.updateTitle(...)` to re-render the title node.
 *
 * The badge is appended directly to the title node so its
 * `margin-left: auto` rule pushes it to the right edge. We deliberately do
 * NOT mount it inside the section's `.jp-AccordionPanel-toolbar` because
 * that slot is a Fluent `<jp-toolbar>` web component whose
 * `::part(positioning-region)` centers default-slotted children — putting
 * the badge there would render it in the middle of the row.
 *
 * Empty toolbar slots are hidden in `gitWidgetStyle` so they do not consume
 * the right-side `auto` margin and shift the badge.
 */
class GitAccordionRenderer extends AccordionToolbar.Renderer {
  createSectionTitle(data: Title<Widget>): HTMLElement {
    const handle = super.createSectionTitle(data);
    const count = data.dataset?.count;
    if (count) {
      const badge = document.createElement('span');
      badge.className = sectionCountBadgeClass;
      badge.textContent = count;
      handle.appendChild(badge);
    }
    return handle;
  }
}

/**
 * The Git extension's main side-bar widget. Built on top of JupyterLab's
 * `SidePanel` so that the visual chrome (accordion sections, per-section
 * toolbars, focus styles) matches the rest of the application.
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
      ...(options as any),
      renderer: new GitAccordionRenderer()
    } as SidePanel.IOptions);
    this.node.id = 'GitSession-root';
    this.addClass(gitWidgetStyle);

    this._gitTrans = trans;
    this._commands = commands;
    this._fileBrowserModel = fileBrowserModel;
    this._model = model;
    this._settings = settings;

    // Mount the React-rendered toolbar (repo + branch info row + pull / push
    // / refresh action row) at the very top of the SidePanel layout. We
    // intentionally do NOT use `this.header` because `.jp-SidePanel-header`
    // imposes `text-transform: uppercase` and a smaller `--jp-ui-font-size0`
    // on its descendants — both of which would mangle the repository / branch
    // names. Inserting directly into the panel layout keeps the toolbar's
    // own styling intact and visually separate from the accordion sections.
    const topToolbar = ReactWidget.create(this._renderTopToolbar());
    topToolbar.addClass('jp-git-TopToolbar');
    (this.layout as PanelLayout).insertWidget(0, topToolbar);

    this._changesSection = this._createSection(
      'Changes',
      this._createChangesSection()
    );
    this.addWidget(this._changesSection);

    this._historySection = this._createSection(
      'History',
      this._createHistorySection()
    );
    this.addWidget(this._historySection);

    this._branchesSection = this._createSection(
      'Branches and Tags',
      this._createBranchesSection()
    );
    this.addWidget(this._branchesSection);

    // Branches & Tags is reference material — collapse it by default.
    (this.content as AccordionPanel).collapse(2);

    // Wire up the Changes count badge. The count reflects the total number
    // of files reported by the model's status, which covers staged, changed
    // and untracked files. The badge is rendered by the custom accordion
    // renderer; we just keep `widget.title.dataset.count` up to date.
    model.statusChanged.connect(() => {
      this._setSectionCount(this._changesSection, model.status.files.length);
    }, this);

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
    super.onBeforeShow(msg);
  }

  /**
   * Expand the branches and tags section.
   */
  expandBranchesSection(): void {
    (this.content as AccordionPanel).expand(2);
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

  /**
   * Update the count badge displayed in a section's title bar.
   */
  private _setSectionCount(section: Widget, count: number): void {
    const layout = (this.content as AccordionPanel).layout as AccordionLayout;
    const index = (this.content as AccordionPanel).widgets.indexOf(section);
    if (index < 0) {
      return;
    }
    const dataset = { ...(section.title.dataset ?? {}) };
    if (count > 0) {
      dataset.count = String(count);
    } else {
      delete dataset.count;
    }
    section.title.dataset = dataset;
    layout.updateTitle(index, section);
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
        showToolbar={false}
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
        showToolbar={false}
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
        showToolbar={false}
      />
    );
  }

  private _renderTopToolbar(): React.ReactElement {
    return (
      <Toolbar
        commands={this._commands}
        model={this._model}
        onExpandBranches={() => this.expandBranchesSection()}
        trans={this._gitTrans}
      />
    );
  }

  private _gitTrans: TranslationBundle;
  private _commands: CommandRegistry;
  private _fileBrowserModel: FileBrowserModel;
  private _model: GitExtension;
  private _settings: ISettingRegistry.ISettings;
  private _changesSection: PanelWithToolbar;
  private _historySection: PanelWithToolbar;
  private _branchesSection: PanelWithToolbar;
}
