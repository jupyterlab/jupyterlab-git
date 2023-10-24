import { IChangedArgs, PathExt, URLExt } from '@jupyterlab/coreutils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { JSONExt, JSONObject } from '@lumino/coreutils';
import { Poll } from '@lumino/polling';
import { ISignal, Signal } from '@lumino/signaling';
import { AUTH_ERROR_MESSAGES, requestAPI } from './git';
import { TaskHandler } from './taskhandler';
import { Git, IGitExtension } from './tokens';
import { decodeStage } from './utils';

// Default refresh interval (in milliseconds) for polling the current Git status (NOTE: this value should be the same value as in the plugin settings schema):
const DEFAULT_REFRESH_INTERVAL = 3000; // ms
// Available diff providers
const DIFF_PROVIDERS: {
  [key: string]: { name: string; factory: Git.Diff.Factory };
} = {};

/**
 * Get the diff provider for a filename
 * @param filename Filename to look for
 * @returns The diff provider callback or undefined
 */
export function getDiffProvider(
  filename: string
): Git.Diff.Factory | undefined {
  return DIFF_PROVIDERS[PathExt.extname(filename)?.toLocaleLowerCase() ?? '']
    ?.factory;
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
    docmanager: IDocumentManager | null = null,
    docRegistry: DocumentRegistry | null = null,
    settings?: ISettingRegistry.ISettings
  ) {
    this._docmanager = docmanager;
    this._docRegistry = docRegistry;
    this._settings = settings || null;
    this._taskHandler = new TaskHandler(this);

    // Initialize repository status
    this._clearStatus();

    const interval = DEFAULT_REFRESH_INTERVAL;
    this._statusPoll = new Poll({
      factory: this._refreshModel,
      frequency: {
        interval,
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

    if (settings) {
      settings.changed.connect(this._onSettingsChange, this);
      this._onSettingsChange(settings);
    }
  }

  /**
   * Branch list for the current repository.
   */
  get branches(): Git.IBranch[] {
    return this._branches;
  }

  /**
   * Tags list for the current repository.
   */
  get tagsList(): Git.ITag[] {
    return this._tagsList;
  }

  /**
   * The current repository branch.
   */
  get currentBranch(): Git.IBranch | null {
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
    const change: IChangedArgs<string | null> = {
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
      const currentFolder = v;
      this._readyPromise = Promise.all([
        currentReady,
        this.showPrefix(currentFolder)
      ])
        .then(([_, path]) => {
          if (path !== null) {
            // Remove relative path to get the Git repository root path
            path = currentFolder.slice(
              0,
              Math.max(0, currentFolder.length - path.length)
            );
          }
          change.newValue = this._pathRepository = path;

          if (change.newValue !== change.oldValue) {
            this.refresh().then(() => this._repositoryChanged.emit(change));
          }
          this._pendingReadyPromise -= 1;
        })
        .catch(reason => {
          this._pendingReadyPromise -= 1;
          console.error(
            `Fail to find Git top level for path ${currentFolder}.\n${reason}`
          );
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
   * Selected file for single file history
   */
  get selectedHistoryFile(): Git.IStatusFile | null {
    return this._selectedHistoryFile;
  }
  set selectedHistoryFile(file: Git.IStatusFile | null) {
    if (this._selectedHistoryFile !== file) {
      this._selectedHistoryFile = file;
      this._selectedHistoryFileChanged.emit(file);
    }
  }

  /**
   * Last author
   *
   */
  get lastAuthor(): Git.IIdentity | null {
    return this._lastAuthor;
  }

  set lastAuthor(lastAuthor: Git.IIdentity | null) {
    this._lastAuthor = lastAuthor;
  }

  /**
   * Git repository status
   */
  get status(): Git.IStatus {
    return this._status;
  }

  /**
   * A signal emitted when the branches of the Git repository changes.
   */
  get branchesChanged(): ISignal<IGitExtension, void> {
    return this._branchesChanged;
  }

  /**
   * A signal emitted when the `HEAD` of the Git repository changes.
   */
  get headChanged(): ISignal<IGitExtension, void> {
    return this._headChanged;
  }

  /**
   * A signal emitted when the list of the Git repository changes.
   */
  get tagsChanged(): ISignal<IGitExtension, void> {
    return this._tagsChanged;
  }

  /**
   * A signal emitted when the current marking of the Git repository changes.
   */
  get markChanged(): ISignal<IGitExtension, void> {
    return this._markChanged;
  }

  /**
   * A signal emitted when the current file selected for history of the Git repository changes.
   */
  get selectedHistoryFileChanged(): ISignal<
    IGitExtension,
    Git.IStatusFile | null
  > {
    return this._selectedHistoryFileChanged;
  }

  /**
   *  A signal emitted when the Git stash changes.
   *
   */
  get stashChanged(): ISignal<IGitExtension, IChangedArgs<Git.IStash[]>> {
    return this._stashChanged;
  }

  /**
   * The repository stash
   */
  get stash(): Git.IStash[] {
    return this._stash;
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
   * A signal emitted when the Git repository remote changes.
   */
  get remoteChanged(): ISignal<
    IGitExtension,
    Git.IRemoteChangedNotification | null
  > {
    return this._remoteChanged;
  }

  /**
   * Boolean indicating whether there are dirty files
   * A dirty file is a file with unsaved changes that is staged in classical mode
   * or modified in simple mode.
   */
  get hasDirtyFiles(): boolean {
    return this._hasDirtyFiles;
  }
  set hasDirtyFiles(value: boolean) {
    if (this._hasDirtyFiles !== value) {
      this._hasDirtyFiles = value;
      this._dirtyFilesStatusChanged.emit(value);
    }
  }

  /**
   * A signal emitted indicating whether there are dirty (e.g., unsaved) staged files.
   * This signal is emitted when there is a dirty staged file but none previously,
   * and vice versa, when there are no dirty staged files but there were some previously.
   */
  get dirtyFilesStatusChanged(): ISignal<IGitExtension, boolean> {
    return this._dirtyFilesStatusChanged;
  }

  /**
   * Boolean indicating whether credentials are required from the user.
   */
  get credentialsRequired(): boolean {
    return this._credentialsRequired;
  }

  set credentialsRequired(value: boolean) {
    if (this._credentialsRequired !== value) {
      this._credentialsRequired = value;
      this._credentialsRequiredChanged.emit(value);
    }
  }

  /**
   * A signal emitted whenever credentials are required, or are not required anymore.
   */
  get credentialsRequiredChanged(): ISignal<IGitExtension, boolean> {
    return this._credentialsRequiredChanged;
  }

  /**
   * Get the current markers
   *
   * Note: This makes sure it always returns non null value
   */
  protected get _currentMarker(): BranchMarker {
    if (!this.pathRepository) {
      return new BranchMarker(() => {});
    }

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
      await requestAPI<void>(URLExt.join(path, 'add'), 'POST', {
        add_all: !filename,
        filename: filename || ''
      });
    });
    await this.refreshStatus();
  }

  /**
   * Match files status information based on a provided file path.
   *
   * If the file is tracked and has no changes, a StatusFile of unmodified will be returned.
   *
   * @param path the file path relative to the server root
   * @returns The file status or null if path repository is null or path not in repository
   */
  getFile(path: string): Git.IStatusFile | null {
    if (this.pathRepository === null) {
      return null;
    }
    const fileStatus = this._status?.files
      ? this._status.files.find(status => {
          return this.getRelativeFilePath(status.to) === path;
        })
      : null;

    if (!fileStatus) {
      const relativePath = PathExt.relative(
        '/' + this.pathRepository,
        '/' + path
      );

      if (relativePath.startsWith('../')) {
        return null;
      } else {
        return {
          x: '',
          y: '',
          to: relativePath,
          from: '',
          is_binary: null,
          status: 'unmodified',
          type: this._resolveFileType(path)
        };
      }
    } else {
      return fileStatus;
    }
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
        await requestAPI<void>(URLExt.join(path, 'add_all_unstaged'), 'POST');
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
        await requestAPI<void>(URLExt.join(path, 'add_all_untracked'), 'POST');
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
      await requestAPI<void>(URLExt.join(path, 'remote', 'add'), 'POST', {
        url,
        name
      });
    });
  }

  /**
   * Show remote repository for the current repository
   * @returns promise which resolves to a list of remote repositories
   */
  async getRemotes(): Promise<Git.IGitRemote[]> {
    const path = await this._getPathRepository();
    const result = await this._taskHandler.execute<Git.IGitRemoteResult>(
      'git:show:remote',
      async () => {
        return await requestAPI<Git.IGitRemoteResult>(
          URLExt.join(path, 'remote', 'show'),
          'GET'
        );
      }
    );
    return result.remotes;
  }

  /**
   * Remove a remote repository by name
   * @param name name of remote to remove
   */
  async removeRemote(name: string): Promise<void> {
    const path = await this._getPathRepository();
    await this._taskHandler.execute<void>('git:remove:remote', async () => {
      await requestAPI<void>(URLExt.join(path, 'remote', name), 'DELETE');
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
        return await requestAPI<Git.IAllHistory>(
          URLExt.join(path, 'all_history'),
          'POST',
          {
            history_count: count
          }
        );
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
      filename: ''
    };

    if (options !== undefined) {
      if (options.branchname) {
        body.branchname = options.branchname;
        body.checkout_branch = true;
        body.new_check = options.newBranch === true;
        if (options.newBranch) {
          body.startpoint = options.startpoint || this._currentBranch!.name;
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
              this._currentBranch!.name,
              body.branchname
            );
          } else if (body.filename) {
            changes = { files: [body.filename] };
          } else {
            changes = await this._changedFiles('WORKING', 'HEAD');
          }
        }

        const d = await requestAPI<Git.ICheckoutResult>(
          URLExt.join(path, 'checkout'),
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
   * Merge a branch into the current branch
   *
   * @param branch The branch to merge into the current branch
   */
  async merge(branch: string): Promise<Git.IResultWithMessage> {
    const path = await this._getPathRepository();
    return this._taskHandler.execute<Git.IResultWithMessage>(
      'git:merge',
      () => {
        return requestAPI<Git.IResultWithMessage>(
          URLExt.join(path, 'merge'),
          'POST',
          {
            branch
          }
        );
      }
    );
  }

  /**
   * Clone a repository.
   *
   * @param path - local path into which the repository will be cloned
   * @param url - Git repository URL
   * @param auth - remote repository authentication information
   * @param versioning - boolean flag of Git metadata (default true)
   * @param submodules - boolean flag of Git submodules (default false)
   * @returns promise which resolves upon cloning a repository
   *
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async clone(
    path: string,
    url: string,
    auth?: Git.IAuth,
    versioning = true,
    submodules = false
  ): Promise<Git.IResultWithMessage> {
    return await this._taskHandler.execute<Git.IResultWithMessage>(
      'git:clone',
      async () => {
        return await requestAPI<Git.IResultWithMessage>(
          URLExt.join(path, 'clone'),
          'POST',
          {
            clone_url: url,
            versioning: versioning,
            submodules: submodules,
            auth: auth as any
          }
        );
      }
    );
  }

  /**
   * Commit all staged file changes. If message is None, then the commit is amended
   *
   * @param message - commit message
   * @param amend - whether this is an amend commit
   * @param author - override the commit author specified in config
   * @returns promise which resolves upon committing file changes
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async commit(
    message: string | null = null,
    amend = false,
    author: string | null = null
  ): Promise<void> {
    const path = await this._getPathRepository();
    await this._taskHandler.execute('git:commit:create', async () => {
      await requestAPI(URLExt.join(path, 'commit'), 'POST', {
        commit_msg: message,
        amend: amend,
        author: author ?? null
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
          await requestAPI(URLExt.join(path, 'config'), 'POST', {
            options
          });
        } else {
          return await requestAPI<JSONObject>(
            URLExt.join(path, 'config'),
            'POST'
          );
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
      return await requestAPI<void>(
        URLExt.join(path, 'branch', 'delete'),
        'POST',
        {
          branch: branchName
        }
      );
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
          URLExt.join(path, 'detailed_log'),
          'POST',
          {
            selected_hash: hash
          }
        );
      }
    );

    data.modified_files = (data.modified_files ?? []).map(f => {
      f.type = this._resolveFileType(f.modified_file_path);
      return f;
    });
    return data;
  }

  /**
   * Get the diff of two commits.
   * If no commit is provided, the diff of HEAD and INDEX is returned.
   * If the current commit (the commit to compare) is not provided,
   * the diff of the previous commit and INDEX is returned.
   *
   * @param previous - the commit to compare against
   * @param current - the commit to compare
   * @returns promise which resolves upon retrieving the diff
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async diff(previous?: string, current?: string): Promise<Git.IDiffResult> {
    const path = await this._getPathRepository();
    const data = await this._taskHandler.execute<Git.IDiffResult>(
      'git:diff',
      async () => {
        return await requestAPI<Git.IDiffResult>(
          URLExt.join(path, 'diff'),
          'POST',
          {
            previous,
            current
          }
        );
      }
    );
    data.result = (data.result ?? []).map(f => {
      f.filetype = this._resolveFileType(f.filename);
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
    this._settings?.changed.disconnect(this._onSettingsChange, this);
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

    await requestAPI(URLExt.join(path, 'ignore'), 'POST', {});
    this._openGitignore();
    await this.refreshStatus();
  }

  /**
   * Fetch to get ahead/behind status
   *
   * @param auth - remote authentication information
   * @returns promise which resolves upon fetching
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async fetch(auth?: Git.IAuth): Promise<Git.IResultWithMessage> {
    const path = await this._getPathRepository();
    const data = this._taskHandler.execute<Git.IResultWithMessage>(
      'git:fetch:remote',
      async () => {
        return await requestAPI<Git.IResultWithMessage>(
          URLExt.join(path, 'remote', 'fetch'),
          'POST',
          {
            auth: auth as any
          }
        );
      }
    );
    return data;
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
    if (this.pathRepository === null) {
      return null;
    }
    return PathExt.join(this.pathRepository, path ?? '');
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

    await requestAPI(URLExt.join(path, 'ignore'), 'POST', {
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
      await requestAPI(URLExt.join(path, 'init'), 'POST');
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
        try {
          return await requestAPI<Git.ILogResult>(
            URLExt.join(path, 'log'),
            'POST',
            {
              history_count: count,
              follow_path: this.selectedHistoryFile?.to
            }
          );
        } catch (error) {
          return { code: 1 };
        }
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
    const previousHead = this._currentBranch?.top_commit;
    const data = await this._taskHandler.execute<Git.IResultWithMessage>(
      'git:pull',
      async () => {
        return await requestAPI<Git.IResultWithMessage>(
          URLExt.join(path, 'pull'),
          'POST',
          {
            auth: auth as any,
            cancel_on_conflict:
              (this._settings?.composite[
                'cancelPullMergeConflict'
              ] as boolean) || false
          }
        );
      }
    );
    const changes = await this._changedFiles(previousHead, 'HEAD');
    changes?.files?.forEach(file => this._revertFile(file));
    await this.refreshBranch(); // Will emit headChanged if required
    return data;
  }

  /**
   * Push local changes to a remote repository.
   *
   * @param auth - remote authentication information
   * @param force - whether or not to force the push
   * @returns promise which resolves upon pushing changes
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async push(
    auth?: Git.IAuth,
    force = false,
    remote?: string
  ): Promise<Git.IResultWithMessage> {
    const path = await this._getPathRepository();
    const data = this._taskHandler.execute<Git.IResultWithMessage>(
      'git:push',
      async () => {
        return await requestAPI<Git.IResultWithMessage>(
          URLExt.join(path, 'push'),
          'POST',
          {
            auth: auth as any,
            force: force,
            remote
          }
        );
      }
    );
    this.refreshBranch();
    return data;
  }

  /**
   * Rebase the current branch onto the provided one.
   *
   * @param branch to rebase onto
   * @returns promise which resolves upon rebase action
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async rebase(branch: string): Promise<Git.IResultWithMessage> {
    const path = await this._getPathRepository();
    return this._taskHandler.execute<Git.IResultWithMessage>(
      'git:rebase',
      () => {
        return requestAPI<Git.IResultWithMessage>(
          URLExt.join(path, 'rebase'),
          'POST',
          {
            branch
          }
        );
      }
    );
  }

  /**
   * Resolve in progress rebase.
   *
   * @param action to perform
   * @returns promise which resolves upon rebase action
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async resolveRebase(
    action: 'continue' | 'skip' | 'abort'
  ): Promise<Git.IResultWithMessage> {
    const path = await this._getPathRepository();
    return this._taskHandler.execute<Git.IResultWithMessage>(
      'git:rebase:resolve',
      () =>
        requestAPI<Git.IResultWithMessage>(
          URLExt.join(path, 'rebase'),
          'POST',
          { action }
        )
    );
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
          this._currentBranch.name !== data.current_branch?.name ||
          this._currentBranch.top_commit !== data.current_branch?.top_commit;
      }

      const branchesChanged = !JSONExt.deepEqual(
        this._branches as any,
        (data.branches ?? []) as any
      );

      this._branches = data.branches ?? [];

      this._currentBranch = data.current_branch ?? null;
      if (this._currentBranch && this._pathRepository) {
        // Set up the marker obj for the current (valid) repo/branch combination
        this._setMarker(this.pathRepository!, this._currentBranch.name);
      }
      if (headChanged) {
        this._headChanged.emit();
      }
      if (branchesChanged) {
        this._branchesChanged.emit();
      }

      // Start fetch remotes if the repository has remote branches
      const hasRemote = this._branches.some(branch => branch.is_remote_branch);
      if (hasRemote) {
        this._fetchPoll.start();
      } else {
        this._fetchPoll.stop();
      }
    } catch (error) {
      const branchesChanged = this._branches.length > 0;
      const headChanged = this._currentBranch !== null;
      this._branches = [];
      this._currentBranch = null;
      this._fetchPoll.stop();
      if (headChanged) {
        this._headChanged.emit();
      }
      if (branchesChanged) {
        this._branchesChanged.emit();
      }

      if (!(error instanceof Git.NotInRepository)) {
        throw error;
      }
    }
  }

  /**
   * Refresh the list of repository tags.
   *
   * @returns promise which resolves upon refreshing repository tags
   */
  async refreshTag(): Promise<void> {
    try {
      const data = await this._taskHandler.execute<Git.ITagResult>(
        'git:refresh:tags',
        async () => {
          return await this.tags();
        }
      );

      const newTags = data.tags ?? [];
      const tagsChanged = !JSONExt.deepEqual(
        this._tagsList as any,
        newTags as any
      );

      this._tagsList = newTags;

      if (tagsChanged) {
        this._tagsChanged.emit();
      }
      this._fetchPoll.stop();
    } catch (error) {
      const tagsChanged = this._tagsList.length > 0;
      this._tagsList = [];
      this._fetchPoll.stop();
      if (tagsChanged) {
        this._tagsChanged.emit();
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
          return await requestAPI<Git.IStatusResult>(
            URLExt.join(path, 'status'),
            'POST'
          );
        }
      );
      const files = data.files?.map(file => {
        return {
          ...file,
          status: decodeStage(file.x, file.y),
          type: this._resolveFileType(file.to)
        };
      });
      this._setStatus({
        branch: data.branch ?? null,
        remote: data.remote ?? null,
        ahead: data.ahead ?? 0,
        behind: data.behind ?? 0,
        state: data.state ?? 0,
        files: files ?? []
      });
      await this.refreshDirtyStatus();
    } catch (err) {
      // TODO we should notify the user
      this._clearStatus();
      console.error(err);
      return;
    }
  }

  /**
   * Collects files that have changed on the remote branch.
   *
   */
  async remoteChangedFiles(): Promise<Git.IStatusFile[]> {
    // if a file is changed on remote add it to list of files with appropriate status.
    this._remoteChangedFiles.length = 0;
    try {
      if (this.status.remote && this.status.behind > 0) {
        this._remoteChangedFiles.concat(
          (
            (await this._changedFiles('WORKING', this.status.remote)).files ??
            []
          ).map(element => ({
            status: 'remote-changed',
            type: this._resolveFileType(element),
            x: '?',
            y: 'B',
            to: element,
            from: '?',
            is_binary: false
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
    return this._remoteChangedFiles;
  }

  /**
   * Determines if opened files are behind the remote and emits a signal if one
   * or more are behind and the user hasn't been notified of them yet.
   *
   */
  async checkRemoteChangeNotified(): Promise<void> {
    if (this.status.remote && this.status.behind > 0) {
      const notNotified: Git.IStatusFile[] = [];
      const notified: Git.IStatusFile[] = [];
      for (const val of this._remoteChangedFiles) {
        const filePath = this.getRelativeFilePath(val.to);
        if (!filePath) {
          continue;
        }
        const docWidget = this._docmanager?.findWidget(filePath);
        const notifiedIndex = this._changeUpstreamNotified.findIndex(
          notified =>
            notified.from === val.from &&
            notified.to === val.to &&
            notified.x === val.x &&
            notified.y === val.y
        );
        if (docWidget !== undefined) {
          if (docWidget.isAttached) {
            // notify if the user hasn't been notified yet
            if (notifiedIndex === -1) {
              this._changeUpstreamNotified.push(val);
              notNotified.push(val);
            } else {
              notified.push(val);
            }
          }
        } else {
          // remove from notified array if document is closed
          if (notifiedIndex > -1) {
            this._changeUpstreamNotified.splice(notifiedIndex, 1);
          }
        }
      }
      if (this._settings?.composite['openFilesBehindWarning']) {
        if (notNotified.length > 0) {
          this._remoteChanged.emit({ notNotified, notified });
        }
      }
    } else {
      this._changeUpstreamNotified = [];
    }
  }

  /**
   * Determines whether there are unsaved changes on files,
   *
   * @returns promise that resolves upon refreshing the dirty status of files
   */
  async refreshDirtyStatus(): Promise<void> {
    // we assume the repository status has been refreshed prior to this

    // get files
    const files = this.status.files.filter(file =>
      this._statusForDirtyState.includes(file.status)
    );
    const fileNames = files.map(file => file.to);

    let result = false;

    for (const fileName of fileNames) {
      const filePath = this.getRelativeFilePath(fileName);
      if (!filePath) {
        continue;
      }
      const docWidget = this._docmanager?.findWidget(filePath);
      if (docWidget !== undefined) {
        const context = this._docmanager?.contextForWidget(docWidget);
        if (context?.model.dirty) {
          result = true;
          break;
        }
      }
    }

    this.hasDirtyFiles = result;
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
        files = (await this._changedFiles('INDEX', 'HEAD')).files ?? [];
      } else {
        files = [filename!];
      }
      await requestAPI(URLExt.join(path, 'reset'), 'POST', {
        reset_all,
        filename: filename ?? null
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
      const files = (await this._changedFiles(undefined, undefined, hash))
        .files;

      await requestAPI(URLExt.join(path, 'reset_to_commit'), 'POST', {
        commit_id: hash
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
            URLExt.join(path, 'show_prefix'),
            'POST'
          );
        }
      );
      return data.path ?? null;
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
            URLExt.join(path, 'show_top_level'),
            'POST'
          );
        }
      );
      return data.path ?? null;
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
   * Apply a given stash
   *
   * @param index - Index of the stash to apply.
   * @returns promise which resolves upon task completion
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async applyStash(index: number): Promise<void> {
    const path = await this._getPathRepository();
    try {
      const stashFiles = index
        ? this._stash[index].files
        : this._stash[0].files;

      await this._taskHandler.execute<void>('git:stash:apply', async () => {
        await requestAPI(
          URLExt.join(path, 'stash_apply'),
          'POST',
          index !== undefined ? { index } : { index: 0 }
        );
      });

      await this.refresh();

      stashFiles.forEach(file => {
        this._revertFile(file);
      });
    } catch (error) {
      console.error('Failed to apply stash', error);
    }
    await this.refreshStash();
  }

  /**
   * Drop a stash entry, or clear the entire stash.
   *
   * @param index The index of the stash to be deleted. If no index is provided, the entire stash will be cleared.
   *
   * @returns promise which resolves when the task is done
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async dropStash(index?: number): Promise<void> {
    let path: string;
    try {
      path = await this._getPathRepository();
      await this._taskHandler.execute<void>('git:stash:drop', async () => {
        const url =
          (index ?? -1) >= 0
            ? URLExt.join(path, `stash?stash_index=${index}`)
            : URLExt.join(path, 'stash');
        await requestAPI(url, 'DELETE');
      });

      await this.refreshStash();

      await this._refreshModel();
    } catch (error) {
      this._clearStatus();
      if (!(error instanceof Git.NotInRepository)) {
        throw error;
      }
      return;
    }
  }

  /**
   * Pop a stash
   * @param index - Index of the stash to pop; pop the latest if not provided.
   * @returns promise which resolves upon task completion
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   *
   */
  async popStash(index?: number): Promise<void> {
    try {
      const path = await this._getPathRepository();

      const stashFiles = (index ?? -1) >= 0 ? this._stash[index!].files : [];

      await this._taskHandler.execute<void>('git:stash:pop', async () => {
        await requestAPI(
          URLExt.join(path, 'stash_pop'),
          'POST',
          index !== undefined ? { index } : undefined
        );
      });

      await this.refresh();

      stashFiles.forEach(file => {
        this._revertFile(file);
      });
    } catch (error) {
      console.error('Failed to pop stash', error);
    }

    await this.refreshStash();
  }

  /**
   * Checks the stash list, and sets the stash property.
   *
   * @returns promise which resolves when the task is done.
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async refreshStash(): Promise<void> {
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

    // Get the entire stash list
    try {
      const response = await this._taskHandler.execute<Git.IStashListResult>(
        'git:refresh:stash',
        async () => {
          return await requestAPI<Git.IStashListResult>(
            URLExt.join(path, 'stash'),
            'GET'
          );
        }
      );

      const allStashFiles = await this._taskHandler.execute<
        Git.IStashShowResult[]
      >('git:refresh:stash', () =>
        Promise.all(
          response.stashes.map(({ index }) =>
            requestAPI<Git.IStashShowResult>(
              URLExt.join(path, 'stash') + `?index=${index}`,
              'GET'
            )
          )
        )
      );
      const stashList: Git.IStash[] = response.stashes.map((s, index) =>
        Object.assign(s, {
          files: allStashFiles[index].files
        })
      );

      if (!this.isStashDeepEqual(stashList, this._stash)) {
        const change: IChangedArgs<Git.IStash[]> = {
          name: 'stash',
          newValue: stashList,
          oldValue: this._stash
        };
        this._stash = stashList;
        this._stashChanged.emit(change);
      }
    } catch (err) {
      console.error(err);
      return;
    }
  }

  /**
   * Stash the current changes in a dirty repository.
   * @param stashMsg - Stash message
   * @returns promise which resolves upon stashing changes
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async stashChanges(stashMsg?: string): Promise<void> {
    try {
      const path = await this._getPathRepository();

      await this._taskHandler.execute<void>('git:stash', async () => {
        await requestAPI(
          URLExt.join(path, 'stash'),
          'POST',
          stashMsg !== undefined ? { stashMsg } : undefined
        );
      });

      await this.refreshStash();
      // Assume the latest stash is accurate
      if (this._stash?.length > 0) {
        this._stash[0].files.forEach(file => {
          this._revertFile(file);
        });
      } else {
        console.error('Failed to retrieve stashed files');
      }
    } catch (error) {
      console.error('Error stashing changes:', error);
    }
  }

  /**
   * Compares two arrays of stash entries for deep equality.
   *
   * @param a The first array of stash entries to be compared.
   * @param b The second array of stash entries to be compared.
   * @returns boolean value indicating if both arrays of stash entries are deeply equal.
   *
   * @returns promise which resolves to an array of stashes
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  protected isStashDeepEqual(a: Git.IStash[], b: Git.IStash[]): boolean {
    if (a?.length !== b?.length) {
      return false;
    }

    return a.every((stashA, i) => {
      const stashB = b[i];
      return (
        stashA.index === stashB.index &&
        stashA.branch === stashB.branch &&
        stashA.message === stashB.message &&
        JSON.stringify(stashA.files) === JSON.stringify(stashB.files)
      );
    });
  }

  /**
   * Retrieve the list of tags in the repository, with the respective commits they point to.
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
        return await requestAPI<Git.ITagResult>(
          URLExt.join(path, 'tags'),
          'POST'
        );
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
        return await requestAPI<Git.ICheckoutResult>(
          URLExt.join(path, 'tag_checkout'),
          'POST',
          {
            tag_id: tag
          }
        );
      }
    );
  }

  /**
   * Set a tag pointing to a specific commit.
   *
   * @param tagName - name of new tag
   * @param commitId - identifier of commit tag is pointing to
   * @returns promise which resolves upon succesfully creating the new tag
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  async setTag(tag: string, commitId: string): Promise<void> {
    const path = await this._getPathRepository();
    await this._taskHandler.execute<void>('git:tag:create', async () => {
      return await requestAPI<void>(URLExt.join(path, 'tag'), 'POST', {
        tag_id: tag,
        commit_id: commitId
      });
    });
    await this.refreshTag();
  }

  /**
   * Add a file to the current marker object.
   *
   * @param fname - filename
   * @param mark - mark to set
   */
  addMark(fname: string, mark: boolean): void {
    this._currentMarker?.add(fname, mark);
  }

  /**
   * Set a file in the current marker object.
   *
   * @param fname - filename
   * @param mark - mark to set
   */
  setMark(fname: string, mark: boolean): void {
    this._currentMarker?.set(fname, mark);
  }

  /**
   * Return the current mark associated with a specified filename.
   *
   * @param fname - filename
   * @returns mark
   */
  getMark(fname: string): boolean {
    return this._currentMarker?.get(fname) ?? false;
  }

  /**
   * Toggle the mark for a file in the current marker object
   *
   * @param fname - filename
   */
  toggleMark(fname: string): void {
    this._currentMarker?.toggle(fname);
  }

  get markedFiles(): Git.IStatusFile[] {
    return this._currentMarker!.markedFilePaths.filter(path =>
      this.status.files.some(file => file.to === path)
    ).map(
      path => this.status.files.find(fileStatus => fileStatus.to === path)!
    );
  }

  /**
   * Register a new diff provider for specified file extensions
   *
   * @param fileExtensions File extension list
   * @param factory Callback to use for the provided file extensions
   */
  registerDiffProvider(
    name: string,
    fileExtensions: string[],
    factory: Git.Diff.Factory
  ): void {
    fileExtensions.forEach(extension => {
      DIFF_PROVIDERS[extension] = { name, factory };
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
      const files = (
        await this._changedFiles(undefined, undefined, hash + '^!')
      ).files;

      await requestAPI(URLExt.join(path, 'delete_commit'), 'POST', {
        commit_id: hash
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
        return await requestAPI<Git.IBranchResult>(
          URLExt.join(path, 'branch'),
          'POST'
        );
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
    return await requestAPI<Git.IChangedFilesResult>(
      URLExt.join(this.pathRepository!, 'changed_files'),
      'POST',
      {
        base: base,
        remote: remote,
        single_commit: singleCommit
      }
    );
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
      state: Git.State.DEFAULT,
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
      this._docRegistry?.getFileTypesForPath(path)[0] ??
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
      this._status.state === v.state &&
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
   * This is blocked if Git credentials are required.
   */
  private _fetchRemotes = async (): Promise<void> => {
    if (this.credentialsRequired) {
      return;
    }
    try {
      await this.fetch();
    } catch (error) {
      console.error('Failed to fetch remotes', error);
      if (
        AUTH_ERROR_MESSAGES.some(
          errorMessage => (error as Error).message.indexOf(errorMessage) > -1
        )
      ) {
        this.credentialsRequired = true;
      }
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

    this._statusForDirtyState = (settings.composite.simpleStaging as boolean)
      ? ['staged', 'partially-staged', 'unstaged']
      : ['staged', 'partially-staged'];
    this.refreshDirtyStatus();
  }

  /**
   * open new editor or show an existing editor of the
   * .gitignore file. If the editor does not have unsaved changes
   * then ensure the editor's content matches the file on disk
   */
  private _openGitignore(): void {
    const filePath = this.getRelativeFilePath('.gitignore');
    if (this._docmanager && filePath) {
      const widget = this._docmanager.openOrReveal(filePath);
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
        await this.refreshTag();
        await this.refreshStatus();
        await this.refreshStash();
        await this.checkRemoteChangeNotified();
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
    const filePath = this.getRelativeFilePath(path);
    if (!filePath) {
      return;
    }
    const widget = this._docmanager?.findWidget(filePath);
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

  private _status: Git.IStatus = {
    branch: null,
    remote: null,
    ahead: 0,
    behind: 0,
    state: Git.State.DEFAULT,
    files: []
  };
  private _stash: Git.IStash[] = [];
  private _pathRepository: string | null = null;
  private _branches: Git.IBranch[] = [];
  private _tagsList: Git.ITag[] = [];
  private _currentBranch: Git.IBranch | null = null;
  private _docmanager: IDocumentManager | null;
  private _docRegistry: DocumentRegistry | null;
  private _fetchPoll: Poll;
  private _isDisposed = false;
  private _markerCache = new Markers(() => this._markChanged.emit());
  private __currentMarker: BranchMarker = new BranchMarker(() => {});
  private _readyPromise: Promise<void> = Promise.resolve();
  private _pendingReadyPromise = 0;
  private _settings: ISettingRegistry.ISettings | null;
  private _standbyCondition: () => boolean = () => false;
  private _statusPoll: Poll;
  private _taskHandler: TaskHandler<IGitExtension>;
  private _remoteChangedFiles: Git.IStatusFile[] = [];
  private _changeUpstreamNotified: Git.IStatusFile[] = [];
  private _selectedHistoryFile: Git.IStatusFile | null = null;
  private _hasDirtyFiles = false;
  private _credentialsRequired = false;
  private _lastAuthor: Git.IIdentity | null = null;

  // Configurable
  private _statusForDirtyState: Git.Status[] = ['staged', 'partially-staged'];

  private _branchesChanged = new Signal<IGitExtension, void>(this);
  private _tagsChanged = new Signal<IGitExtension, void>(this);
  private _headChanged = new Signal<IGitExtension, void>(this);
  private _markChanged = new Signal<IGitExtension, void>(this);
  private _selectedHistoryFileChanged = new Signal<
    IGitExtension,
    Git.IStatusFile | null
  >(this);
  private _repositoryChanged = new Signal<
    IGitExtension,
    IChangedArgs<string | null>
  >(this);
  private _stashChanged = new Signal<IGitExtension, IChangedArgs<Git.IStash[]>>(
    this
  );
  private _statusChanged = new Signal<IGitExtension, Git.IStatus>(this);
  private _remoteChanged = new Signal<
    IGitExtension,
    Git.IRemoteChangedNotification | null
  >(this);
  private _dirtyFilesStatusChanged = new Signal<IGitExtension, boolean>(this);
  private _credentialsRequiredChanged = new Signal<IGitExtension, boolean>(
    this
  );
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

  get markedFilePaths(): string[] {
    const markedFiles: string[] = [];
    for (const key in this._marks) {
      if (this._marks[key]) {
        markedFiles.push(key);
      }
    }
    return markedFiles;
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
