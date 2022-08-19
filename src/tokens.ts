import { Toolbar } from '@jupyterlab/apputils';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { Contents, ServerConnection } from '@jupyterlab/services';
import { ITranslator } from '@jupyterlab/translation';
import { JSONObject, ReadonlyJSONObject, Token } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

export const EXTENSION_ID = 'jupyter.extensions.git_plugin';

export const IGitExtension = new Token<IGitExtension>(EXTENSION_ID);

/** Interface for extension class */
export interface IGitExtension extends IDisposable {
  /**
   * The list of branch in the current repo
   */
  branches: Git.IBranch[];

  /**
   * The current branch
   */
  currentBranch: Git.IBranch;

  /**
   * A signal emitted when the branches of the Git repository changes.
   */
  readonly branchesChanged: ISignal<IGitExtension, void>;

  /**
   * A signal emitted when the `HEAD` of the Git repository changes.
   */
  readonly headChanged: ISignal<IGitExtension, void>;

  /**
   * Top level path of the current Git repository
   */
  pathRepository: string | null;

  /**
   * A signal emitted when the current Git repository changes.
   */
  readonly repositoryChanged: ISignal<IGitExtension, IChangedArgs<string>>;

  /**
   * Test whether the model is ready;
   * i.e. if the top folder repository has been found.
   */
  isReady: boolean;

  /**
   * A promise that fulfills when the model is ready;
   * i.e. if the top folder repository has been found.
   */
  ready: Promise<void>;

  /**
   * Custom model refresh standby condition
   */
  refreshStandbyCondition: () => boolean;

  /**
   * Selected file for single file history
   */
  selectedHistoryFile: Git.IStatusFile | null;

  /**
   * Boolean indicating whether there are dirty staged files
   * (e.g., due to unsaved changes on files that have been previously staged).
   */
  hasDirtyFiles: boolean;

  /**
   * Boolean indicating whether credentials are required from the user.
   */
  credentialsRequired: boolean;

  /**
   * A signal emitted whenever credentials are required, or are not required anymore.
   */
  readonly credentialsRequiredChanged: ISignal<IGitExtension, boolean>;

  /**
   * Git repository status.
   */
  readonly status: Git.IStatus;

  /**
   * A signal emitted when the current status of the Git repository changes.
   */
  readonly statusChanged: ISignal<IGitExtension, Git.IStatus>;

  /**
   * A signal emitted whenever a model task event occurs.
   */
  readonly taskChanged: ISignal<IGitExtension, string>;

  /**
   * A signal emitted when the current file selected for history of the Git repository changes.
   */
  readonly selectedHistoryFileChanged: ISignal<
    IGitExtension,
    Git.IStatusFile | null
  >;

  /**
   * A signal emitted when files that are behind the remote branch are opened.
   */
  readonly notifyRemoteChanges: ISignal<
    IGitExtension,
    Git.IRemoteChangedNotification | null
  >;

  /**
   * A signal emitted indicating whether there are dirty (e.g., unsaved) staged files.
   * This signal is emitted when there is a dirty staged file but none in prior,
   * and vice versa, when there are no dirty staged files but there were previously.
   */
  readonly dirtyFilesStatusChanged: ISignal<IGitExtension, boolean>;

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
  add(...filename: string[]): Promise<void>;

  /**
   * Add all "unstaged" files to the repository staging area.
   *
   * @returns promise which resolves upon adding files to the repository staging area
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  addAllUnstaged(): Promise<void>;

  /**
   * Add all untracked files to the repository staging area.
   *
   * @returns promise which resolves upon adding files to the repository staging area
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  addAllUntracked(): Promise<void>;

  /**
   * Add the file named fname to the current marker with given mark
   *
   * @param fname Filename
   * @param mark Mark to set
   */
  addMark(fname: string, mark: boolean): void;

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
  addRemote(url: string, name?: string): Promise<void>;

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
  allHistory(historyCount?: number): Promise<Git.IAllHistory>;

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
  checkout(options?: Git.ICheckoutOptions): Promise<Git.ICheckoutResult>;

