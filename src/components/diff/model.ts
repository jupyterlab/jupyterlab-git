import { IDisposable } from '@lumino/disposable';
import { ISignal, Signal } from '@lumino/signaling';
import { Git } from '../../tokens';

/**
 * Base DiffModel class
 */
export class DiffModel<T> implements IDisposable, Git.Diff.IModel<T> {
  constructor(props: Omit<Git.Diff.IModel<T>, 'changed'>) {
    this._challenger = props.challenger;
    this._filename = props.filename;
    this._reference = props.reference;

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

  protected _didContentChange(
    a: Git.Diff.IContent<T>,
    b: Git.Diff.IContent<T>
  ): boolean {
    return (
      a.label !== b.label || a.source !== b.source || a.updateAt !== b.updateAt
    );
  }

  protected _emitChanged(type: Git.Diff.IModelChange['type']) {
    this._changed.emit({ type });
  }

  /**
   * Challenger description
   */
  get challenger(): Git.Diff.IContent<T> {
    return this._challenger;
  }
  set challenger(v: Git.Diff.IContent<T>) {
    const emitSignal = this._didContentChange(this._challenger, v);
    this._challenger = v;

    if (emitSignal) {
      this._emitChanged('challenger');
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
    this._reference = v;
    if (emitSignal) {
      this._emitChanged('reference');
    }
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

  private _changed: Signal<DiffModel<T>, Git.Diff.IModelChange>;
  private _isDisposed = false;
  private _filename: string;
}

/**
 * Model for merge conflicts
 */
export class MergeDiffModel<T> extends DiffModel<T> {
  constructor(props: Omit<Git.Diff.IModel<T>, 'changed'>) {
    super(props);
    this._base = props.base;
  }

  /**
   * Base description
   */
  get base(): Git.Diff.IContent<T> {
    return this._base;
  }
  set base(v: Git.Diff.IContent<T>) {
    const emitSignal = this._didContentChange(this._base, v);
    this._base = v;
    if (emitSignal) {
      this._emitChanged('base');
    }
  }

  protected _base: Git.Diff.IContent<T>;
}
