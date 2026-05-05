import { ReactWidget } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import {
  AccordionPanel,
  PanelLayout,
  Widget
} from '@lumino/widgets';
import * as React from 'react';
import { PanelWithToolbar, SidePanel } from '@jupyterlab/ui-components';
import { GitPanel } from '../components/GitPanel';
import { Toolbar } from '../components/Toolbar';
import { GitExtension } from '../model';
import {
  gitWidgetStyle,
  sectionBodyStyle,
  sectionStyle
} from '../style/GitWidgetStyle';

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
      ...(options as any)
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

    this.addWidget(this._createSection('Changes', this._createChangesSection()));
    this.addWidget(this._createSection('History', this._createHistorySection()));
    this.addWidget(
      this._createSection('Branches and Tags', this._createBranchesSection())
    );

    // Branches & Tags is reference material — collapse it by default.
    (this.content as AccordionPanel).collapse(2);

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
}
