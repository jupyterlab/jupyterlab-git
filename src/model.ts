import { JupyterFrontEnd } from '@jupyterlab/application';
import { IChangedArgs, PathExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { LinkedList } from '@lumino/collections';
import { CommandRegistry } from '@lumino/commands';
import { JSONObject } from '@lumino/coreutils';
import { Poll } from '@lumino/polling';
import { ISignal, Signal } from '@lumino/signaling';
import { httpGitRequest } from './git';
import { Git, IGitExtension } from './tokens';
import { decodeStage } from './utils';

// Default refresh interval (in milliseconds) for polling the current Git status (NOTE: this value should be the same value as in the plugin settings schema):
const DEFAULT_REFRESH_INTERVAL = 3000; // ms

/**
 * Class for creating a model for retrieving info from, and interacting with, a remote Git repository.
 */
export class GitExtension implements IGitExtension {
  /**
   * Returns an extension model.
   *
   * @param app - frontend application
   * @param settings - plugin settings
   * @returns extension model
   */
  constructor(
    serverRoot: string,
    app: JupyterFrontEnd = null,
    settings?: ISettingRegistry.ISettings
  ) {
    const self = this;
    this._serverRoot = serverRoot;
    this._app = app;
    this._settings = settings || null;

    let interval: number;
    if (settings) {
      interval = settings.composite.refreshInterval as number;
      settings.changed.connect(onSettingsChange, this);
    } else {
      interval = DEFAULT_REFRESH_INTERVAL;
    }
    const poll = new Poll({
      factory: () => self.refresh(),
      frequency: {
        interval: interval,
        backoff: true,
        max: 300 * 1000
      },
      standby: 'when-hidden'
    });
    this._poll = poll;

    /**
     * Callback invoked upon a change to plugin settings.
     *
     * @private
     * @param settings - settings registry
     */
    function onSettingsChange(settings: ISettingRegistry.ISettings) {
      const freq = poll.frequency;
      poll.frequency = {
        interval: settings.composite.refreshInterval as number,
        backoff: freq.backoff,
        max: freq.max
      };
    }
  }

  /**
   * Branch list for the current repository.
   */
  get branches() {
    return this._branches;
  }

  /**
   * List of available Git commands.
   */
  get commands(): CommandRegistry | null {
    return this._app ? this._app.commands : null;
  }

  /**
   * The current repository branch.
   */
  get currentBranch() {
    return this._currentBranch;
  }

  /**
   * Boolean indicating whether the model has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Boolean indicating whether the model is ready.
   */
  get isReady(): boolean {
    return this._pendingReadyPromise === 0;
  }

  /**
   * Promise which fulfills when the model is ready.
   */
  get ready(): Promise<void> {
    return this._readyPromise;
  }

  /**
   * Git repository path.
   *
   * ## Notes
   *
   * -   This is the full path of the top-level folder.
   * -   The return value is `null` if a repository path is not defined.
   */
  get pathRepository(): string | null {
    return this._pathRepository;
  }

  set pathRepository(v: string | null) {
    const change: IChangedArgs<string> = {
      name: 'pathRepository',
      newValue: null,
      oldValue: this._pathRepository
    };
    if (v === null) {
      this._pendingReadyPromise += 1;
      this._readyPromise.then(() => {
        this._pathRepository = null;
        this._pendingReadyPromise -= 1;

        if (change.newValue !== change.oldValue) {
          this.refresh().then(() => this._repositoryChanged.emit(change));
        }
      });
    } else {
      const currentReady = this._readyPromise;
      this._pendingReadyPromise += 1;
      this._readyPromise = Promise.all([currentReady, this.showTopLevel(v)])
        .then(r => {
          const results = r[1];
          if (results.code === 0) {
            this._pathRepository = results.top_repo_path;
            change.newValue = results.top_repo_path;
          } else {
            this._pathRepository = null;
          }

          if (change.newValue !== change.oldValue) {
            this.refresh().then(() => this._repositoryChanged.emit(change));
          }
        })
        .catch(reason => {
          console.error(`Fail to find Git top level for path ${v}.\n${reason}`);
        });

      void this._readyPromise.then(() => {
        this._pendingReadyPromise -= 1;
      });
    }
  }

  /**
   * The Jupyter front-end application shell.
   */
  get shell(): JupyterFrontEnd.IShell | null {
    return this._app ? this._app.shell : null;
  }

  /**
   * A list of modified files.
   *
   * ## Notes
   *
   * -   The file list corresponds to the list of files from `git status`.
   */
  get status(): Git.IStatusFile[] {
    return this._status;
  }

  /**
   * A signal emitted when the `HEAD` of the Git repository changes.
   */
  get headChanged(): ISignal<IGitExtension, void> {
    return this._headChanged;
  }

  /**
   * A signal emitted when the current marking of the Git repository changes.
   */
  get markChanged(): ISignal<IGitExtension, void> {
    return this._markChanged;
  }

  /**
   * A signal emitted when the current Git repository changes.
   */
  get repositoryChanged(): ISignal<IGitExtension, IChangedArgs<string | null>> {
    return this._repositoryChanged;
  }

  /**
   * A signal emitted when the current status of the Git repository changes.
   */
  get statusChanged(): ISignal<IGitExtension, Git.IStatusFile[]> {
    return this._statusChanged;
  }

  /**
   * A signal emitted whenever a model event occurs.
   */
  get logger(): ISignal<IGitExtension, string> {
    return this._logger;
  }

  /**
   * Add one or more files to the repository staging area.
   *
   * ## Notes
   *
   * -   If no filename is provided, all files are added.
   *
   * @param filename - files to add
   * @returns promise which resolves upon adding files to the repository staging area
   */
  async add(...filename: string[]): Promise<Response> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      response = {
        code: -1,
        message: 'Not in a Git repository.'
      };
      return Promise.resolve(new Response(JSON.stringify(response)));
    }
    const tid = this._addTask('git:add:files');
    try {
      response = await httpGitRequest('/git/add', 'POST', {
        add_all: !filename,
        filename: filename || '',
        top_repo_path: path
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    if (!response.ok) {
      const data = await response.json();
      throw new ServerConnection.ResponseError(response, data.message);
    }
    this.refreshStatus();
    return Promise.resolve(response);
  }

  /**
   * Add all "unstaged" files to the repository staging area.
   *
   * @returns promise which resolves upon adding files to the repository staging area
   */
  async addAllUnstaged(): Promise<Response> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      response = {
        code: -1,
        message: 'Not in a Git repository.'
      };
      return Promise.resolve(new Response(JSON.stringify(response)));
    }
    const tid = this._addTask('git:add:files:all_unstaged');
    try {
      response = await httpGitRequest('/git/add_all_unstaged', 'POST', {
        top_repo_path: path
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    const data = await response.json();
    if (!response.ok) {
      throw new ServerConnection.ResponseError(response, data.message);
    }
    this.refreshStatus();
    return data;
  }

  /**
   * Add all untracked files to the repository staging area.
   *
   * @returns promise which resolves upon adding files to the repository staging area
   */
  async addAllUntracked(): Promise<Response> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      response = {
        code: -1,
        message: 'Not in a Git repository.'
      };
      return Promise.resolve(new Response(JSON.stringify(response)));
    }
    const tid = this._addTask('git:add:files:all_untracked');
    try {
      response = await httpGitRequest('/git/add_all_untracked', 'POST', {
        top_repo_path: path
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    const data = await response.json();
    if (!response.ok) {
      throw new ServerConnection.ResponseError(response, data.message);
    }
    this.refreshStatus();
    return data;
  }

  /**
   * Add a remote Git repository to the current repository.
   *
   * @param url - remote repository URL
   * @param name - remote name
   * @returns promise which resolves upon adding a remote
   */
  async addRemote(url: string, name?: string): Promise<void> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      return Promise.resolve();
    }
    const tid = this._addTask('git:add:remote');
    try {
      response = await httpGitRequest('/git/remote/add', 'POST', {
        top_repo_path: path,
        url,
        name
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    if (!response.ok) {
      const data = await response.text();
      throw new ServerConnection.ResponseError(response, data);
    }
  }

  /**
   * Retrieve the repository commit log.
   *
   * ## Notes
   *
   * -  This API can be used to implicitly check if the current folder is a Git repository.
   *
   * @param count - number of commits to retrieve
   * @returns promise which resolves upon retrieving the repository commit log
   */
  async allHistory(count = 25): Promise<Git.IAllHistory> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a Git repository.'
      });
    }
    const tid = this._addTask('git:fetch:history');
    try {
      response = await httpGitRequest('/git/all_history', 'POST', {
        current_path: path,
        history_count: count
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    if (!response.ok) {
      const data = await response.text();
      throw new ServerConnection.ResponseError(response, data);
    }
    return response.json();
  }

  /**
   * Checkout a branch.
   *
   * ## Notes
   *
   * -   If a branch name is provided, checkout the provided branch (with or without creating it)
   * -   If a filename is provided, checkout the file, discarding all changes.
   * -   If nothing is provided, checkout all files, discarding all changes.
   *
   * TODO: Refactor into separate endpoints for each kind of checkout request
   *
   * @param options - checkout options
   * @returns promise which resolves upon performing a checkout
   */
  async checkout(options?: Git.ICheckoutOptions): Promise<Git.ICheckoutResult> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a Git repository.'
      });
    }
    const body = {
      checkout_branch: false,
      new_check: false,
      branchname: '',
      startpoint: '',
      checkout_all: true,
      filename: '',
      top_repo_path: path
    };
    if (options !== undefined) {
      if (options.branchname) {
        body.branchname = options.branchname;
        body.checkout_branch = true;
        body.new_check = options.newBranch === true;
        if (options.newBranch) {
          body.startpoint = options.startpoint || this._currentBranch.name;
        }
      } else if (options.filename) {
        body.filename = options.filename;
        body.checkout_all = false;
      }
    }
    const tid = this._addTask('git:checkout');
    try {
      response = await httpGitRequest('/git/checkout', 'POST', body);
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    const data = await response.json();
    if (!response.ok) {
      throw new ServerConnection.ResponseError(response, data.message);
    }
    if (body.checkout_branch) {
      await this.refreshBranch();
      this._headChanged.emit();
    } else {
      this.refreshStatus();
    }
    return data;
  }

  /**
   * Clone a repository.
   *
   * @param path - local path into which the repository will be cloned
   * @param url - Git repository URL
   * @param auth - remote repository authentication information
   * @returns promise which resolves upon cloning a repository
   */
  async clone(
    path: string,
    url: string,
    auth?: Git.IAuth
  ): Promise<Git.ICloneResult> {
    let response;

    const obj: Git.IGitClone = {
      current_path: path,
      clone_url: url,
      auth
    };
    const tid = this._addTask('git:clone');
    try {
      response = await httpGitRequest('/git/clone', 'POST', obj);
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    const data = await response.json();
    if (!response.ok) {
      throw new ServerConnection.ResponseError(response, data.message);
    }
    return data;
  }

  /**
   * Commit all staged file changes.
   *
   * @param message - commit message
   * @returns promise which resolves upon committing file changes
   */
  async commit(message: string): Promise<Response> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      response = {
        code: -1,
        message: 'Not in a Git repository.'
      };
      return Promise.resolve(new Response(JSON.stringify(response)));
    }
    const tid = this._addTask('git:commit:create');
    try {
      response = await httpGitRequest('/git/commit', 'POST', {
        commit_msg: message,
        top_repo_path: path
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    if (!response.ok) {
      const data = await response.json();
      throw new ServerConnection.ResponseError(response, data.message);
    }
    this.refreshStatus();
    this._headChanged.emit();
    return response;
  }

  /**
   * Get (or set) Git configuration options.
   *
   * @param options - configuration options to set
   * @returns promise which resolves upon either getting or setting configuration options
   */
  async config(options?: JSONObject): Promise<Response> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      response = {
        code: -1,
        message: 'Not in a Git repository.'
      };
      return Promise.resolve(new Response(JSON.stringify(response)));
    }
    const tid = this._addTask('git:config:' + (options ? 'set' : 'get'));
    try {
      response = await httpGitRequest('/git/config', 'POST', {
        path,
        options
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    if (!response.ok) {
      const data = await response.json();
      throw new ServerConnection.ResponseError(response, data.message);
    }
    return response;
  }

  /**
   * Revert changes made after a specified commit.
   *
   * @param message - commit message
   * @param hash - commit identifier (hash)
   * @returns promise which resolves upon reverting changes
   */
  async revertCommit(message: string, hash: string): Promise<Response> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      response = {
        code: -1,
        message: 'Not in a Git repository.'
      };
      return Promise.resolve(new Response(JSON.stringify(response)));
    }
    const tid = this._addTask('git:commit:revert');
    try {
      response = await httpGitRequest('/git/delete_commit', 'POST', {
        commit_id: hash,
        top_repo_path: path
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    if (!response.ok) {
      const data = await response.json();
      throw new ServerConnection.ResponseError(response, data.message);
    }
    await this.commit(message);
    return response;
  }

  /**
   * Fetch commit information.
   *
   * @param hash - commit hash
   * @returns promise which resolves upon retrieving commit information
   */
  async detailedLog(hash: string): Promise<Git.ISingleCommitFilePathInfo> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a Git repository.'
      });
    }
    const tid = this._addTask('git:fetch:commit_log');
    try {
      response = await httpGitRequest('/git/detailed_log', 'POST', {
        selected_hash: hash,
        current_path: path
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    const data = await response.json();
    if (!response.ok) {
      throw new ServerConnection.ResponseError(response, data.message);
    }
    return data;
  }

  /**
   * Initialize a new Git repository at a specified path.
   *
   * @param path - path at which initialize a Git repository
   * @returns promise which resolves upon initializing a Git repository
   */
  async init(path: string): Promise<Response> {
    let response;

    const tid = this._addTask('git:init');
    try {
      response = await httpGitRequest('/git/init', 'POST', {
        current_path: path
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    if (!response.ok) {
      const data = await response.json();
      throw new ServerConnection.ResponseError(response, data.message);
    }
    return response;
  }

  /**
   * Retrieve commit logs.
   *
   * @param count - number of commits
   * @returns promise which resolves upon retrieving commit logs
   */
  async log(count = 25): Promise<Git.ILogResult> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a Git repository.'
      });
    }
    const tid = this._addTask('git:fetch:log');
    try {
      response = await httpGitRequest('/git/log', 'POST', {
        current_path: path,
        history_count: count
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    const data = await response.json();
    if (!response.ok) {
      throw new ServerConnection.ResponseError(response, data.message);
    }
    return data;
  }

  /**
   * Fetch changes from a remote repository.
   *
   * @param auth - remote authentication information
   * @returns promise which resolves upon fetching changes
   */
  async pull(auth?: Git.IAuth): Promise<Git.IPushPullResult> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a Git repository.'
      });
    }
    const obj: Git.IPushPull = {
      current_path: path,
      auth,
      cancel_on_conflict: this._settings
        ? (this._settings.composite['cancelPullMergeConflict'] as boolean)
        : false
    };
    const tid = this._addTask('git:pull');
    try {
      response = await httpGitRequest('/git/pull', 'POST', obj);
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    const data = await response.json();
    if (!response.ok) {
      throw new ServerConnection.ResponseError(response, data.message);
    }
    this._headChanged.emit();
    return data;
  }

  /**
   * Push local changes to a remote repository.
   *
   * @param auth - remote authentication information
   * @returns promise which resolves upon pushing changes
   */
  async push(auth?: Git.IAuth): Promise<Git.IPushPullResult> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a Git repository.'
      });
    }
    const obj: Git.IPushPull = {
      current_path: path,
      auth
    };
    const tid = this._addTask('git:push');
    try {
      response = await httpGitRequest('/git/push', 'POST', obj);
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    const data = await response.json();
    if (!response.ok) {
      throw new ServerConnection.ResponseError(response, data.message);
    }
    this._headChanged.emit();
    return data;
  }

  /**
   * Refresh the repository.
   *
   * @returns promise which resolves upon refreshing the repository
   */
  async refresh(): Promise<void> {
    const tid = this._addTask('git:refresh');
    await this.refreshBranch();
    await this.refreshStatus();
    this._removeTask(tid);
  }

  /**
   * Refresh the list of repository branches.
   *
   * @returns promise which resolves upon refreshing repository branches
   */
  async refreshBranch(): Promise<void> {
    const tid = this._addTask('git:refresh:branches');
    const response = await this._branch();
    if (response.code === 0) {
      this._branches = response.branches;
      this._currentBranch = response.current_branch;
      if (this._currentBranch) {
        // Set up the marker obj for the current (valid) repo/branch combination
        this._setMarker(this.pathRepository, this._currentBranch.name);
      }
    } else {
      this._branches = [];
      this._currentBranch = null;
    }
    this._removeTask(tid);
  }

  /**
   * Refresh the repository status.
   *
   * @returns promise which resolves upon refreshing the repository status
   */
  async refreshStatus(): Promise<void> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      this._setStatus([]);
      return Promise.resolve();
    }
    const tid = this._addTask('git:refresh:status');
    try {
      response = await httpGitRequest('/git/status', 'POST', {
        current_path: path
      });
    } catch (err) {
      // TODO we should notify the user
      this._setStatus([]);
      console.error(err);
      return;
    } finally {
      this._removeTask(tid);
    }
    const data = await response.json();
    if (!response.ok) {
      console.error(data.message);

      // TODO we should notify the user
      this._setStatus([]);
      return;
    }
    this._setStatus(
      (data as Git.IStatusResult).files.map(file => {
        return { ...file, status: decodeStage(file.x, file.y) };
      })
    );
  }

  /**
   * Move files from the "staged" to the "unstaged" area.
   *
   * ## Notes
   *
   * -  If no filename is provided, moves all files from the "staged" to the "unstaged" area.
   *
   * @param filename - file path to be reset
   * @returns promise which resolves upon moving files
   */
  async reset(filename?: string): Promise<Response> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      response = {
        code: -1,
        message: 'Not in a Git repository.'
      };
      return Promise.resolve(new Response(JSON.stringify(response)));
    }
    const tid = this._addTask('git:reset:changes');
    try {
      response = await httpGitRequest('/git/reset', 'POST', {
        reset_all: filename === undefined,
        filename: filename === undefined ? null : filename,
        top_repo_path: path
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    if (!response.ok) {
      const data = await response.json();
      throw new ServerConnection.ResponseError(response, data.message);
    }
    this.refreshStatus();
    return response;
  }

  /**
   * Reset the repository to a specified commit.
   *
   * ## Notes
   *
   * -   If a commit hash is not provided, resets the repository to `HEAD`.
   *
   * @param hash - commit identifier (hash)
   * @returns promises which resolves upon resetting the repository
   */
  async resetToCommit(hash = ''): Promise<Response> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      response = {
        code: -1,
        message: 'Not in a Git repository.'
      };
      return Promise.resolve(new Response(JSON.stringify(response)));
    }
    const tid = this._addTask('git:reset:hard');
    try {
      response = await httpGitRequest('/git/reset_to_commit', 'POST', {
        commit_id: hash,
        top_repo_path: path
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    if (!response.ok) {
      const data = await response.json();
      throw new ServerConnection.ResponseError(response, data.message);
    }
    await this.refreshBranch();
    this._headChanged.emit();
    return response;
  }

  /**
   * Retrieve the prefix path of a directory `path` with respect to the root repository directory.
   *
   * @param path - directory path
   * @returns promise which resolves upon retrieving the prefix path
   */
  async showPrefix(path: string): Promise<Git.IShowPrefixResult> {
    let response;

    const tid = this._addTask('git:fetch:prefix_path');
    try {
      response = await httpGitRequest('/git/show_prefix', 'POST', {
        current_path: path
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    const data = await response.json();
    if (!response.ok) {
      throw new ServerConnection.ResponseError(response, data.message);
    }
    return data;
  }

  /**
   * Retrieve the top level repository path.
   *
   * @param path - current path
   * @returns promise which resolves upon retrieving the top level repository path
   */
  async showTopLevel(path: string): Promise<Git.IShowTopLevelResult> {
    let response;

    const tid = this._addTask('git:fetch:top_level_path');
    try {
      response = await httpGitRequest('/git/show_top_level', 'POST', {
        current_path: path
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    const data = await response.json();
    if (!response.ok) {
      throw new ServerConnection.ResponseError(response, data.message);
    }
    return data;
  }

  /**
   * Add a file to the current marker object.
   *
   * @param fname - filename
   * @param mark - mark to set
   */
  addMark(fname: string, mark: boolean) {
    this._currentMarker.add(fname, mark);
  }

  /**
   * Return the current mark associated with a specified filename.
   *
   * @param fname - filename
   * @returns mark
   */
  getMark(fname: string): boolean {
    return this._currentMarker.get(fname);
  }

  /**
   * Toggle the mark for a file in the current marker object
   *
   * @param fname - filename
   */
  toggleMark(fname: string) {
    this._currentMarker.toggle(fname);
  }

  /**
   * Register a new diff provider for specified file types
   *
   * @param filetypes File type list
   * @param callback Callback to use for the provided file types
   */
  registerDiffProvider(filetypes: string[], callback: Git.IDiffCallback): void {
    filetypes.forEach(fileType => {
      this._diffProviders[fileType] = callback;
    });
  }

  /**
   * Return the path of a file relative to the Jupyter server root.
   *
   * ## Notes
   *
   * -   If no path is provided, returns the Git repository top folder relative path.
   * -   If no Git repository selected, returns `null`
   *
   * @param path - file path relative to the top folder of the Git repository
   * @returns relative path
   */
  getRelativeFilePath(path?: string): string | null {
    if (this.pathRepository === null || this._serverRoot === void 0) {
      return null;
    }
    return PathExt.join(
      PathExt.relative(this._serverRoot, this.pathRepository),
      path || ''
    );
  }

  /**
   * Dispose of model resources.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    this._poll.dispose();
    Signal.clearData(this);
  }

  /**
   * Make request to ensure gitignore.
   *
   * @param filename Optional name of the files to add
   */
  async ensureGitignore(): Promise<Response> {
    await this.ready;
    const repositoryPath = this.pathRepository;

    if (repositoryPath === null) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: -1,
            message: 'Not in a git repository.'
          })
        )
      );
    }

    const response = await httpGitRequest('/git/ignore', 'POST', {
      top_repo_path: repositoryPath
    });

    this.refreshStatus();
    return Promise.resolve(response);
  }

  /**
   * Make request to ignore one file.
   *
   * @param filename Optional name of the files to add
   */
  async ignore(filePath: string, useExtension: boolean): Promise<Response> {
    await this.ready;
    const repositoryPath = this.pathRepository;

    if (repositoryPath === null) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: -1,
            message: 'Not in a git repository.'
          })
        )
      );
    }

    const response = await httpGitRequest('/git/ignore', 'POST', {
      top_repo_path: repositoryPath,
      file_path: filePath,
      use_extension: useExtension
    });

    this.refreshStatus();
    return Promise.resolve(response);
  }

  /**
   * Make request for a list of all git branches in the repository
   * Retrieve a list of repository branches.
   *
   * @returns promise which resolves upon fetching repository branches
   */
  protected async _branch(): Promise<Git.IBranchResult> {
    let response;

    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a Git repository.'
      });
    }
    const tid = this._addTask('git:fetch:branches');
    try {
      response = await httpGitRequest('/git/branch', 'POST', {
        current_path: path
      });
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    } finally {
      this._removeTask(tid);
    }
    const data = await response.json();
    if (!response.ok) {
      throw new ServerConnection.ResponseError(response, data.message);
    }
    return data;
  }

  /**
   * Set the repository status.
   *
   * @param v - repository status
   */
  protected _setStatus(v: Git.IStatusFile[]) {
    this._status = v;
    this._statusChanged.emit(this._status);
  }

  /**
   * Set the marker object for a repository path and branch.
   *
   * @returns branch marker
   */
  private _setMarker(path: string, branch: string): BranchMarker {
    this._currentMarker = this._markerCache.get(path, branch);
    return this._currentMarker;
  }

  /**
   * Adds a task to the list of pending model tasks.
   *
   * @param task - task name
   * @returns task identifier
   */
  private _addTask(task: string): number {
    // Generate a unique task identifier:
    const id = this._generateTaskID();

    // Add the task to our list of pending tasks:
    this._taskList.addLast({
      id: id,
      task: task
    });

    // If this task is the only task, broadcast the task...
    if (this._taskList.length === 1) {
      this._logger.emit(task);
    }
    // Return the task identifier to allow consumers to remove the task once completed:
    return id;
  }

  /**
   * Removes a task from the list of pending model tasks.
   *
   * @param id - task identifier
   */
  private _removeTask(task: number): void {
    let node = this._taskList.firstNode;

    // Check the first node...
    if (node && node.value.id === task) {
      this._taskList.removeNode(node);
    } else {
      // Walk the task list looking for a task with the provided identifier...
      while (node.next) {
        node = node.next;
        if (node.value && node.value.id === task) {
          this._taskList.removeNode(node);
          break;
        }
      }
    }
    // Check for pending tasks and broadcast the oldest pending task...
    if (this._taskList.length === 0) {
      this._logger.emit('git:idle');
    } else {
      this._logger.emit(this._taskList.first.task);
    }
  }

  /**
   * Generates a unique task identifier.
   *
   * @returns task identifier
   */
  private _generateTaskID(): number {
    this._taskID += 1;
    return this._taskID;
  }

  private _status: Git.IStatusFile[] = [];
  private _pathRepository: string | null = null;
  private _branches: Git.IBranch[];
  private _currentBranch: Git.IBranch;
  private _serverRoot: string;
  private _app: JupyterFrontEnd | null;
  private _diffProviders: { [key: string]: Git.IDiffCallback } = {};
  private _isDisposed = false;
  private _markerCache: Markers = new Markers(() => this._markChanged.emit());
  private _currentMarker: BranchMarker = null;
  private _readyPromise: Promise<void> = Promise.resolve();
  private _pendingReadyPromise = 0;
  private _poll: Poll;
  private _taskList: LinkedList<any> = new LinkedList();
  private _taskID = 0;
  private _settings: ISettingRegistry.ISettings | null;
  private _headChanged = new Signal<IGitExtension, void>(this);
  private _markChanged = new Signal<IGitExtension, void>(this);
  private _repositoryChanged = new Signal<
    IGitExtension,
    IChangedArgs<string | null>
  >(this);
  private _statusChanged = new Signal<IGitExtension, Git.IStatusFile[]>(this);
  private _logger = new Signal<IGitExtension, string>(this);
}

export class BranchMarker implements Git.IBranchMarker {
  constructor(private _refresh: () => void) {}

  add(fname: string, mark = true) {
    if (!(fname in this._marks)) {
      this.set(fname, mark);
    }
  }

  get(fname: string) {
    return this._marks[fname];
  }

  set(fname: string, mark: boolean) {
    this._marks[fname] = mark;
    this._refresh();
  }

  toggle(fname: string) {
    this.set(fname, !this._marks[fname]);
  }

  private _marks: { [key: string]: boolean } = {};
}

export class Markers {
  constructor(private _refresh: () => void) {}

  get(path: string, branch: string): BranchMarker {
    const key = Markers.markerKey(path, branch);
    if (key in this._branchMarkers) {
      return this._branchMarkers[key];
    }

    const marker = new BranchMarker(this._refresh);
    this._branchMarkers[key] = marker;
    return marker;
  }

  static markerKey(path: string, branch: string): string {
    return [path, branch].join(':');
  }

  private _branchMarkers: { [key: string]: BranchMarker } = {};
}
