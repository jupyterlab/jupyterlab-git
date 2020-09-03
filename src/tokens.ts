import { IChangedArgs } from '@jupyterlab/coreutils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { Token, JSONObject } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { ISignal } from '@lumino/signaling';
import { CommandRegistry } from '@lumino/commands';

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
   * A signal emitted when the `HEAD` of the Git repository changes.
   */
  readonly headChanged: ISignal<IGitExtension, void>;

  /**
   * A signal emitted whenever a model event occurs.
   */
  readonly logger: ISignal<IGitExtension, string>;

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
   * Files list resulting of a Git status call.
   */
  readonly status: Git.IStatusFileResult[];

  /**
   * A signal emitted when the current status of the Git repository changes.
   */
  readonly statusChanged: ISignal<IGitExtension, Git.IStatusFileResult[]>;

  readonly commands: CommandRegistry | null;

  /**
   * Make request to add one or all files into
   * the staging area in repository
   *
   * If filename is not provided, all files will be added.
   *
   * @param filename Optional name of the files to add
   */
  add(...filename: string[]): Promise<Response>;

  /**
   * Make request to add all unstaged files into
   * the staging area in repository 'path'
   */
  addAllUnstaged(): Promise<Response>;

  /**
   * Make request to add all untracked files into
   * the staging area in repository
   */
  addAllUntracked(): Promise<Response>;

  /**
   * Add the file named fname to the current marker with given mark
   *
   * @param fname Filename
   * @param mark Mark to set
   */
  addMark(fname: string, mark: boolean): void;

  /**
   * Get current mark of file named fname
   *
   * @param fname Filename
   * @returns Mark of the file
   */
  getMark(fname: string): boolean;

  /**
   * Toggle the mark for the file named fname
   *
   * @param fname Filename
   */
  toggleMark(fname: string): void;

  /**
   * Add a remote Git repository to the current repository
   *
   * @param url Remote repository URL
   * @param name Remote name
   */
  addRemote(url: string, name?: string): Promise<void>;

  /**
   * Make request for all Git info of the repository
   * (This API is also implicitly used to check if the current repo is a Git repo)
   *
   * @param historyCount: Optional number of commits to get from Git log
   * @returns Repository history
   */
  allHistory(historyCount?: number): Promise<Git.IAllHistory>;

  /** Make request to switch current working branch,
   * create new branch if needed,
   * or discard a specific file change or all changes
   * TODO: Refactor into seperate endpoints for each kind of checkout request
   *
   * If a branch name is provided, check it out (with or without creating it)
   * If a filename is provided, check the file out
   * If nothing is provided, check all files out
   *
   * @param options Checkout options
   * @returns Command execution status
   */
  checkout(options?: Git.ICheckoutOptions): Promise<Git.ICheckoutResult>;

  /**
   * Make request for the Git clone API.
   *
   * @param path Local path in which the repository will be cloned
   * @param url Distant Git repository URL
   * @param auth Optional authentication information for the remote repository
   * @returns Command execution status
   */
  clone(path: string, url: string, auth?: Git.IAuth): Promise<Git.ICloneResult>;

  /**
   * Make request to commit all staged files in repository
   *
   * @param message Commit message
   */
  commit(message: string): Promise<Response>;

  /**
   * Get or set Git configuration options
   *
   * @param options Configuration options to set (undefined to get)
   */
  config(options?: JSONObject): Promise<Response>;

  /**
   * Make request to revert changes from selected commit
   *
   * @param message Commit message to use for the new repository state
   * @param commitId Selected commit ID
   */
  revertCommit(message: string, commitId: string): Promise<Response>;

  /**
   * Make request for detailed Git commit info of
   * commit 'hash'
   *
   * @param hash Commit hash
   * @returns Detailed log of the commit
   */
  detailedLog(hash: string): Promise<Git.ISingleCommitFilePathInfo>;

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
   * Make request to initialize a  new Git repository at path 'path'
   *
   * @param path Folder path to initialize as a Git repository.
   */
  init(path: string): Promise<Response>;

  /**
   * Make request for Git commit logs
   *
   * @param historyCount: Optional number of commits to get from Git log
   * @returns Repository logs
   */
  log(historyCount?: number): Promise<Git.ILogResult>;

  /**
   * Make request for the Git Pull API.
   *
   * @param auth Optional authentication information for the remote repository
   * @returns Command execution status
   */
  pull(auth?: Git.IAuth): Promise<Git.IPushPullResult>;

  /**
   * Make request for the Git Push API.
   *
   * @param auth Optional authentication information for the remote repository
   * @returns Command execution status
   */
  push(auth?: Git.IAuth): Promise<Git.IPushPullResult>;

  /**
   * General Git refresh
   */
  refresh(): Promise<void>;

  /**
   * Make request for a list of all Git branches
   */
  refreshBranch(): Promise<void>;

  /**
   * Request Git status refresh
   */
  refreshStatus(): Promise<void>;

  /**
   * Register a new diff provider for specified file types
   *
   * @param filetypes File type list
   * @param callback Callback to use for the provided file types
   */
  registerDiffProvider(filetypes: string[], callback: Git.IDiffCallback): void;

  /**
   * Make request to move one or all files from the staged to the unstaged area
   *
   * If filename is not provided, all files will be reset.
   *
   * @param filename Optional name of the file to add
   */
  reset(filename?: string): Promise<Response>;

  /**
   * Make request to reset to selected commit
   *
   * @param commitId Selected commit ID
   */
  resetToCommit(commitId: string): Promise<Response>;

  /**
   * Make request for the prefix path of a directory 'path',
   * with respect to the root directory of repository
   *
   * @param path Path for which the prefix is searched for
   * @returns Path prefix
   */
  showPrefix(path: string): Promise<Git.IShowPrefixResult>;

  /**
   * Make request for top level path of repository 'path'
   *
   * @param path Path from which the top Git repository needs to be found
   */
  showTopLevel(path: string): Promise<Git.IShowTopLevelResult>;

  /**
   * Ensure a .gitignore file exists
   */
  ensureGitignore(): Promise<Response>;

  /**
   * Add an entry in .gitignore file
   *
   * @param filename The name of the entry to ignore
   * @param useExtension Ignore all files having the same extension as filename
   */
  ignore(filename: string, useExtension: boolean): Promise<Response>;

  /*
   * Make request to list all the tags present in the remote repo
   *
   * @returns list of tags
   */
  tags(): Promise<Git.ITagResult>;

  /**
   * Make request to checkout the specified tag version
   *
   * @param tag of the version to checkout
   */
  checkoutTag(tag: string): Promise<Git.ICheckoutResult>;
}