  /**
   * Make request to checkout the specified tag version
   *
   * @param tag of the version to checkout
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  checkoutTag(tag: string): Promise<Git.ICheckoutResult>;

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
  clone(
    path: string,
    url: string,
    auth?: Git.IAuth
  ): Promise<Git.IResultWithMessage>;

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
  commit(message: string): Promise<void>;

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
  config(options?: JSONObject): Promise<JSONObject | void>;

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
  deleteBranch(branchName: string): Promise<void>;

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
  detailedLog(hash: string): Promise<Git.ISingleCommitFilePathInfo>;

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
  diff(previous?: string, current?: string): Promise<Git.IDiffResult>;

  /**
   * Ensure a .gitignore file exists
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  ensureGitignore(): Promise<void>;

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
  fetch(auth?: Git.IAuth): Promise<Git.IResultWithMessage>;

  /**
   * Match files status information based on a provided file path.
   *
   * If the file is tracked and has no changes, a StatusFile of unmodified will be returned
   *
   * @param path the file path relative to the server root
   */
  getFile(path: string): Git.IStatusFile;

  /**
   * Get current mark of file named fname
   *
   * @param fname Filename
   * @returns Mark of the file
   */
  getMark(fname: string): boolean;

  /**
   * Gets the path of the file relative to the Jupyter server root.
   *
   * If no path is provided, returns the Git repository top folder relative path.
   * If no Git repository selected, return null
   *
   * @param path the file path relative to Git repository top folder
   * @returns Relative file path to the server root
   */
  getRelativeFilePath(path?: string): string | null;

  /**
   * Add an entry in .gitignore file
   *
   * @param filename The name of the entry to ignore
   * @param useExtension Ignore all files having the same extension as filename
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  ignore(filename: string, useExtension: boolean): Promise<void>;

  /**
   * Initialize a new Git repository at a specified path.
   *
   * @param path - path at which initialize a Git repository
   * @returns promise which resolves upon initializing a Git repository
   *
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  init(path: string): Promise<void>;

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
  log(historyCount?: number): Promise<Git.ILogResult>;

  /**
   * Merge the given branch with the current one.
   *
   * @param branch to merge into the current branch
   * @returns promise which resolves upon merge action
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  merge(branch: string): Promise<Git.IResultWithMessage>;

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
  pull(auth?: Git.IAuth): Promise<Git.IResultWithMessage>;

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
  push(
    auth?: Git.IAuth,
    force?: boolean,
    remote?: string
  ): Promise<Git.IResultWithMessage>;

  /**
   * General Git refresh
   */
  refresh(): Promise<void>;

  /**
   * Make request for a list of all Git branches
   */
  refreshBranch(): Promise<void>;

  /**
   * Determines whether there are unsaved changes on staged files,
   * e.g., the user has made changes to a file that has been staged,
   * but has not saved them.
   * Emits a signal indicating if there are unsaved changes.
   * @returns promise that resolves upon refreshing the dirty status of staged files
   */
  refreshDirtyStatus(): Promise<void>;

  /**
   * Request Git status refresh
   */
  refreshStatus(): Promise<void>;

  /**
   * gets a list of files that have changed in the remote branch
   */
  remoteChangedFiles(): Promise<Git.IStatusFile[]>;

  /**
   * Notifies user is a file that is attached has is behind changes in the remote branch with a pop-up Dialog
   */
  checkRemoteChangeNotified(): Promise<void>;

  /**
   * Register a new diff provider for specified file types
   *
   * @param name provider name
   * @param fileExtensions File extensions list
   * @param callback Callback to use for the provided file types
   */
  registerDiffProvider(
    name: string,
    fileExtensions: string[],
    callback: Git.Diff.ICallback
  ): void;

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
  reset(filename?: string): Promise<void>;

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
  resetToCommit(hash: string): Promise<void>;

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
  revertCommit(message: string, hash: string): Promise<void>;

  /**
   * Get the prefix path of a directory 'path',
   * with respect to the root directory of repository
   *
   * @param path Path for which the prefix is searched for
   * @returns Path prefix
   *
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  showPrefix(path: string): Promise<string | null>;

  /**
   * Get the top level path of repository 'path'
   *
   * @param path Path from which the top Git repository needs to be found
   *
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  showTopLevel(path: string): Promise<string | null>;

  /**
   * Make request to list all the tags present in the remote repo
   *
   * @returns list of tags
   *
   * @throws {Git.NotInRepository} If the current path is not a Git repository
   * @throws {Git.GitResponseError} If the server response is not ok
   * @throws {ServerConnection.NetworkError} If the request cannot be made
   */
  tags(): Promise<Git.ITagResult>;

