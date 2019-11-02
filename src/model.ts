import { JupyterFrontEnd } from '@jupyterlab/application';
import { IChangedArgs, PathExt, Poll } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { CommandRegistry } from '@phosphor/commands';
import { JSONObject } from '@phosphor/coreutils';
import { ISignal, Signal } from '@phosphor/signaling';
import { httpGitRequest } from './git';
import { IGitExtension, Git } from './tokens';
import { IDisposable } from '@phosphor/disposable';

/**
 * The default duration of the auto-refresh in ms
 */
const DEFAULT_REFRESH_INTERVAL = 10000;

/** Main extension class */
export class GitExtension implements IGitExtension, IDisposable {
  constructor(app: JupyterFrontEnd = null) {
    this._app = app;

    // Load the server root path
    this._getServerRoot()
      .then(root => {
        this._serverRoot = root;
      })
      .catch(reason => {
        console.error(`Fail to get the server root path.\n${reason}`);
      });

    const refreshInterval = DEFAULT_REFRESH_INTERVAL;

    // Start watching the repository
    this._poll = new Poll({
      factory: () => this._refreshStatus(),
      frequency: {
        interval: refreshInterval,
        backoff: true,
        max: 300 * 1000
      },
      standby: 'when-hidden'
    });
  }

  /**
   * A signal emitted when the HEAD of the git repository changes.
   */
  get headChanged(): ISignal<IGitExtension, void> {
    return this._headChanged;
  }

  /**
   * Git Repository path
   *
   * This is the top-level folder fullpath.
   * null if not defined.
   */
  public get pathRepository(): string | null {
    return this._pathRepository;
  }

