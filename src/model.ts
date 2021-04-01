import { IChangedArgs, PathExt } from '@jupyterlab/coreutils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { JSONObject } from '@lumino/coreutils';
import { Poll } from '@lumino/polling';
import { ISignal, Signal } from '@lumino/signaling';
import { requestAPI } from './git';
import { TaskHandler } from './taskhandler';
import { Git, IGitExtension } from './tokens';
import { decodeStage } from './utils';

// Default refresh interval (in milliseconds) for polling the current Git status (NOTE: this value should be the same value as in the plugin settings schema):
const DEFAULT_REFRESH_INTERVAL = 3000; // ms
// Available diff providers
const DIFF_PROVIDERS: {
  [key: string]: { name: string; callback: Git.Diff.ICallback<any> };
} = {};

/**
 * Get the diff provider for a filename
 * @param filename Filename to look for
 * @returns The diff provider callback or undefined
 */
export function getDiffProvider(
  filename: string
): Git.Diff.ICallback<any> | undefined {
  return DIFF_PROVIDERS[PathExt.extname(filename)?.toLocaleLowerCase()]
    ?.callback;
}

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
    docmanager: IDocumentManager = null,
    docRegistry: DocumentRegistry = null,
    settings?: ISettingRegistry.ISettings
  ) {
    this._serverRoot = serverRoot;
    this._docmanager = docmanager;
    this._docRegistry = docRegistry;
    this._settings = settings || null;
    this._taskHandler = new TaskHandler(this);

    // Initialize repository status
    this._clearStatus();

    let interval: number;
    if (settings) {
      interval = settings.composite.refreshInterval as number;
      settings.changed.connect(this._onSettingsChange, this);
    } else {
      interval = DEFAULT_REFRESH_INTERVAL;
    }
    this._statusPoll = new Poll({
      factory: this._refreshModel,
      frequency: {
        interval: interval,
        backoff: true,
        max: 300 * 1000
      },
      standby: this._refreshStandby
    });
    this._fetchPoll = new Poll({
      auto: false,
      factory: this._fetchRemotes,
      frequency: {
        interval,
        backoff: true,
        max: 300 * 1000
      },
      standby: this._refreshStandby
    });
  }

  /**
   * Branch list for the current repository.
   */
  get branches(): Git.IBranch[] {
    return this._branches;
  }

  /**
   * The current repository branch.
   */
  get currentBranch(): Git.IBranch {
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
        .then(([_, path]) => {
          change.newValue = this._pathRepository = path;

          if (change.newValue !== change.oldValue) {
            this.refresh().then(() => this._repositoryChanged.emit(change));
          }
          this._pendingReadyPromise -= 1;
        })
        .catch(reason => {
          this._pendingReadyPromise -= 1;
          console.error(`Fail to find Git top level for path ${v}.\n${reason}`);
        });
    }
  }

  /**
   * Custom model refresh standby condition
   */
  get refreshStandbyCondition(): () => boolean {
    return this._standbyCondition;
  }
  set refreshStandbyCondition(v: () => boolean) {
    this._standbyCondition = v;
  }

  /**
   * Git repository status
   */
  get status(): Git.IStatus {
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
  get statusChanged(): ISignal<IGitExtension, Git.IStatus> {
    return this._statusChanged;
  }

  /**
   * A signal emitted whenever a model event occurs.
   */
  get taskChanged(): ISignal<IGitExtension, string> {
    return this._taskHandler.taskChanged;
  }

  /**
   * Get the current markers
   *
   * Note: This makes sure it always returns non null value
   */
  protected get _currentMarker(): BranchMarker {
    if (!this.__currentMarker) {
      this._setMarker(
        this.pathRepository,
        this._currentBranch ? this._currentBranch.name : ''
      );
    }
    return this.__currentMarker;
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
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async add(...filename: string[]): Promise<void> {
    const path = await this._getPathRepository();
    await this._taskHandler.execute<void>('git:add:files', async () => {
      await requestAPI<void>('add', 'POST', {
        add_all: !filename,
        filename: filename || '',
        top_repo_path: path
      });
    });
    await this.refreshStatus();
  }

  /**
   * Match files status information based on a provided file path.
   *
   * If the file is tracked and has no changes, undefined will be returned
   *
   * @param path the file path relative to the server root
   */
  getFile(path: string): Git.IStatusFile {
    return this._status.files.find(status => {
      return this.getRelativeFilePath(status.to) === path;
    });
  }

  /**
   * Add all "unstaged" files to the repository staging area.
   *
   * @returns promise which resolves upon adding files to the repository staging area
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async addAllUnstaged(): Promise<void> {
    const path = await this._getPathRepository();
    await this._taskHandler.execute<void>(
      'git:add:files:all_unstaged',
      async () => {
        await requestAPI<void>('add_all_unstaged', 'POST', {
          top_repo_path: path
        });
      }
    );
    await this.refreshStatus();
  }

  /**
   * Add all untracked files to the repository staging area.
   *
   * @returns promise which resolves upon adding files to the repository staging area
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async addAllUntracked(): Promise<void> {
    const path = await this._getPathRepository();
    await this._taskHandler.execute<void>(
      'git:add:files:all_untracked',
      async () => {
        await requestAPI<void>('add_all_untracked', 'POST', {
          top_repo_path: path
        });
      }
    );
    await this.refreshStatus();
  }

  /**
   * Add a remote Git repository to the current repository.
   *
   * @param url - remote repository URL
   * @param name - remote name
   * @returns promise which resolves upon adding a remote
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async addRemote(url: string, name?: string): Promise<void> {
    const path = await this._getPathRepository();
    await this._taskHandler.execute<void>('git:add:remote', async () => {
      await requestAPI<void>('remote/add', 'POST', {
        top_repo_path: path,
        url,
        name
      });
    });
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
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async allHistory(count = 25): Promise<Git.IAllHistory> {
    const path = await this._getPathRepository();
    return await this._taskHandler.execute<Git.IAllHistory>(
      'git:fetch:history',
      async () => {
        return await requestAPI<Git.IAllHistory>('all_history', 'POST', {
          current_path: path,
          history_count: count
        });
      }
    );
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
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async checkout(options?: Git.ICheckoutOptions): Promise<Git.ICheckoutResult> {
    const path = await this._getPathRepository();

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

    const data = await this._taskHandler.execute<Git.ICheckoutResult>(
      'git:checkout',
      async () => {
        let changes;
        if (!body.new_check) {
          if (body.checkout_branch && !body.new_check) {
            changes = await this._changedFiles(
              this._currentBranch.name,
              body.branchname
            );
          } else if (body.filename) {
            changes = { files: [body.filename] };
          } else {
            changes = await this._changedFiles('WORKING', 'HEAD');
          }
        }

        const d = await requestAPI<Git.ICheckoutResult>(
          'checkout',
          'POST',
          body
        );

        changes?.files?.forEach(file => this._revertFile(file));
        return d;
      }
    );

    if (body.checkout_branch) {
      await this.refreshBranch();
    } else {
      await this.refreshStatus();
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
   *
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async clone(
    path: string,
    url: string,
    auth?: Git.IAuth
  ): Promise<Git.IResultWithMessage> {
    return await this._taskHandler.execute<Git.IResultWithMessage>(
      'git:clone',
      async () => {
        return await requestAPI<Git.IResultWithMessage>('clone', 'POST', {
          current_path: path,
          clone_url: url,
          auth: auth as any
        });
      }
    );
  }

  /**
   * Commit all staged file changes.
   *
   * @param message - commit message
   * @returns promise which resolves upon committing file changes
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async commit(message: string): Promise<void> {
    const path = await this._getPathRepository();
    await this._taskHandler.execute('git:commit:create', async () => {
      await requestAPI('commit', 'POST', {
        commit_msg: message,
        top_repo_path: path
      });
    });
    await this.refresh();
  }

  /**
   * Get (or set) Git configuration options.
   *
   * @param options - configuration options to set
   * @returns promise which resolves upon either getting or setting configuration options
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async config(options?: JSONObject): Promise<JSONObject | void> {
    const path = await this._getPathRepository();
    return await this._taskHandler.execute<JSONObject | void>(
      'git:config:' + (options ? 'set' : 'get'),
      async () => {
        if (options) {
          await requestAPI('config', 'POST', {
            path,
            options
          });
        } else {
          return await requestAPI<JSONObject>('config', 'POST', { path });
        }
      }
    );
  }

  /**
   * Delete a branch
   *
   * @param branchName Branch name
   * @returns promise which resolves when the branch has been deleted.
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async deleteBranch(branchName: string): Promise<void> {
    const path = await this._getPathRepository();
    await this._taskHandler.execute<void>('git:branch:delete', async () => {
      return await requestAPI<void>('branch/delete', 'POST', {
        current_path: path,
        branch: branchName
      });
    });
  }

  /**
   * Fetch commit information.
   *
   * @param hash - commit hash
   * @returns promise which resolves upon retrieving commit information
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async detailedLog(hash: string): Promise<Git.ISingleCommitFilePathInfo> {
    const path = await this._getPathRepository();
    const data = await this._taskHandler.execute<Git.ISingleCommitFilePathInfo>(
      'git:fetch:commit_log',
      async () => {
        return await requestAPI<Git.ISingleCommitFilePathInfo>(
          'detailed_log',
          'POST',
          {
            selected_hash: hash,
            current_path: path
          }
        );
      }
    );

    data.modified_files = data.modified_files.map(f => {
      f.type = this._resolveFileType(f.modified_file_path);
      return f;
    });
    return data;
  }

  /**
   * Dispose of model resources.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    this._fetchPoll.dispose();
    this._statusPoll.dispose();
    this._taskHandler.dispose();
    Signal.clearData(this);
  }

  /**
   * Ensure a .gitignore file exists
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async ensureGitignore(): Promise<void> {
    const path = await this._getPathRepository();

    await requestAPI('ignore', 'POST', {
      top_repo_path: path
    });
    this._openGitignore();
    await this.refreshStatus();
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
   * Add an entry in .gitignore file
   *
   * @param filePath File to ignore
   * @param useExtension Whether to ignore the file or its extension
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async ignore(filePath: string, useExtension: boolean): Promise<void> {
    const path = await this._getPathRepository();

    await requestAPI('ignore', 'POST', {
      top_repo_path: path,
      file_path: filePath,
      use_extension: useExtension
    });

    this._openGitignore();
    await this.refreshStatus();
  }

  /**
   * Initialize a new Git repository at a specified path.
   *
   * @param path - path at which initialize a Git repository
   * @returns promise which resolves upon initializing a Git repository
   *
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async init(path: string): Promise<void> {
    await this._taskHandler.execute<void>('git:init', async () => {
      await requestAPI('init', 'POST', {
        current_path: path
      });
    });
  }

  /**
   * Retrieve commit logs.
   *
   * @param count - number of commits
   * @returns promise which resolves upon retrieving commit logs
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async log(count = 25): Promise<Git.ILogResult> {
    const path = await this._getPathRepository();
    return await this._taskHandler.execute<Git.ILogResult>(
      'git:fetch:log',
      async () => {
        return await requestAPI<Git.ILogResult>('log', 'POST', {
          current_path: path,
          history_count: count
        });
      }
    );
  }

  /**
   * Fetch changes from a remote repository.
   *
   * @param auth - remote authentication information
   * @returns promise which resolves upon fetching changes
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async pull(auth?: Git.IAuth): Promise<Git.IResultWithMessage> {
    const path = await this._getPathRepository();
    const data = this._taskHandler.execute<Git.IResultWithMessage>(
      'git:pull',
      async () => {
        return await requestAPI<Git.IResultWithMessage>('pull', 'POST', {
          current_path: path,
          auth: auth as any,
          cancel_on_conflict:
            (this._settings?.composite['cancelPullMergeConflict'] as boolean) ||
            false
        });
      }
    );
    this.refreshBranch(); // Will emit headChanged if required
    return data;
  }

  /**
   * Push local changes to a remote repository.
   *
   * @param auth - remote authentication information
   * @returns promise which resolves upon pushing changes
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async push(auth?: Git.IAuth): Promise<Git.IResultWithMessage> {
    const path = await this._getPathRepository();
    const data = this._taskHandler.execute<Git.IResultWithMessage>(
      'git:push',
      async () => {
        return await requestAPI<Git.IResultWithMessage>('push', 'POST', {
          current_path: path,
          auth: auth as any
        });
      }
    );
    this.refreshBranch();
    return data;
  }

  /**
   * Refresh the repository.
   *
   * @returns promise which resolves upon refreshing the repository
   */
  async refresh(): Promise<void> {
    await this._statusPoll.refresh();
    await this._statusPoll.tick;
  }

  /**
   * Refresh the list of repository branches.
   *
   * Emit headChanged if the branch or its top commit changes
   *
   * @returns promise which resolves upon refreshing repository branches
   */
  async refreshBranch(): Promise<void> {
    try {
      const data = await this._taskHandler.execute<Git.IBranchResult>(
        'git:refresh:branches',
        async () => {
          return await this._branch();
        }
      );

      let headChanged = false;
      if (!this._currentBranch || !data) {
        headChanged = this._currentBranch !== data.current_branch; // Object comparison is not working
      } else {
        headChanged =
          this._currentBranch.name !== data.current_branch.name ||
          this._currentBranch.top_commit !== data.current_branch.top_commit;
      }

      this._branches = data.branches;
      this._currentBranch = data.current_branch;
      if (this._currentBranch) {
        // Set up the marker obj for the current (valid) repo/branch combination
        this._setMarker(this.pathRepository, this._currentBranch.name);
      }
      if (headChanged) {
        this._headChanged.emit();
      }

      // Start fetch remotes if the repository has remote branches
      const hasRemote = this._branches.some(branch => branch.is_remote_branch);
      if (hasRemote) {
        this._fetchPoll.start();
      } else {
        this._fetchPoll.stop();
      }
    } catch (error) {
      const headChanged = this._currentBranch !== null;
      this._branches = [];
      this._currentBranch = null;
      this._fetchPoll.stop();
      if (headChanged) {
        this._headChanged.emit();
      }

      if (!(error instanceof Git.NotInRepository)) {
        throw error;
      }
    }
  }

  /**
   * Refresh the repository status.
   *
   * Emit statusChanged if required.
   *
   * @returns promise which resolves upon refreshing the repository status
   */
  async refreshStatus(): Promise<void> {
    let path: string;
    try {
      path = await this._getPathRepository();
    } catch (error) {
      this._clearStatus();
      if (!(error instanceof Git.NotInRepository)) {
        throw error;
      }
      return;
    }

    try {
      const data = await this._taskHandler.execute<Git.IStatusResult>(
        'git:refresh:status',
        async () => {
          return await requestAPI<Git.IStatusResult>('status', 'POST', {
            current_path: path
          });
        }
      );

      this._setStatus({
        branch: data.branch || null,
        remote: data.remote || null,
        ahead: data.ahead || 0,
        behind: data.behind || 0,
        files: data.files?.map(file => {
          return {
            ...file,
            status: decodeStage(file.x, file.y),
            type: this._resolveFileType(file.to)
          };
        })
      });
    } catch (err) {
      // TODO we should notify the user
      this._clearStatus();
      console.error(err);
      return;
    }
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
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async reset(filename?: string): Promise<void> {
    const path = await this._getPathRepository();
    await this._taskHandler.execute<void>('git:reset:changes', async () => {
      const reset_all = filename === undefined;
      let files: string[];
      if (reset_all) {
        files = (await this._changedFiles('INDEX', 'HEAD')).files;
      } else {
        files = [filename];
      }
      await requestAPI('reset', 'POST', {
        reset_all: filename === undefined,
        filename: filename === undefined ? null : filename,
        top_repo_path: path
      });

      files.forEach(file => {
        this._revertFile(file);
      });
    });
    await this.refreshStatus();
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
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async resetToCommit(hash = ''): Promise<void> {
    const path = await this._getPathRepository();
    await this._taskHandler.execute<void>('git:reset:hard', async () => {
      const files = (await this._changedFiles(null, null, hash)).files;

      await requestAPI('reset_to_commit', 'POST', {
        commit_id: hash,
        top_repo_path: path
      });

      files?.forEach(file => {
        this._revertFile(file);
      });
    });
    await this.refreshBranch();
  }

  /**
   * Retrieve the prefix path of a directory `path` with respect to the root repository directory.
   *
   * @param path - directory path
   * @returns promise which resolves upon retrieving the prefix path
   *
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async showPrefix(path: string): Promise<string | null> {
    try {
      const data = await this._taskHandler.execute<Git.IShowPrefixResult>(
        'git:fetch:prefix_path',
        async () => {
          return await requestAPI<Git.IShowPrefixResult>(
            'show_prefix',
            'POST',
            {
              current_path: path
            }
          );
        }
      );
      return data.under_repo_path || null;
    } catch (error) {
      if (
        error instanceof Git.GitResponseError &&
        error.response.status === 500 &&
        error.json.code === 128
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Retrieve the top level repository path.
   *
   * @param path - current path
   * @returns promise which resolves upon retrieving the top level repository path
   *
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async showTopLevel(path: string): Promise<string | null> {
    try {
      const data = await this._taskHandler.execute<Git.IShowTopLevelResult>(
        'git:fetch:top_level_path',
        async () => {
          return await requestAPI<Git.IShowTopLevelResult>(
            'show_top_level',
            'POST',
            {
              current_path: path
            }
          );
        }
      );
      return data.top_repo_path || null;
    } catch (error) {
      if (
        error instanceof Git.GitResponseError &&
        error.response.status === 500 &&
        error.json.code === 128
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Retrieve the list of tags in the repository.
   *
   * @returns promise which resolves upon retrieving the tag list
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async tags(): Promise<Git.ITagResult> {
    const path = await this._getPathRepository();
    return await this._taskHandler.execute<Git.ITagResult>(
      'git:tag:list',
      async () => {
        return await requestAPI<Git.ITagResult>('tags', 'POST', {
          current_path: path
        });
      }
    );
  }

  /**
   * Checkout the specified tag version
   *
   * @param tag - selected tag version
   * @returns promise which resolves upon checking out the tag version of the repository
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async checkoutTag(tag: string): Promise<Git.ICheckoutResult> {
    const path = await this._getPathRepository();
    return await this._taskHandler.execute<Git.ICheckoutResult>(
      'git:tag:checkout',
      async () => {
        return await requestAPI<Git.ICheckoutResult>('tag_checkout', 'POST', {
          current_path: path,
          tag_id: tag
        });
      }
    );
  }

  /**
   * Add a file to the current marker object.
   *
   * @param fname - filename
   * @param mark - mark to set
   */
  addMark(fname: string, mark: boolean): void {
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
  toggleMark(fname: string): void {
    this._currentMarker.toggle(fname);
  }

  /**
   * Register a new diff provider for specified file types
   *
   * @param fileExtensions File type list
   * @param callback Callback to use for the provided file types
   */
  registerDiffProvider<T>(
    name: string,
    fileExtensions: string[],
    callback: Git.Diff.ICallback<T>
  ): void {
    fileExtensions.forEach(fileExtension => {
      DIFF_PROVIDERS[fileExtension.toLocaleLowerCase()] = { name, callback };
    });
  }

  /**
   * Revert changes made after a specified commit.
   *
   * @param message - commit message
   * @param hash - commit identifier (hash)
   * @returns promise which resolves upon reverting changes
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async revertCommit(message: string, hash: string): Promise<void> {
    const path = await this._getPathRepository();
    await this._taskHandler.execute<void>('git:commit:revert', async () => {
      const files = (await this._changedFiles(null, null, hash + '^!')).files;

      await requestAPI('delete_commit', 'POST', {
        commit_id: hash,
        top_repo_path: path
      });

      files?.forEach(file => {
        this._revertFile(file);
      });
    });
    await this.commit(message);
  }

  /**
   * Make request for a list of all git branches in the repository
   * Retrieve a list of repository branches.
   *
   * @returns promise which resolves upon fetching repository branches
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  protected async _branch(): Promise<Git.IBranchResult> {
    const path = await this._getPathRepository();
    return await this._taskHandler.execute<Git.IBranchResult>(
      'git:fetch:branches',
      async () => {
        return await requestAPI<Git.IBranchResult>('branch', 'POST', {
          current_path: path
        });
      }
    );
  }

  /**
   * Get list of files changed between two commits or two branches.
   *
   * Notes:
   *   It assumes the Git path repository as already been checked.
   *
   * @param base id of base commit or base branch for comparison
   * @param remote id of remote commit or remote branch for comparison
   * @param singleCommit id of a single commit
   *
   * @returns the names of the changed files
   *
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  protected async _changedFiles(
    base?: string,
    remote?: string,
    singleCommit?: string
  ): Promise<Git.IChangedFilesResult> {
    return await requestAPI<Git.IChangedFilesResult>('changed_files', 'POST', {
      current_path: this.pathRepository,
      base: base,
      remote: remote,
      single_commit: singleCommit
    });
  }

  /**
   * Clear repository status
   */
  protected _clearStatus(): void {
    this._status = {
      branch: null,
      remote: null,
      ahead: 0,
      behind: 0,
      files: []
    };
  }

  /**
   * Get the current Git repository path
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   */
  protected async _getPathRepository(): Promise<string> {
    await this.ready;

    const path = this.pathRepository;
    if (path === null) {
      throw new Git.NotInRepository();
    }
    return path;
  }

  /**
   * Resolve path to filetype
   */
  protected _resolveFileType(path: string): DocumentRegistry.IFileType {
    // test if directory
    if (path.endsWith('/')) {
      return DocumentRegistry.getDefaultDirectoryFileType();
    }

    return (
      this._docRegistry.getFileTypesForPath(path)[0] ||
      DocumentRegistry.getDefaultTextFileType()
    );
  }

  /**
   * Set the repository status.
   *
   * @param v - repository status
   */
  protected _setStatus(v: Git.IStatus): void {
    let areEqual =
      this._status.ahead === v.ahead &&
      this._status.behind === v.behind &&
      this._status.branch === v.branch &&
      this._status.files.length === v.files.length;
    if (areEqual) {
      for (const file of v.files) {
        if (
          this._status.files.findIndex(
            oldFile =>
              oldFile.from === file.from &&
              oldFile.to === file.to &&
              oldFile.x === file.x &&
              oldFile.y === file.y
          )
        ) {
          areEqual = false;
          break;
        }
      }
    }

    if (!areEqual) {
      this._status = v;
      this._statusChanged.emit(this._status);
    }
  }

  /**
   * Fetch poll action.
   */
  private _fetchRemotes = async (): Promise<void> => {
    try {
      const current_path = await this._getPathRepository();
      await requestAPI('remote/fetch', 'POST', { current_path });
    } catch (error) {
      console.error('Failed to fetch remotes', error);
    }
  };

  /**
   * Callback invoked upon a change to plugin settings.
   *
   * @private
   * @param settings - plugin settings
   */
  private _onSettingsChange(settings: ISettingRegistry.ISettings) {
    this._fetchPoll.frequency = {
      ...this._fetchPoll.frequency,
      interval: settings.composite.refreshInterval as number
    };
    this._statusPoll.frequency = {
      ...this._statusPoll.frequency,
      interval: settings.composite.refreshInterval as number
    };
  }

  /**
   * open new editor or show an existing editor of the
   * .gitignore file. If the editor does not have unsaved changes
   * then ensure the editor's content matches the file on disk
   */
  private _openGitignore(): void {
    if (this._docmanager) {
      const widget = this._docmanager.openOrReveal(
        this.getRelativeFilePath('.gitignore')
      );
      if (widget && !widget.context.model.dirty) {
        widget.context.revert();
      }
    }
  }

  /**
   * Refresh model status through a Poll
   */
  private _refreshModel = async (): Promise<void> => {
    await this._taskHandler.execute<void>('git:refresh', async () => {
      try {
        await this.refreshBranch();
        await this.refreshStatus();
      } catch (error) {
        console.error('Failed to refresh git status', error);
      }
    });
  };

  /**
   * Standby test function for the refresh Poll
   *
   * Standby refresh if
   * - webpage is hidden
   * - not in a git repository
   * - standby condition is true
   *
   * @returns The test function
   */
  private _refreshStandby = (): boolean | Poll.Standby => {
    if (this.pathRepository === null || this._standbyCondition()) {
      return true;
    }

    return 'when-hidden';
  };

  /**
   * if file is open in JupyterLab find the widget and ensure the JupyterLab
   * version matches the version on disk. Do nothing if the file has unsaved changes
   *
   * @param path path to the file to be reverted
   */
  private _revertFile(path: string): void {
    const widget = this._docmanager.findWidget(this.getRelativeFilePath(path));
    if (widget && !widget.context.model.dirty) {
      widget.context.revert();
    }
  }

  /**
   * Set the marker object for a repository path and branch.
   */
  private _setMarker(path: string, branch: string): void {
    this.__currentMarker = this._markerCache.get(path, branch);
  }

  private _status: Git.IStatus;
  private _pathRepository: string | null = null;
  private _branches: Git.IBranch[] = [];
  private _currentBranch: Git.IBranch | null = null;
  private _serverRoot: string;
  private _docmanager: IDocumentManager | null;
  private _docRegistry: DocumentRegistry | null;
  private _fetchPoll: Poll;
  private _isDisposed = false;
  private _markerCache: Markers = new Markers(() => this._markChanged.emit());
  private __currentMarker: BranchMarker = null;
  private _readyPromise: Promise<void> = Promise.resolve();
  private _pendingReadyPromise = 0;
  private _settings: ISettingRegistry.ISettings | null;
  private _standbyCondition: () => boolean = () => false;
  private _statusPoll: Poll;
  private _taskHandler: TaskHandler<IGitExtension>;

  private _headChanged = new Signal<IGitExtension, void>(this);
  private _markChanged = new Signal<IGitExtension, void>(this);
  private _repositoryChanged = new Signal<
    IGitExtension,
    IChangedArgs<string | null>
  >(this);
  private _statusChanged = new Signal<IGitExtension, Git.IStatus>(this);
}

export class BranchMarker implements Git.IBranchMarker {
  constructor(private _refresh: () => void) {}

  add(fname: string, mark = true): void {
    if (!(fname in this._marks)) {
      this.set(fname, mark);
    }
  }

  get(fname: string): boolean {
    return this._marks[fname];
  }

  set(fname: string, mark: boolean): void {
    this._marks[fname] = mark;
    this._refresh();
  }

  toggle(fname: string): void {
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