export namespace Git {
  /** Function type for diffing a file's revisions */
  export type IDiffCallback = (
    filename: string,
    revisionA: string,
    revisionB: string
  ) => void;

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
     * Server absolute root path (as posix)
     */
    serverRoot: string;
    /**
     * Server extension version formatted as Python package version
     */
    serverVersion: string;
  }

  /** Interface for GitShowTopLevel request result,
   * has the Git root directory inside a repository
   */
  export interface IShowTopLevelResult {
    code: number;
    top_repo_path?: string;
  }

  /** Interface for GitShowPrefix request result,
   * has the prefix path of a directory in a repository,
   * with respect to the root directory.
   */
  export interface IShowPrefixResult {
    code: number;
    under_repo_path?: string;
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
    upstream: string;
    top_commit: string;
    tag: string;
  }

  /** Interface for GitBranch request result,
   * has the result of fetching info on all branches
   */
  export interface IBranchResult {
    code: number;
    branches?: IBranch[];
    current_branch?: IBranch;
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
    files?: IStatusFileResult[];
  }

  /** Interface for changed_files request result
   * lists the names of files that have differences between two commits
   * or beween two branches, or that were changed by a single commit
   */
  export interface IChangedFilesResult {
    code: number;
    files?: string[];
  }

  /** Interface for GitLog request result,
   * has the info of a single past commit
   */
  export interface ISingleCommitInfo {
    commit: string;
    author: string;
    date: string;
    commit_msg: string;
    pre_commit: string;
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
  }

  /** Interface for GitDetailedLog request result,
   * has the detailed info of a single past commit
   */
  export interface ISingleCommitFilePathInfo {
    code: number;
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
   * Interface for the Git Auth request.
   */
  export interface IAuth {
    username: string;
    password: string;
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
   * Structure for the result of the Git Clone API.
   */
  export interface ICloneResult {
    code: number;
    message?: string;
  }

  /**
   * Structure for the result of the Git Push & Pull API.
   */
  export interface IPushPullResult {
    code: number;
    message?: string;
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
    | null;

  export interface ITagResult {
    code: number;
    message?: string;
    tags?: string[];
  }
}

/**
 * Log message severity.
 */
export type Severity = 'error' | 'warning' | 'info' | 'success';

/**
 * Interface describing a component log message.
 */
export interface ILogMessage {
  /**
   * Message severity.
   */
  severity: Severity;

  /**
   * Message text.
   */
  message: string;
}
