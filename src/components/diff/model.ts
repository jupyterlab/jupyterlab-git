import { IDisposable } from '@lumino/disposable';
import { ISignal, Signal } from '@lumino/signaling';
import { Git } from '../../tokens';

/**
 * Base DiffModel class
 */
export class DiffModel<T> implements IDisposable, Git.Diff.IModel<T> {
  constructor(props: Omit<Git.Diff.IModel<T>, 'changed' | 'isConflict'>) {
    this._challenger = props.challenger;
    this._filename = props.filename;
    this._reference = props.reference;
    this._base = props.base;

    this._changed = new Signal<DiffModel<T>, Git.Diff.IModelChange>(this);
  }

  /**
   * A signal emitted when the model changed.
   *
   * Note: The signal is emitted for any set on reference or
   * on challenger change except for the content; i.e. the content
   * is not fetch to check if it changed.
   */
  get changed(): ISignal<DiffModel<T>, Git.Diff.IModelChange> {
    return this._changed;
  }

  /**
   * Helper to compare diff contents.
   */
  private _didContentChange(
    a: Git.Diff.IContent<T>,
    b: Git.Diff.IContent<T>
  ): boolean {
    return (
      a.label !== b.label || a.source !== b.source || a.updateAt !== b.updateAt
    );
  }

  /**
   * Challenger description
   */
  get challenger(): Git.Diff.IContent<T> {
    return this._challenger;
  }
  set challenger(v: Git.Diff.IContent<T>) {
    const emitSignal = this._didContentChange(this._challenger, v);

    if (emitSignal) {
      this._challenger = v;
      this._changed.emit({ type: 'challenger' });
    }
  }

  /**
   * File to be compared
   */
  get filename(): string {
    return this._filename;
  }

  /**
   * Reference description
   */
  get reference(): Git.Diff.IContent<T> {
    return this._reference;
  }
  set reference(v: Git.Diff.IContent<T>) {
    const emitSignal = this._didContentChange(this._reference, v);

    if (emitSignal) {
      this._reference = v;
      this._changed.emit({ type: 'reference' });
    }
  }

  /**
   * Base description
   *
   * Note: The base diff content is only provided during
   * merge conflicts (three-way diff).
   */
  get base(): Git.Diff.IContent<T> | undefined {
    return this._base;
  }

  /**
   * Helper to check if the file is conflicted.
   */
  get isConflict(): boolean {
    return !!this._base;
  }

  /**
   * Boolean indicating whether the model has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the model.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    Signal.clearData(this);
  }

  protected _reference: Git.Diff.IContent<T>;
  protected _challenger: Git.Diff.IContent<T>;
  protected _base?: Git.Diff.IContent<T>;

  private _changed: Signal<DiffModel<T>, Git.Diff.IModelChange>;
  private _isDisposed = false;
  private _filename: string;
}
