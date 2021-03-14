import { LinkedList } from '@lumino/collections';
import { UUID } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { ISignal, Signal } from '@lumino/signaling';

/**
 * A generic task handler
 */
export class TaskHandler<T> implements IDisposable {
  constructor(model: T) {
    this._taskChanged = new Signal<T, string>(model);
  }

  /**
   * Boolean indicating whether the handler has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Signal emitted when a task starts
   *
   * 'empty' is emitted each time the task list have processed all tasks
   */
  get taskChanged(): ISignal<T, string> {
    return this._taskChanged;
  }

  /**
   * Adds a task to the list of pending model tasks.
   *
   * #Note:
   *  This will add a task name in the queue but the task
   *  execution remains in the hand of the caller.
   *  In particular it is the responsibility of the caller
   *  to call `remove(taskID)` when the task is executed.
   *
   * @param task - task name
   * @returns task identifier
   */
  add(task: string): string {
    // Generate a unique task identifier:
    const id = this._generateTaskID();

    // Add the task to our list of pending tasks:
    this._taskList.addLast({
      id: id,
      task: task
    });

    // If this task is the only task, broadcast the task...
    if (this._taskList.length === 1) {
      this._taskChanged.emit(task);
    }
    // Return the task identifier to allow consumers to remove the task once completed:
    return id;
  }

  /**
   * Dispose of task handler.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    Signal.clearData(this);
  }

  /**
   * Add a asynchronous task to the stack and execute it
   *
   * @param name Name of the task
   * @param callable Asynchronous task to be executed
   *
   * @returns The result of the task
   */
  async execute<R>(name: string, callable: () => Promise<R>): Promise<R> {
    const taskID = this.add(name);
    try {
      return await callable();
    } finally {
      this.remove(taskID);
    }
  }

  /**
   * Removes a task from the list of pending model tasks.
   *
   * @param id - task identifier
   */
  remove(taskID: string): void {
    let node = this._taskList.firstNode;

    // Check the first node...
    if (node?.value.id === taskID) {
      this._taskList.removeNode(node);
    } else {
      // Walk the task list looking for a task with the provided identifier...
      while (node.next) {
        node = node.next;
        if (node.value && node.value.id === taskID) {
          this._taskList.removeNode(node);
          break;
        }
      }
    }

    // Check for pending tasks and broadcast the oldest pending task...
    if (this._taskList.length === 0) {
      this._taskChanged.emit('empty');
    } else {
      this._taskChanged.emit(this._taskList.first.task);
    }
  }

  /**
   * Generates a unique task identifier.
   *
   * @returns task identifier
   */
  private _generateTaskID(): string {
    return UUID.uuid4();
  }

  private _isDisposed = false;
  private _taskChanged: Signal<T, string>;
  private _taskList: LinkedList<any> = new LinkedList();
}
