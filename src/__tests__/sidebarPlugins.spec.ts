import { JupyterFrontEnd } from '@jupyterlab/application';
import { IDefaultFileBrowser } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { CommandRegistry } from '@lumino/commands';
import 'jest';
import plugins from '../index';
import { GitSidebar } from '../sidebar';
import {
  gitBranchesAndTagsSectionPlugin,
  gitChangesSectionPlugin,
  gitHistorySectionPlugin,
  gitSidebarPlugin
} from '../sidebarPlugins';
import { GitSidebarSectionIDs, IGitExtension, IGitSidebar } from '../tokens';
import { GitPanelSection } from '../widgets/GitPanelSection';

describe('Git sidebar plugins', () => {
  const app = { commands: new CommandRegistry() } as JupyterFrontEnd;
  const fileBrowser = { model: {} } as IDefaultFileBrowser;
  const model = {} as IGitExtension;
  let settingRegistry: ISettingRegistry;
  let sidebar: GitSidebar;

  beforeEach(() => {
    settingRegistry = {
      load: jest.fn().mockResolvedValue({})
    } as unknown as ISettingRegistry;
    sidebar = new GitSidebar();
  });

  afterEach(() => {
    sidebar.dispose();
  });

  it('exports each built-in section as an independent plugin', () => {
    expect(plugins.map(plugin => plugin.id)).toEqual(
      expect.arrayContaining([
        gitSidebarPlugin.id,
        GitSidebarSectionIDs.changes,
        GitSidebarSectionIDs.history,
        GitSidebarSectionIDs.branchesAndTags
      ])
    );
    expect(gitSidebarPlugin.provides).toBe(IGitSidebar);
  });

  it('registers the built-in sections in their expected order', async () => {
    for (const plugin of [
      gitBranchesAndTagsSectionPlugin,
      gitHistorySectionPlugin,
      gitChangesSectionPlugin
    ]) {
      await plugin.activate(
        app,
        sidebar,
        model,
        fileBrowser,
        settingRegistry,
        null
      );
    }

    expect(sidebar.sections.map(section => section.id)).toEqual([
      GitSidebarSectionIDs.changes,
      GitSidebarSectionIDs.history,
      GitSidebarSectionIDs.branchesAndTags
    ]);
    expect(sidebar.sections.map(section => section.widget.title.label)).toEqual(
      ['Changes', 'History', 'Branches and Tags']
    );
    sidebar.sections.forEach(section => {
      expect(section.widget).toBeInstanceOf(GitPanelSection);
    });
  });

  it('skips the section if the settings fail to load', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    (settingRegistry.load as jest.Mock).mockRejectedValue(new Error('failed'));

    await gitChangesSectionPlugin.activate(
      app,
      sidebar,
      model,
      fileBrowser,
      settingRegistry,
      null
    );

    expect(sidebar.sections).toHaveLength(0);
    consoleError.mockRestore();
  });
});
