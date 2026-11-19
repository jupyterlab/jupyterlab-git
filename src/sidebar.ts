import { DisposableDelegate, IDisposable } from '@lumino/disposable';
import { ISignal, Signal } from '@lumino/signaling';
import type { IGitSidebar } from './tokens';

/**
 * The rank of the sections registered without one.
 */
const DEFAULT_RANK = 100;

/**
 * Default implementation of the Git sidebar section registry.
 */
export class GitSidebar implements IGitSidebar, IDisposable {
  /**
   * Whether the registry has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * The registered sections, ordered by rank and registration order.
   */
  get sections(): ReadonlyArray<IGitSidebar.ISection> {
    return [...this._sections.values()]
      .map(entry => entry.section)
      .sort((a, b) => (a.rank ?? DEFAULT_RANK) - (b.rank ?? DEFAULT_RANK));
  }

  /**
   * A signal emitted when a section is registered or removed.
   */
  get changed(): ISignal<IGitSidebar, void> {
    return this._changed;
  }

  /**
   * Register a section in the Git sidebar.
   */
  registerSection(section: IGitSidebar.ISection): IDisposable {
    if (this._isDisposed) {
      throw new Error('Cannot register a section on a disposed Git sidebar.');
    }
    if (!section.id) {
      throw new Error('Git sidebar sections must have a non-empty identifier.');
    }
    if (this._sections.has(section.id)) {
      throw new Error(
        `A Git sidebar section with id "${section.id}" is already registered.`
      );
    }

    const registration = new DisposableDelegate(() => {
      this._sections.delete(section.id);
      section.widget.dispose();
      if (!this._isDisposed) {
        this._changed.emit();
      }
    });
    this._sections.set(section.id, { section, registration });
    this._changed.emit();
    return registration;
  }

  /**
   * Dispose the registry and remove all section contributions.
   */
  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    for (const { registration } of [...this._sections.values()]) {
      registration.dispose();
    }
    Signal.clearData(this);
  }

  private _isDisposed = false;
  private _sections = new Map<
    string,
    { section: IGitSidebar.ISection; registration: IDisposable }
  >();
  private _changed = new Signal<IGitSidebar, void>(this);
}