  public set pathRepository(v: string | null) {
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
          this.refreshStatus();
          this._repositoryChanged.emit(change);
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
            this.refreshStatus();
            this._repositoryChanged.emit(change);
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

  public get status(): Git.IGitStatusFileResult[] {
    return this._status;
  }
  protected _setStatus(v: Git.IGitStatusFileResult[]) {
    this._status = v;
    this._statusChanged.emit(this._status);
  }

  /**
   * A signal emitted when the current status of the git repository changes.
   */
  get statusChanged(): ISignal<IGitExtension, Git.IGitStatusFileResult[]> {
    return this._statusChanged;
  }

  public get commands(): CommandRegistry | null {
    return this._app ? this._app.commands : null;
  }

  public get shell(): JupyterFrontEnd.IShell {
    return this._app ? this._app.shell : null;
  }

  /**
   * Get whether the model is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
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

  /** Make request for the Git Pull API. */
  async pull(auth?: Git.IGitAuth): Promise<Git.IGitPushPullResult> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a git repository.'
      });
    }

    try {
      let obj: Git.IGitPushPull = {
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
  async push(auth?: Git.IGitAuth): Promise<Git.IGitPushPullResult> {
    await this.ready;
    const path = this.pathRepository;

    if (path === null) {
      return Promise.resolve({
        code: -1,
        message: 'Not in a git repository.'
      });
    }

    try {
      let obj: Git.IGitPushPull = {
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

  /** Make request for the Git Clone API. */
  async clone(
    path: string,
    url: string,
    auth?: Git.IGitAuth
  ): Promise<Git.IGitCloneResult> {
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

  /** Make request for all git info of repository 'path'
   * (This API is also implicitly used to check if the current repo is a Git repo)
   */
  async allHistory(historyCount: number = 25): Promise<Git.IGitAllHistory> {
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

  /** Make request for top level path of repository 'path' */
  async showTopLevel(path: string): Promise<Git.IGitShowTopLevelResult> {
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

  /** Make request for the prefix path of a directory 'path',
   * with respect to the root directory of repository
   */
  async showPrefix(path: string): Promise<Git.IGitShowPrefixResult> {
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

  async refreshStatus(): Promise<void> {
    await this._poll.refresh();
    await this._poll.tick;
  }

  /** Refresh the git repository status */
  async _refreshStatus(): Promise<void> {
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

      this._setStatus((data as Git.IGitStatusResult).files);
    } catch (err) {
      console.error(err);
      // TODO should we notify the user
      this._setStatus([]);
    }
  }

  /** Make request for git commit logs of repository 'path' */
  async log(historyCount: number = 25): Promise<Git.IGitLogResult> {
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

  /** Make request for detailed git commit info of
   * commit 'hash' in repository 'path'
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

  /** Make request for a list of all git branches in repository 'path' */
  async branch(): Promise<Git.IGitBranchResult> {
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

  /** Make request to add one or all files into
   * the staging area in repository 'path'
   */
  async add(check: boolean, filename: string): Promise<Response> {
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
      add_all: check,
      filename: filename,
      top_repo_path: path
    });

    this.refreshStatus();
    return Promise.resolve(response);
  }

  /** Make request to add all untracked files into
   * the staging area in repository 'path'
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

  /** Make request to switch current working branch,
   * create new branch if needed,
   * or discard all changes,
   * or discard a specific file change
   * TODO: Refactor into seperate endpoints for each kind of checkout request
   */
  async checkout(
    checkoutBranch: boolean,
    newCheck: boolean,
    branchname: string,
    checkoutAll: boolean,
    filename: string
  ): Promise<Response> {
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
      let response = await httpGitRequest('/git/checkout', 'POST', {
        checkout_branch: checkoutBranch,
        new_check: newCheck,
        branchname: branchname,
        checkout_all: checkoutAll,
        filename: filename,
        top_repo_path: path
      });
      if (response.status !== 200) {
        return response.json().then((data: any) => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }

      if (checkoutBranch) {
        this._headChanged.emit();
      } else {
        this.refreshStatus();
      }
      return response;
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /** Make request to commit all staged files in repository 'path' */
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

  /** Make request to move one or all files from the staged to the unstaged area */
  async reset(check: boolean, filename: string): Promise<Response> {
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
        reset_all: check,
        filename: filename,
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

  /** Make request to delete changes from selected commit */
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

  /** Make request to reset to selected commit */
  async resetToCommit(commitId: string): Promise<Response> {
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
      this._headChanged.emit();
      return response;
    } catch (err) {
      throw new ServerConnection.NetworkError(err);
    }
  }

  /** Make request to initialize a  new git repository at path 'path' */
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

  registerDiffProvider(filetypes: string[], callback: Git.IDiffCallback): void {
    filetypes.forEach(fileType => {
      this._diffProviders[fileType] = callback;
    });
  }

  performDiff(filename: string, revisionA: string, revisionB: string) {
    let extension = PathExt.extname(filename).toLocaleLowerCase();
    if (this._diffProviders[extension] !== undefined) {
      this._diffProviders[extension](filename, revisionA, revisionB);
    } else if (this.commands) {
      this.commands.execute('git:terminal-cmd', {
        cmd: 'git diff ' + revisionA + ' ' + revisionB
      });
    }
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

  private async _getServerRoot(): Promise<string> {
    try {
      const response = await httpGitRequest('/git/server_root', 'GET', null);
      const data = await response.json();
      return data['server_root'];
    } catch (reason) {
      throw new Error(reason);
    }
  }

  private _status: Git.IGitStatusFileResult[] = [];
  private _pathRepository: string | null = null;
  private _serverRoot: string;
  private _app: JupyterFrontEnd | null;
  private _diffProviders: { [key: string]: Git.IDiffCallback } = {};
  private _isDisposed = false;
  private _readyPromise: Promise<void> = Promise.resolve();
  private _pendingReadyPromise = 0;
  private _poll: Poll;
  private _headChanged = new Signal<IGitExtension, void>(this);
  private _repositoryChanged = new Signal<
    IGitExtension,
    IChangedArgs<string | null>
  >(this);
  private _statusChanged = new Signal<
    IGitExtension,
    Git.IGitStatusFileResult[]
  >(this);
}
