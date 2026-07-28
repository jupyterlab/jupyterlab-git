import { ReactWidget } from '@jupyterlab/apputils';
import { FileBrowserModel } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import { PanelLayout, Widget } from '@lumino/widgets';
import * as React from 'react';
import {
  PanelWithToolbar,
  SidePanel,
  ToolbarButton,
  addIcon
} from '@jupyterlab/ui-components';
import { GitPanel } from '../components/GitPanel';
import { Toolbar } from '../components/Toolbar';
import { GitExtension } from '../model';
import {
  gitWidgetStyle,
  sectionBodyStyle,
  sectionStyle
} from '../style/GitWidgetStyle';
import { CommandIDs } from '../tokens';

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

    const topToolbar = ReactWidget.create(this._renderTopToolbar());
    topToolbar.addClass('jp-git-TopToolbar');
    (this.layout as PanelLayout).insertWidget(0, topToolbar);

    this.addWidget(
      this._createSection('Changes', this._createChangesSection())
    );
    this.addWidget(
      this._createSection('History', this._createHistorySection())
    );
    this.addWidget(
      this._createSection('Branches and Tags', this._createBranchesSection())
    );

    // The worktrees section is only shown when the repository has linked
    // worktrees.
    this._worktreesSection = this._createSection(
      'Worktrees',
      this._createWorktreesSection()
    );
    this._worktreesSection.toolbar.addItem(
      'new-worktree',
      new ToolbarButton({
        icon: addIcon,
        onClick: () => {
          void this._commands.execute(CommandIDs.gitAddWorktree);
        },
        tooltip: trans.__('Create a new worktree')
      })
    );
    this._updateWorktreesSection();
    model.worktreesChanged.connect(this._updateWorktreesSection, this);

    // Add refresh standby condition if this widget is hidden
    model.refreshStandbyCondition = (): boolean =>
      !this._settings.composite['refreshIfHidden'] && this.isHidden;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._model.worktreesChanged.disconnect(this._updateWorktreesSection, this);
    if (this._worktreesSection.parent === null) {
      this._worktreesSection.dispose();
    }
    super.dispose();
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

  private _createWorktreesSection(): React.ReactElement {
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
    const hasLinkedWorktrees = this._model.worktrees.some(
      worktree => !worktree.is_main
    );
    if (hasLinkedWorktrees && this._worktreesSection.parent === null) {
      this.addWidget(this._worktreesSection);
    } else if (!hasLinkedWorktrees && this._worktreesSection.parent !== null) {
      this._worktreesSection.parent = null;
    }
  }

  private _renderTopToolbar(): React.ReactElement {
    return (
      <Toolbar
        commands={this._commands}
        model={this._model}
        trans={this._gitTrans}
      />
    );
  }

  private _gitTrans: TranslationBundle;
  private _commands: CommandRegistry;
  private _fileBrowserModel: FileBrowserModel;
  private _model: GitExtension;
  private _settings: ISettingRegistry.ISettings;
  private _worktreesSection: PanelWithToolbar;
}
