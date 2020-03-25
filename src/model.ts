import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  IChangedArgs,
  PathExt,
  Poll,
  ISettingRegistry
} from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { CommandRegistry } from '@phosphor/commands';
import { JSONObject } from '@phosphor/coreutils';
import { ISignal, Signal } from '@phosphor/signaling';
import { httpGitRequest } from './git';
import { IGitExtension, Git } from './tokens';

// Default refresh interval (in milliseconds) for polling the current Git status (NOTE: this value should be the same value as in the plugin settings schema):
const DEFAULT_REFRESH_INTERVAL = 3000; // ms

/** Main extension class */
export class GitExtension implements IGitExtension {
  constructor(
    app: JupyterFrontEnd = null,
    settings?: ISettingRegistry.ISettings
  ) {
    const model = this;
    this._app = app;

    // Load the server root path
    this._getServerRoot()
      .then(root => {
        this._serverRoot = root;
      })
      .catch(reason => {
        console.error(`Fail to get the server root path.\n${reason}`);
      });

    let interval: number;
    if (settings) {
      interval = settings.composite.refreshInterval as number;
      settings.changed.connect(onSettingsChange, this);
    } else {
      interval = DEFAULT_REFRESH_INTERVAL;
    }
    const poll = new Poll({
      factory: () => model.refresh(),
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
   * The list of branch in the current repo
   */
  get branches() {
    return this._branches;
  }

  get commands(): CommandRegistry | null {
    return this._app ? this._app.commands : null;
  }

  /**
   * The current branch
   */
  get currentBranch() {
    return this._currentBranch;
  }

  /**
   * A signal emitted when the HEAD of the git repository changes.
   */
  get headChanged(): ISignal<IGitExtension, void> {
    return this._headChanged;
  }

  /**
   * Get whether the model is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Test whether the model is ready.
   */
  get isReady(): boolean {
    return this._pendingReadyPromise === 0;
  }

  /**
   * A promise that fulfills when the model is ready.
   */
  get ready(): Promise<void> {
    return this._readyPromise;
  }

  /**
   * A signal emitted when the current marking of the git repository changes.
   */
  get markChanged(): ISignal<IGitExtension, void> {
    return this._markChanged;
  }

  /**
   * Git Repository path
   *
   * This is the top-level folder fullpath.
   * null if not defined.
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
          console.error(`Fail to find git top level for path ${v}.\n${reason}`);
        });

      void this._readyPromise.then(() => {
        this._pendingReadyPromise -= 1;
      });
    }
  }

  /**
   * A signal emitted when the current git repository changes.
   */
  get repositoryChanged(): ISignal<IGitExtension, IChangedArgs<string | null>> {
    return this._repositoryChanged;
  }

  get shell(): JupyterFrontEnd.IShell | null {
    return this._app ? this._app.shell : null;
  }

  /**
   * Files list resulting of a git status call.
   */
  get status(): Git.IStatusFileResult[] {
    return this._status;
  }

  /**
   * A signal emitted when the current status of the git repository changes.
   */
  get statusChanged(): ISignal<IGitExtension, Git.IStatusFileResult[]> {
    return this._statusChanged;
  }

  /**
   * Make request to add one or all files into
   * the staging area in repository
   *
   * If filename is not provided, all files will be added.
   *
   * @param filename Optional name of the files to add
   */
  async add(...filename: string[]): Promise<Response> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: -1,
            message: 'Not in a git repository.'
          })
        )
      );
    }

    const response = await httpGitRequest('/git/add', 'POST', {
      add_all: !filename,
      filename: filename || '',
      top_repo_path: path
    });

    this.refreshStatus();
    return Promise.resolve(response);
  }

  /**
   * Make request to add all unstaged files into
   * the staging area in repository 'path'
   */
  async addAllUnstaged(): Promise<Response> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: -1,
            message: 'Not in a git repository.'
          })
        )
      );
    }

    try {
      let response = await httpGitRequest('/git/add_all_unstaged', 'POST', {
        top_repo_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }

      this.refreshStatus();
      return response.json();
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * Make request to add all untracked files into
   * the staging area in the repository
   */
  async addAllUntracked(): Promise<Response> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: -1,
            message: 'Not in a git repository.'
          })
        )
      );
    }

    try {
      let response = await httpGitRequest('/git/add_all_untracked', 'POST', {
        top_repo_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }

      this.refreshStatus();
      return response.json();
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * Add file named fname to current marker obj
   *
   * @param fname Filename
   * @param mark Mark to set
   */
  addMark(fname: string, mark: boolean) {
    this._currentMarker.add(fname, mark);
  }

  /**
   * get current mark of fname
   *
   * @param fname Filename
   * @returns Mark of the file
   */
  getMark(fname: string): boolean {
    return this._currentMarker.get(fname);
  }

  /**
   * Toggle mark for file named fname in current marker obj
   *
   * @param fname Filename
   */
  toggleMark(fname: string) {
    this._currentMarker.toggle(fname);
  }

  /**
   * Make request for all git info of the repository
   * (This API is also implicitly used to check if the current repo is a Git repo)
   *
   * @param historyCount: Optional number of commits to get from git log
   * @returns Repository history
   */
  async allHistory(historyCount: number = 25): Promise<Git.IAllHistory> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a git repository.'
      });
    }

    try {
      let response = await httpGitRequest('/git/all_history', 'POST', {
        current_path: path,
        history_count: historyCount
      });
      if (response.status !== 200) {
        const data = await response.text();
        throw new ServerConnection.ResponseError(response, data);
      }
      return response.json();
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * Make request to switch current working branch,
   * create new branch if needed,
   * or discard a specific file change or all changes
   * TODO: Refactor into seperate endpoints for each kind of checkout request
   *
   * If a branch name is provided, check it out (with or without creating it)
   * If a filename is provided, check the file out
   * If nothing is provided, check all files out
   *
   * @param options Checkout options
   */
  async checkout(options?: Git.ICheckoutOptions): Promise<Git.ICheckoutResult> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a git repository.'
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

    try {
      let response = await httpGitRequest('/git/checkout', 'POST', body);
      if (response.status !== 200) {
        return response.json().then((data: any) => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }

      if (body.checkout_branch) {
        await this.refreshBranch();
        this._headChanged.emit();
      } else {
        this.refreshStatus();
      }
      return response.json();
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * Make request for the Git Clone API.
   *
   * @param path Local path in which the repository will be cloned
   * @param url Distant Git repository URL
   * @param auth Optional authentication information for the remote repository
   */
  async clone(
    path: string,
    url: string,
    auth?: Git.IAuth
  ): Promise<Git.ICloneResult> {
    try {
      let obj: Git.IGitClone = {
        current_path: path,
        clone_url: url,
        auth
      };

      let response = await httpGitRequest('/git/clone', 'POST', obj);
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * Make request to commit all staged files in repository
   *
   * @param message Commit message
   */
  async commit(message: string): Promise<Response> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: -1,
            message: 'Not in a git repository.'
          })
        )
      );
    }

    try {
      let response = await httpGitRequest('/git/commit', 'POST', {
        commit_msg: message,
        top_repo_path: path
      });
      if (response.status !== 200) {
        return response.json().then((data: any) => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }

      this.refreshStatus();
      return response;
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * Get or set Git configuration options
   *
   * @param options Configuration options to set (undefined to get)
   */
  async config(options?: JSONObject): Promise<Response> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: -1,
            message: 'Not in a git repository.'
          })
        )
      );
    }

    try {
      let method = 'POST';
      let body = { path, options };

      let response = await httpGitRequest('/git/config', method, body);

      if (!response.ok) {
        const jsonData = await response.json();
        throw new ServerConnection.ResponseError(response, jsonData.message);
      }

      return response;
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * Make request to delete changes from selected commit
   *
   * @param message Commit message to use for the new repository state
   * @param commitId Selected commit ID
   */
  async deleteCommit(message: string, commitId: string): Promise<Response> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: -1,
            message: 'Not in a git repository.'
          })
        )
      );
    }

    try {
      let response = await httpGitRequest('/git/delete_commit', 'POST', {
        commit_id: commitId,
        top_repo_path: path
      });
      if (response.status !== 200) {
        return response.json().then((data: any) => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }
      await this.commit(message);
      return response;
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * Make request for detailed git commit info of
   * commit 'hash'
   *
   * @param hash Commit hash
   */
  async detailedLog(hash: string): Promise<Git.ISingleCommitFilePathInfo> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a git repository.'
      });
    }

    try {
      let response = await httpGitRequest('/git/detailed_log', 'POST', {
        selected_hash: hash,
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * Dispose of the resources held by the model.
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
   * Gets the path of the file relative to the Jupyter server root.
   *
   * If no path is provided, returns the Git repository top folder relative path.
   * If no Git repository selected, return null
   *
   * @param path the file path relative to Git repository top folder
   */
  getRelativeFilePath(path?: string): string | null {
    if (this.pathRepository === null || this._serverRoot === undefined) {
      return null;
    }

    return PathExt.join(
      PathExt.relative(this._serverRoot, this.pathRepository),
      path || ''
    );
  }

  /**
   * Make request to initialize a  new git repository at path 'path'
   *
   * @param path Folder path to initialize as a git repository.
   */
  async init(path: string): Promise<Response> {
    try {
      let response = await httpGitRequest('/git/init', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        return response.json().then((data: any) => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }
      return response;
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * Make request for git commit logs
   *
   * @param historyCount: Optional number of commits to get from git log
   */
  async log(historyCount: number = 25): Promise<Git.ILogResult> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a git repository.'
      });
    }

    try {
      let response = await httpGitRequest('/git/log', 'POST', {
        current_path: path,
        history_count: historyCount
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
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

  /** Make request for the Git Pull API. */
  async pull(auth?: Git.IAuth): Promise<Git.IPushPullResult> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a git repository.'
      });
    }

    try {
      let obj: Git.IPushPull = {
        current_path: path,
        auth
      };

      let response = await httpGitRequest('/git/pull', 'POST', obj);
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }

      this._headChanged.emit();

      return response.json();
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /** Make request for the Git Push API. */
  async push(auth?: Git.IAuth): Promise<Git.IPushPullResult> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a git repository.'
      });
    }

    try {
      let obj: Git.IPushPull = {
        current_path: path,
        auth
      };

      let response = await httpGitRequest('/git/push', 'POST', obj);
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      this._headChanged.emit();
      return response.json();
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * General git refresh
   */
  async refresh(): Promise<void> {
    await this.refreshBranch();
    await this.refreshStatus();
  }

  /**
   * Make request for a list of all git branches
   */
  async refreshBranch(): Promise<void> {
    const response = await this._branch();

    if (response.code === 0) {
      this._branches = response.branches;
      this._currentBranch = response.current_branch;

      if (this._currentBranch) {
        // set up the marker obj for the current (valid) repo/branch combination
        this._setMarker(this.pathRepository, this._currentBranch.name);
      }
    } else {
      this._branches = [];
      this._currentBranch = null;
    }
  }

  /**
   * Request git status refresh
   */
  async refreshStatus(): Promise<void> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      this._setStatus([]);
      return Promise.resolve();
    }

    try {
      let response = await httpGitRequest('/git/status', 'POST', {
        current_path: path
      });
      const data = await response.json();
      if (response.status !== 200) {
        console.error(data.message);
        // TODO should we notify the user
        this._setStatus([]);
      }

      this._setStatus((data as Git.IStatusResult).files);
    } catch (err) {
      console.error(err);
      // TODO should we notify the user
      this._setStatus([]);
    }
  }

  /**
   * Make request to move one or all files from the staged to the unstaged area
   *
   * @param filename - Path to a file to be reset. Leave blank to reset all
   *
   * @returns a promise that resolves when the request is complete.
   */
  async reset(filename?: string): Promise<Response> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: -1,
            message: 'Not in a git repository.'
          })
        )
      );
    }

    try {
      let response = await httpGitRequest('/git/reset', 'POST', {
        reset_all: filename === undefined,
        filename: filename === undefined ? null : filename,
        top_repo_path: path
      });
      if (response.status !== 200) {
        return response.json().then((data: any) => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }

      this.refreshStatus();
      return response;
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * Make request to reset to selected commit
   *
   * @param commitId - Git commit specification. Leave blank to reset to HEAD
   *
   * @returns a promise that resolves when the request is complete.
   */
  async resetToCommit(commitId: string = ''): Promise<Response> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            code: -1,
            message: 'Not in a git repository.'
          })
        )
      );
    }

    try {
      let response = await httpGitRequest('/git/reset_to_commit', 'POST', {
        commit_id: commitId,
        top_repo_path: path
      });
      if (response.status !== 200) {
        return response.json().then((data: any) => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }
      await this.refreshBranch();
      this._headChanged.emit();
      return response;
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /** Make request for the prefix path of a directory 'path',
   * with respect to the root directory of repository
   */
  async showPrefix(path: string): Promise<Git.IShowPrefixResult> {
    try {
      let response = await httpGitRequest('/git/show_prefix', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /** Make request for top level path of repository 'path' */
  async showTopLevel(path: string): Promise<Git.IShowTopLevelResult> {
    try {
      let response = await httpGitRequest('/git/show_top_level', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * Make request for a list of all git branches in the repository
   *
   * @returns The repository branches
   */
  protected async _branch(): Promise<Git.IBranchResult> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a git repository.'
      });
    }

    try {
      let response = await httpGitRequest('/git/branch', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /**
   * Set repository status
   *
   * @param v Repository status
   */
  protected _setStatus(v: Git.IStatusFileResult[]) {
    this._status = v;
    this._statusChanged.emit(this._status);
  }

  private async _getServerRoot(): Promise<string> {
    try {
      const response = await httpGitRequest('/git/server_root', 'GET', null);
      const data = await response.json();
      return data['server_root'];
    } catch (reason) {
      throw new Error(reason);
    }
  }

  /**
   * set marker obj for repo path/branch combination
   */
  private _setMarker(path: string, branch: string): BranchMarker {
    this._currentMarker = this._markerCache.get(path, branch);
    return this._currentMarker;
  }

  private _status: Git.IStatusFileResult[] = [];
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
  private _headChanged = new Signal<IGitExtension, void>(this);
  private _markChanged = new Signal<IGitExtension, void>(this);
  private _repositoryChanged = new Signal<
    IGitExtension,
    IChangedArgs<string | null>
  >(this);
  private _statusChanged = new Signal<IGitExtension, Git.IStatusFileResult[]>(
    this
  );
}

export class BranchMarker implements Git.IBranchMarker {
  constructor(private _refresh: () => void) {}

  add(fname: string, mark: boolean = true) {
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

    let marker = new BranchMarker(this._refresh);
    this._branchMarkers[key] = marker;
    return marker;
  }

  static markerKey(path: string, branch: string): string {
    return [path, branch].join(':');
  }

  private _branchMarkers: { [key: string]: BranchMarker } = {};
}
