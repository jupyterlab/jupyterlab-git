import { Widget } from '@lumino/widgets';
import 'jest';
import { GitSidebar } from '../sidebar';
import { IGitSidebar } from '../tokens';

function createSection(id: string, rank?: number): IGitSidebar.ISection {
  return {
    id,
    rank,
    widget: new Widget()
  };
}

describe('GitSidebar', () => {
  let sidebar: GitSidebar;

  beforeEach(() => {
    sidebar = new GitSidebar();
  });

  afterEach(() => {
    sidebar.dispose();
  });

  it('orders sections by rank and then registration order', () => {
    sidebar.registerSection(createSection('third', 30));
    sidebar.registerSection(createSection('first', 10));
    sidebar.registerSection(createSection('second', 10));
    sidebar.registerSection(createSection('default-rank'));

    expect(sidebar.sections.map(section => section.id)).toEqual([
      'first',
      'second',
      'third',
      'default-rank'
    ]);
  });

  it('emits a change when a section is added or removed', () => {
    const changed = jest.fn();
    sidebar.changed.connect(changed);

    const section = createSection('section');
    const registration = sidebar.registerSection(section);
    expect(changed).toHaveBeenCalledTimes(1);

    registration.dispose();
    expect(changed).toHaveBeenCalledTimes(2);
    expect(sidebar.sections).toHaveLength(0);
    expect(section.widget.isDisposed).toBe(true);
  });

  it('rejects empty and duplicate section identifiers', () => {
    expect(() => sidebar.registerSection(createSection(''))).toThrow(
      'Git sidebar sections must have a non-empty identifier.'
    );

    sidebar.registerSection(createSection('section'));
    expect(() => sidebar.registerSection(createSection('section'))).toThrow(
      'A Git sidebar section with id "section" is already registered.'
    );
  });

  it('disposes all registrations with the registry', () => {
    const section = createSection('section');
    const registration = sidebar.registerSection(section);

    sidebar.dispose();

    expect(sidebar.isDisposed).toBe(true);
    expect(registration.isDisposed).toBe(true);
    expect(section.widget.isDisposed).toBe(true);
    expect(sidebar.sections).toHaveLength(0);
    expect(() => sidebar.registerSection(createSection('other'))).toThrow(
      'Cannot register a section on a disposed Git sidebar.'
    );
  });
});
