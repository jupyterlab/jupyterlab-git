import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IDefaultFileBrowser } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import {
  ITranslator,
  nullTranslator,
  TranslationBundle
} from '@jupyterlab/translation';
import type { IGitPanelProps } from './components/GitPanel';
import type { GitExtension } from './model';
import { GitSidebar } from './sidebar';
import {
  GitSidebarSectionIDs,
  IGitExtension,
  IGitSidebar,
  PLUGIN_ID
} from './tokens';
import { GitPanelSection } from './widgets/GitPanelSection';

/**
 * Provides the registry of the Git sidebar sections.
 */
export const gitSidebarPlugin: JupyterFrontEndPlugin<IGitSidebar> = {
  id: '@jupyterlab/git:sidebar',
  description: 'Provides the registry of the Git sidebar sections.',
  provides: IGitSidebar,
  autoStart: true,
  activate: (): IGitSidebar => new GitSidebar()
};

/**
 * Adds the changes section to the Git sidebar.
 */
export const gitChangesSectionPlugin = createGitSectionPlugin({
  id: GitSidebarSectionIDs.changes,
  description: 'Adds the changes section to the Git sidebar.',
  rank: 10,
  title: trans => trans.__('Changes'),
  contentMode: 'changes',
  showNoRepositoryWarning: true
});

/**
 * Adds the history section to the Git sidebar.
 */
export const gitHistorySectionPlugin = createGitSectionPlugin({
  id: GitSidebarSectionIDs.history,
  description: 'Adds the history section to the Git sidebar.',
  rank: 20,
  title: trans => trans.__('History'),
  contentMode: 'history'
});

/**
 * Adds the branches and tags section to the Git sidebar.
 */
export const gitBranchesAndTagsSectionPlugin = createGitSectionPlugin({
  id: GitSidebarSectionIDs.branchesAndTags,
  description: 'Adds the branches and tags section to the Git sidebar.',
  rank: 30,
  title: trans => trans.__('Branches and Tags'),
  contentMode: 'branches'
});

interface IGitSectionPluginOptions {
  id: GitSidebarSectionIDs;
  description: string;
  rank: number;
  title: (trans: TranslationBundle) => string;
  contentMode: IGitPanelProps['contentMode'];
  showNoRepositoryWarning?: boolean;
}

function createGitSectionPlugin(
  options: IGitSectionPluginOptions
): JupyterFrontEndPlugin<void> {
  return {
    id: options.id,
    description: options.description,
    requires: [
      IGitSidebar,
      IGitExtension,
      IDefaultFileBrowser,
      ISettingRegistry
    ],
    optional: [ITranslator],
    autoStart: true,
    activate: async (
      app: JupyterFrontEnd,
      sidebar: IGitSidebar,
      model: IGitExtension,
      fileBrowser: IDefaultFileBrowser,
      settingRegistry: ISettingRegistry,
      translator: ITranslator | null
    ): Promise<void> => {
      const trans = (translator ?? nullTranslator).load('jupyterlab_git');
      let settings: ISettingRegistry.ISettings;
      try {
        settings = await settingRegistry.load(PLUGIN_ID);
      } catch (error) {
        console.error(
          trans.__(
            'Failed to load settings for the Git sidebar section %1.',
            options.id
          ),
          error
        );
        return;
      }

      const section = new GitPanelSection({
        commands: app.commands,
        filebrowser: fileBrowser.model,
        model: model as GitExtension,
        settings,
        trans,
        contentMode: options.contentMode,
        showNoRepositoryWarning: options.showNoRepositoryWarning
      });
      section.title.label = options.title(trans);
      sidebar.registerSection({
        id: options.id,
        rank: options.rank,
        widget: section
      });
    }
  };
}