  /**
   * Toggle the mark for the file named fname
   *
   * @param fname Filename
   */
  toggleMark(fname: string): void;
}

export namespace Git {
  export namespace Diff {
    /**
     * Diff widget interface
     */
    export interface IDiffWidget extends Widget {
      /**
       * Diff model
       */
      readonly model: Git.Diff.IModel;
      /**
       * Gets the file model of a resolved merge conflict,
       * and rejects if unable to retrieve
       */
      getResolvedFile(): Promise<Partial<Contents.IModel>>;
      /**
       * Checks if the conflicted file has been resolved.
       */
      readonly isFileResolved: boolean;
      /**
       * Refresh the diff widget
       *
       * Note: Update the content and recompute the diff
       */
      refresh(): Promise<void>;
    }

    /**
     * Callback to generate a comparison widget
     *
     * The toolbar is the one of the MainAreaWidget in which the diff widget
     * will be displayed.
     */
    export type ICallback = (
      model: IModel,
      toolbar?: Toolbar,
      trans?: ITranslator
    ) => Promise<IDiffWidget>;

    /**
     * Content and its context for diff
     */
    export interface IContent {
      /**
       * Asynchronous content getter for the source
       */
      content: () => Promise<string>;
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
      /**
       * Last time at which the content was updated.
       *
       * Optional, can be useful to trigger model changed signal
       */
      updateAt?: number;
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
    export interface IContext {
      currentRef: string | SpecialRef.WORKING | SpecialRef.INDEX;
      previousRef: string | SpecialRef;
      // Used only during merge conflict diffs
      baseRef?: string | SpecialRef.BASE;
    }

    /**
     * DiffModel properties
     */
    export interface IModel {
      /**
       * Challenger data
       */
      challenger: IContent;
      /**
       * Signal emitted when the reference or the challenger changes
       */
      readonly changed: ISignal<IModel, IModelChange>;
      /**
       * File of the name being diff at reference state
       *
       * Note: This is the relative path
       */
      readonly filename: string;
      /**
       * Reference data
       */
      reference: IContent;
      /**
       * Optional base data, used only during merge conflicts
       */
      base?: IContent;
      /**
       * Helper to check if the file has conflicts.
       */
      hasConflict?: boolean;
      /**
       * Git repository path
       *
       * Note: This is relative to the server root
       */
      readonly repositoryPath?: string;
    }

    /**
     * DiffModel changed signal argument
     */
    export interface IModelChange {
      /**
       * Which content did change
       */
      type: 'reference' | 'challenger' | 'base';
    }

    export enum SpecialRef {
      // Working version
      'WORKING',
      // Index version
      'INDEX',
      // Common ancestor version (useful for unmerged files)
      'BASE'
    }
  }

  /**
   * Interface for GitAllHistory request result,
   * has all repo information
   */
  export interface IAllHistory {
    code: number;
    data?: {
      show_top_level?: IShowTopLevelResult;
      branch?: IBranchResult;
      log?: ILogResult;
      status?: IStatusResult;
    };
  }

  /**
   * Interface for server settings
   */
  export interface IServerSettings {
    /**
     * Frontend version formatted as Python package version
     */
    frontendVersion?: string;
    /**
     * Git version (X.Y.Z)
     */
    gitVersion?: string;
    /**
     * Server extension version formatted as Python package version
     */
    serverVersion: string;
  }

  /**
   * Interface for GitShowTopLevel request result,
   * has the Git root directory inside a repository
   */
  export interface IShowTopLevelResult {
    /**
     * Git command return code
     */
    code: number;
    /**
     * Git repository root path
     */
    path?: string;
  }

  /**
   * Interface for GitShowPrefix request result,
   * has the prefix path of a directory in a repository,
   * with respect to the root directory.
   */
  export interface IShowPrefixResult {
    /**
     * Git command return code
     */
    code: number;
    /**
     * Relative path of the current folder within its Git repository
     */
    path?: string;
  }

  /**
   * Interface to call the checkout method
   *
   * If a branch name is provided, check it out (with or without creating it)
   * If a filename is provided, check the file out
   * If nothing is provided, check all files out
   */
  export interface ICheckoutOptions {
    /**
     * Branch name
     */
    branchname?: string;
    /**
     * Is it a new branch?
     */
    newBranch?: boolean;
    /**
     * The commit (branch name, tag, or commit id) to which a new branch HEAD will point.
     */
    startpoint?: string;
    /**
     * Filename
     */
    filename?: string;
  }

