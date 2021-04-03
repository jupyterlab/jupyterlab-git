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

  /**
   * Challenger description
   */
  get challenger(): Git.Diff.IContent<T> {
    return this._challenger;
  }
  set challenger(v: Git.Diff.IContent<T>) {
    const emitSignal =
      this._challenger.label !== v.label ||
      this._challenger.source !== v.source ||
      this._challenger.updateAt !== v.updateAt;
    this._challenger = v;

    if (emitSignal) {
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
    const emitSignal =
      this._reference.label !== v.label ||
      this._reference.source !== v.source ||
      this._reference.updateAt !== v.updateAt;
    this._reference = v;
    if (emitSignal) {
      this._changed.emit({ type: 'reference' });
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
