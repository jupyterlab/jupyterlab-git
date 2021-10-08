import { IDisposable } from '@lumino/disposable';
import { ISignal, Signal } from '@lumino/signaling';
import { Git } from '../../tokens';

/**
 * Base DiffModel class
 */
export class DiffModel implements IDisposable, Git.Diff.IModel {
  constructor(props: Omit<Git.Diff.IModel, 'changed' | 'hasConflict'>) {
    this._challenger = props.challenger;
    this._filename = props.filename;
    this._reference = props.reference;
    this._repositoryPath = props.repositoryPath;
    this._base = props.base;

    this._changed = new Signal<DiffModel, Git.Diff.IModelChange>(this);
  }

  /**
   * A signal emitted when the model changed.
   *
   * Note: The signal is emitted for any set on reference or
   * on challenger change except for the content; i.e. the content
   * is not fetch to check if it changed.
   */
  get changed(): ISignal<DiffModel, Git.Diff.IModelChange> {
    return this._changed;
  }

  /**
   * Helper to compare diff contents.
   */
  private _didContentChange(
    a: Git.Diff.IContent,
    b: Git.Diff.IContent
  ): boolean {
    return (
      a.label !== b.label || a.source !== b.source || a.updateAt !== b.updateAt
    );
  }

  /**
   * Challenger description
   */
  get challenger(): Git.Diff.IContent {
    return this._challenger;
  }
  set challenger(v: Git.Diff.IContent) {
    const emitSignal = this._didContentChange(this._challenger, v);

    if (emitSignal) {
      this._challenger = v;
      this._changed.emit({ type: 'challenger' });
    }
  }

  /**
   * File to be compared
   *
   * Note: This path is relative to the repository path
   */
  get filename(): string {
    return this._filename;
  }

  /**
   * Reference description
   */
  get reference(): Git.Diff.IContent {
    return this._reference;
  }
  set reference(v: Git.Diff.IContent) {
    const emitSignal = this._didContentChange(this._reference, v);

    if (emitSignal) {
      this._reference = v;
      this._changed.emit({ type: 'reference' });
    }
  }

  /**
   * Git repository path
   *
   * Note: This path is relative to the server root
   */
  get repositoryPath(): string | undefined {
    return this._repositoryPath;
  }

  /**
   * Base description
   *
   * Note: The base diff content is only provided during
   * merge conflicts (three-way diff).
   */
  get base(): Git.Diff.IContent | undefined {
    return this._base;
  }

  /**
   * Helper to check if the file has conflicts.
   */
  get hasConflict(): boolean {
    return this._base !== undefined;
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

  protected _reference: Git.Diff.IContent;
  protected _challenger: Git.Diff.IContent;
  protected _base?: Git.Diff.IContent;

  private _changed: Signal<DiffModel, Git.Diff.IModelChange>;
  private _isDisposed = false;
  private _filename: string;
  private _repositoryPath: string;
}