  /** Interface for GitCheckout request result.
   * For reporting errors in checkout
   */
  export interface ICheckoutResult {
    code: number;
    message?: string;
  }

  /**
   * Branch description interface
   */
  export interface IBranch {
    is_current_branch: boolean;
    is_remote_branch: boolean;
    name: string;
    upstream: string | null;
    top_commit: string;
    tag: string | null;
  }

  /** Interface for GitBranch request result,
   * has the result of fetching info on all branches
   */
  export interface IBranchResult {
    code: number;
    branches?: IBranch[];
    current_branch?: IBranch;
  }

  /**
   * Data interface of diffcontent request
   */
  export interface IDiffContent {
    /**
     * File content
     */
    content: string;
  }

  /**
   * Interface for GitDiff request result
   */
  export interface IDiffResult {
    code: number;
    command?: string;
    message?: string;
    result?: {
      insertions: string;
      deletions: string;
      filename: string;
      filetype?: DocumentRegistry.IFileType;
    }[];
  }

  /**
   * Git repository status
   */
  export interface IStatus {
    /**
     * Current branch
     */
    branch: string | null;
    /**
     * Tracked upstream branch
     */
    remote: string | null;
    /**
     * Number of commits ahead
     */
    ahead: number;
    /**
     * Number of commits behind
     */
    behind: number;
    /**
     * Files status
     */
    files: IStatusFile[];
  }

  /** Interface for GitStatus request result,
   * has the status of each changed file
   */
  export interface IStatusFileResult {
    x: string;
    y: string;
    to: string;
    from: string;
    is_binary: boolean | null;
    // filetype as determined by app.docRegistry
    type?: DocumentRegistry.IFileType;
  }

  /**
   * Changed file attributes
   */
  export interface IStatusFile extends IStatusFileResult {
    status: Status;
  }

  /** Interface for GitStatus request result,
   * has the status of the entire repo
   */
  export interface IStatusResult {
    code: number;
    branch?: string;
    remote?: string | null;
    ahead?: number;
    behind?: number;
    files?: IStatusFileResult[];
  }

  /** Interface for changed_files request result
   * lists the names of files that have differences between two commits
   * or between two branches, or that were changed by a single commit
   */
  export interface IChangedFilesResult {
    code: number;
    files?: string[];
  }

  /** Interface for notifying users of opened files that are behind
   * the remote branch
   */
  export interface IRemoteChangedNotification {
    notNotified: IStatusFile[];
    notified: IStatusFile[];
  }

  /** Interface for GitLog request result,
   * has the info of a single past commit
   */
  export interface ISingleCommitInfo {
    commit: string;
    author: string;
    date: string;
    commit_msg: string;
    pre_commits: string[];

    // properties for single file history
    is_binary?: boolean;
    file_path?: string;

    // when file has been relocated
    previous_file_path?: string;
  }

  /** Interface for GitCommit request result,
   * has the info of a committed file
   */
  export interface ICommitModifiedFile {
    modified_file_path: string;
    modified_file_name: string;
    insertion: string;
    deletion: string;
    is_binary: boolean | null;
    // filetype as determined by app.docRegistry
    type?: DocumentRegistry.IFileType;
    // when file has been relocated
    previous_file_path?: string;
  }

  /** Interface for GitDetailedLog request result,
   * has the detailed info of a single past commit
   */
  export interface ISingleCommitFilePathInfo {
    code: number;
    commit_body?: string;
    modified_file_note?: string;
    modified_files_count?: string;
    number_of_insertions?: string;
    number_of_deletions?: string;
    modified_files?: ICommitModifiedFile[];
  }

  /** Interface for GitLog request result,
   * has the info of all past commits
   */
  export interface ILogResult {
    code: number;
    commits?: ISingleCommitInfo[];
  }

  export interface IIdentity {
    name: string;
    email: string;
  }

  /**
   * Interface for the Git Auth request with credentials caching option.
   */
  export interface IAuth {
    username: string;
    password: string;
    cache_credentials?: boolean;
  }

  /**
   * Structure for the request to the Git Remote Add API.
   */
  export interface IGitRemote {
    url: string;
    name: string;
  }

