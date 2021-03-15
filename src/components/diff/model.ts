import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IDisposable } from '@lumino/disposable';
import { ISignal, Signal } from '@lumino/signaling';

export enum SpecialRef {
  'WORKING',
  'INDEX'
}

/**
 * Model which indicates the context in which a Git diff is being performed.
 *
 * It can be:
 * - a regular Git ref, i.e, https://git-scm.com/book/en/v2/Git-Internals-Git-References
 * - special/reserved references
 *
 * 1. WORKING: The Working Tree
 * 2. INDEX: The Staging Area
 *
 * To differentiate with the regular Git ref they are passed as number
 */
export interface IDiffContext {
  currentRef: string | SpecialRef;
  previousRef: string | SpecialRef;
}

/**
 * Content and its context for diff
 */
export interface IDiffContent<T> {
  /**
   * Content
   */
  content: T;
  /**
   * Content label
   *
   * Note: It is the preferred displayed information
   */
  label: string;
  /**
   * Source of the content
   *
   * Note: It is a machine friendly reference
   */
  source: any;
}

/**
 * DiffModel properties
 */
export interface IDiffModelProps<T> {
  /**
   * Challenger data
   */
  challenger: IDiffContent<T>;
  /**
   * File of the name being diff at reference state
   */
  filename: string;
  /**
   * Reference data
   */
  reference: IDiffContent<T>;
  /**
   * Rendermime registry
   */
  renderMime: IRenderMimeRegistry;
  /**
   * Application settings registry
   */
  settingsRegistry?: ISettingRegistry;
}

/**
 * DiffModel changed signal argument
 */
export interface IDiffModelChange {
  /**
   * Which content did change
   */
  type: 'reference' | 'challenger';
}

/**
 * Base DiffModel class
 */
export class DiffModel<T> implements IDisposable {
  constructor(props: IDiffModelProps<T>) {
    this._challenger = props.challenger;
    this._filename = props.filename;
    this._reference = props.reference;
    this._renderMime = props.renderMime;
    this._settingsRegistry = props.settingsRegistry || null;

    this._changed = new Signal<DiffModel<T>, IDiffModelChange>(this);
  }

  /**
   * A signal emitted when the model changed.
   *
   * Note: The signal is emitted for any set on reference or
   * on challenger without testing for a value difference.
   */
  get changed(): ISignal<DiffModel<T>, IDiffModelChange> {
    return this._changed;
  }

  get challenger(): IDiffContent<T> {
    return this._challenger;
  }
  set challenger(v: IDiffContent<T>) {
    this._challenger = v;
    this._changed.emit({ type: 'challenger' });
  }

  get filename(): string {
    return this._filename;
  }

  get reference(): IDiffContent<T> {
    return this._reference;
  }
  set reference(v: IDiffContent<T>) {
    this._reference = v;
    this._changed.emit({ type: 'reference' });
  }

  get renderMimeRegistry(): IRenderMimeRegistry {
    return this._renderMime;
  }

  get settingsRegistry(): ISettingRegistry | null {
    return this._settingsRegistry;
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

  protected _reference: IDiffContent<T>;
  protected _challenger: IDiffContent<T>;

  private _changed: Signal<DiffModel<T>, IDiffModelChange>;
  private _isDisposed = false;
  private _filename: string;
  private _renderMime: IRenderMimeRegistry;
  private _settingsRegistry: ISettingRegistry | null;
}
