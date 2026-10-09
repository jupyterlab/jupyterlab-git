import type { ISectionEntry } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { nullTranslator } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { Signal } from '@lumino/signaling';
import { AccordionPanel, Widget } from '@lumino/widgets';
import 'jest';
import { GitSidebar } from '../sidebar';
import { IGitExtension, IGitSidebar } from '../tokens';
import { GitWidget } from '../widgets/GitWidget';

describe('GitWidget', () => {
  let model: IGitExtension;
  let settings: ISettingRegistry.ISettings;
  let sidebar: GitSidebar;
  let widget: GitWidget;

  beforeEach(() => {
    model = {
      pathRepository: null,
      repositoryChanged: new Signal({}),
      refresh: jest.fn().mockResolvedValue(undefined),
      refreshStandbyCondition: () => false
    } as unknown as IGitExtension;
    settings = {
      composite: { refreshIfHidden: false }
    } as unknown as ISettingRegistry.ISettings;
    sidebar = new GitSidebar();
  });

  afterEach(() => {
    widget?.dispose();
    sidebar.dispose();
  });

  function createGitWidget(): GitWidget {
    return new GitWidget(
      model,
      settings,
      new CommandRegistry(),
      nullTranslator.load('jupyterlab_git'),
      sidebar,
      null,
      null
    );
  }

  function createSection(id: string, rank?: number): IGitSidebar.ISection {
    const widget = new Widget();
    widget.title.label = id;
    return { id, rank, widget };
  }

  function labels(): string[] {
    return widget.widgets.map(section => section.title.label);
  }

  describe('sections', () => {
    it('renders the registered sections in rank order', () => {
      sidebar.registerSection(createSection('history', 20));
      sidebar.registerSection(createSection('changes', 10));

      widget = createGitWidget();

      expect(labels()).toEqual(['changes', 'history']);
    });

    it('adds and removes sections after the widget is created', () => {
      widget = createGitWidget();
      const section = createSection('section');

      const registration = sidebar.registerSection(section);
      expect(widget.widgets).toEqual([section.widget]);

      registration.dispose();
      expect(widget.widgets).toHaveLength(0);
      expect(section.widget.isDisposed).toBe(true);
    });

    it('responds to section visibility changes', () => {
      const visibilityChanged = new Signal<object, void>({});
      const section = createSection('conditional');
      let isVisible = false;
      sidebar.registerSection({
        ...section,
        isVisible: () => isVisible,
        visibilityChanged
      });
      widget = createGitWidget();
      expect(widget.widgets).toHaveLength(0);

      isVisible = true;
      visibilityChanged.emit();
      expect(widget.widgets).toEqual([section.widget]);

      isVisible = false;
      visibilityChanged.emit();
      expect(widget.widgets).toHaveLength(0);
    });

    it('follows a visibility signal shared by several sections', () => {
      const visibilityChanged = new Signal<object, void>({});
      let isVisible = true;
      const first = sidebar.registerSection({
        ...createSection('first', 10),
        isVisible: () => isVisible,
        visibilityChanged
      });
      sidebar.registerSection({
        ...createSection('second', 20),
        isVisible: () => isVisible,
        visibilityChanged
      });
      widget = createGitWidget();

      first.dispose();
      isVisible = false;
      visibilityChanged.emit();
      expect(widget.widgets).toHaveLength(0);
    });

    it('leaves the sections moved in from other panels in place', () => {
      const visibilityChanged = new Signal<object, void>({});
      let isVisible = true;
      sidebar.registerSection(createSection('changes', 10));
      sidebar.registerSection({
        ...createSection('history', 20),
        isVisible: () => isVisible,
        visibilityChanged
      });
      widget = createGitWidget();
      const foreign = new Widget();
      foreign.title.label = 'foreign';
      widget.addSection(foreign);
      widget.accordionPanel.insertWidget(0, foreign);

      sidebar.registerSection(createSection('branches', 30));
      expect(labels()).toEqual(['foreign', 'changes', 'history', 'branches']);

      isVisible = false;
      visibilityChanged.emit();
      isVisible = true;
      visibilityChanged.emit();
      expect(labels()).toEqual(['foreign', 'changes', 'history', 'branches']);
    });
  });

  describe('movable sections', () => {
    it('exposes the accordion panel rendering the sections', () => {
      widget = createGitWidget();

      expect(widget.accordionPanel).toBeInstanceOf(AccordionPanel);
      expect(widget.accordionPanel.widgets).toEqual(widget.widgets);
    });

    it('lists the displayed sections with their title nodes', () => {
      sidebar.registerSection(createSection('changes', 10));
      sidebar.registerSection(createSection('history', 20));
      widget = createGitWidget();
      widget.addSection(new Widget());

      const entries = widget.getSections();

      expect(entries.map(entry => entry.id)).toEqual(['changes', 'history']);
      entries.forEach((entry, index) => {
        expect(entry.widget).toBe(widget.widgets[index]);
        expect(entry.titleNode).toBe(widget.accordionPanel.titles[index]);
      });
    });

    it('emits sectionAdded each time a section is attached', () => {
      widget = createGitWidget();
      const added: ISectionEntry[] = [];
      widget.sectionAdded.connect((_, entry) => {
        added.push(entry);
      });
      const visibilityChanged = new Signal<object, void>({});
      let isVisible = true;
      const section = createSection('conditional');

      sidebar.registerSection({
        ...section,
        isVisible: () => isVisible,
        visibilityChanged
      });
      expect(added).toEqual([
        {
          id: 'conditional',
          titleNode: widget.accordionPanel.titles[0],
          widget: section.widget
        }
      ]);

      // The accordion creates a new title node on each attachment.
      isVisible = false;
      visibilityChanged.emit();
      isVisible = true;
      visibilityChanged.emit();
      expect(added).toHaveLength(2);
      expect(added[1].titleNode).toBe(widget.accordionPanel.titles[0]);
    });

    it('lets a sectionAdded listener move the section away', () => {
      sidebar.registerSection(createSection('changes', 10));
      sidebar.registerSection(createSection('branches', 30));
      widget = createGitWidget();
      widget.sectionAdded.connect((_, entry) => {
        widget.removeSectionById(entry.id);
      });

      const history = createSection('history', 20);
      sidebar.registerSection(history);

      expect(history.widget.parent).toBeNull();
      expect(labels()).toEqual(['changes', 'branches']);
    });

    it('keeps a moved-out section out of later synchronizations', () => {
      const changes = createSection('changes', 10);
      sidebar.registerSection(changes);
      sidebar.registerSection(createSection('branches', 30));
      widget = createGitWidget();

      const removed = widget.removeSectionById('changes');
      expect(removed).toBe(changes.widget);
      expect(removed!.parent).toBeNull();

      sidebar.registerSection(createSection('history', 20));
      expect(removed!.parent).toBeNull();
      expect(labels()).toEqual(['history', 'branches']);
      expect(widget.getSections().map(entry => entry.id)).toEqual([
        'history',
        'branches'
      ]);
    });

    it('returns null when removing an unknown or hidden section', () => {
      sidebar.registerSection({
        ...createSection('hidden'),
        isVisible: () => false
      });
      widget = createGitWidget();

      expect(widget.removeSectionById('unknown')).toBeNull();
      expect(widget.removeSectionById('hidden')).toBeNull();
    });

    it('reinserts a moved-out section in rank order', () => {
      sidebar.registerSection(createSection('changes', 10));
      sidebar.registerSection(createSection('history', 20));
      sidebar.registerSection(createSection('branches', 30));
      widget = createGitWidget();

      const removed = widget.removeSectionById('history')!;
      expect(labels()).toEqual(['changes', 'branches']);

      widget.reinsertSection(removed);
      expect(labels()).toEqual(['changes', 'history', 'branches']);

      const { node, titles } = widget.accordionPanel;
      const expected = widget.widgets.flatMap((section, index) => [
        titles[index],
        section.node
      ]);
      expect(
        Array.from(node.children).filter(child =>
          expected.includes(child as HTMLElement)
        )
      ).toEqual(expected);
    });

    it('hosts and releases sections moved in from other panels', () => {
      sidebar.registerSection(createSection('changes', 10));
      widget = createGitWidget();
      const foreign = new Widget();

      widget.addSection(foreign);
      expect(widget.sections).toEqual([foreign]);
      expect(widget.widgets).toEqual([widget.getSections()[0].widget, foreign]);

      widget.removeSectionWidget(foreign);
      expect(widget.sections).toHaveLength(0);
      expect(foreign.parent).toBeNull();
    });

    it('drops disposed hosted sections', () => {
      widget = createGitWidget();
      const foreign = new Widget();
      widget.addSection(foreign);

      foreign.dispose();
      expect(widget.sections).toHaveLength(0);
    });
  });

  describe('refresh standby', () => {
    it('is on standby when the panel is hidden', () => {
      widget = createGitWidget();
      expect(model.refreshStandbyCondition()).toBe(false);

      widget.hide();
      expect(model.refreshStandbyCondition()).toBe(true);
    });

    it('is active while a moved-out section is displayed', () => {
      sidebar.registerSection(createSection('changes', 10));
      widget = createGitWidget();
      widget.hide();
      const host = new AccordionPanel();
      Widget.attach(host, document.body);

      host.addWidget(widget.removeSectionById('changes')!);
      expect(model.refreshStandbyCondition()).toBe(false);

      host.hide();
      expect(model.refreshStandbyCondition()).toBe(true);
      host.dispose();
    });

    it('is never on standby with the refreshIfHidden setting', () => {
      settings = {
        composite: { refreshIfHidden: true }
      } as unknown as ISettingRegistry.ISettings;
      widget = createGitWidget();

      widget.hide();
      expect(model.refreshStandbyCondition()).toBe(false);
    });
  });
});