  /**
   * Interface for GitRemoteShowDetails request result,
   * has the name and urls of all remotes
   */
  export interface IGitRemoteResult {
    code: number;
    command: string;
    remotes: Git.IGitRemote[];
  }

  /**
   * Structure for the request to the Git Clone API.
   */
  export interface IGitClone {
    current_path: string;
    clone_url: string;
    auth?: IAuth;
  }

  /**
   * Structure for the request to the Git Clone API.
   */
  export interface IPushPull {
    current_path: string;
    auth?: IAuth;
    cancel_on_conflict?: boolean;
  }

  /**
   * Structure for commands with informative output
   */
  export interface IResultWithMessage {
    /**
     * Git process return code
     */
    code: number;
    /**
     * Git process result message
     */
    message: string;
  }

  /**
   * Interface for a marker obj
   */
  export interface IBranchMarker {
    add(fname: string, mark: boolean): void;

    get(fname: string): boolean;

    set(fname: string, mark: boolean): void;

    toggle(fname: string): void;
  }

  export type Status =
    | 'untracked'
    | 'staged'
    | 'unstaged'
    | 'partially-staged'
    | 'remote-changed'
    | 'unmodified'
    | 'unmerged'
    | null;

  export interface ITagResult {
    code: number;
    message?: string;
    tags?: string[];
  }

  /**
   * A wrapped error for a fetch response.
   */
  export class GitResponseError extends ServerConnection.ResponseError {
    /**
     * Create a new response error.
     */
    constructor(
      response: Response,
      message = `Invalid response: ${response.status} ${response.statusText}`,
      traceback = '',
      json: ReadonlyJSONObject = {}
    ) {
      super(response, message);
      this.traceback = traceback; // traceback added in mother class in 2.2.x
      this._json = json;
    }

    /**
     * The error response JSON body
     */
    get json(): ReadonlyJSONObject {
      return this._json;
    }

    /**
     * The traceback associated with the error.
     */
    traceback: string;

    protected _json: ReadonlyJSONObject;
  }
  export class NotInRepository extends Error {
    constructor() {
      super('Not in a Git Repository');
    }
  }

  /**
   * Interface for dialog with one checkbox.
   */
  export interface ICheckboxFormValue {
    /**
     * Checkbox value
     */
    checked: boolean;
  }
}

/**
 * Log message severity.
 */
export enum Level {
  SUCCESS = 10,
  INFO = 20,
  RUNNING = 30,
  WARNING = 40,
  ERROR = 50
}

/**
 * Interface describing a component log message.
 */
export interface ILogMessage {
  /**
   * Detailed message
   */
  details?: string;

  /**
   * Error object.
   */
  error?: Error;

  /**
   * Message level.
   */
  level: Level;

  /**
   * Message text.
   */
  message: string;
}

/**
 * The command IDs used in the git context menus.
 */
export enum ContextCommandIDs {
  gitCommitAmendStaged = 'git:context-commitAmendStaged',
  gitFileAdd = 'git:context-add',
  gitFileDiff = 'git:context-diff',
  gitFileDiscard = 'git:context-discard',
  gitFileDelete = 'git:context-delete',
  gitFileOpen = 'git:context-open',
  gitFileUnstage = 'git:context-unstage',
  gitFileStage = 'git:context-stage',
  gitFileTrack = 'git:context-track',
  gitFileHistory = 'git:context-history',
  gitIgnore = 'git:context-ignore',
  gitIgnoreExtension = 'git:context-ignoreExtension',
  gitNoAction = 'git:no-action',
  openFileFromDiff = 'git:open-file-from-diff'
}

/**
 * The command IDs used by the git plugin.
 */
export enum CommandIDs {
  gitUI = 'git:ui',
  gitTerminalCommand = 'git:terminal-command',
  gitInit = 'git:init',
  gitOpenUrl = 'git:open-url',
  gitToggleSimpleStaging = 'git:toggle-simple-staging',
  gitToggleDoubleClickDiff = 'git:toggle-double-click-diff',
  gitManageRemote = 'git:manage-remote',
  gitClone = 'git:clone',
  gitMerge = 'git:merge',
  gitOpenGitignore = 'git:open-gitignore',
  gitPush = 'git:push',
  gitPull = 'git:pull',
  gitResetToRemote = 'git:reset-to-remote',
  gitSubmitCommand = 'git:submit-commit',
  gitShowDiff = 'git:show-diff'
}
