import { IChangedArgs } from '@jupyterlab/coreutils';
import { Token, JSONObject } from '@phosphor/coreutils';
import { ISignal } from '@phosphor/signaling';

export const EXTENSION_ID = 'jupyter.extensions.git_plugin';

// tslint:disable-next-line: variable-name
export const IGitExtension = new Token<IGitExtension>(EXTENSION_ID);

/** Interface for extension class */
export interface IGitExtension {
  /**
   * A signal emitted when the HEAD of the git repository changes.
   */
  readonly headChanged: ISignal<IGitExtension, void>;

  /**
   * Top level path of the current git repository
   */
  pathRepository: string | null;

  /**
   * A signal emitted when the current git repository changes.
   */
  readonly repositoryChanged: ISignal<IGitExtension, IChangedArgs<string>>;

  /**
   * Files list resulting of a git status call.
   */
  readonly status: Git.IStatusFileResult[];

  /**
   * A signal emitted when the current status of the git repository changes.
   */
  readonly statusChanged: ISignal<IGitExtension, Git.IStatusFileResult[]>;

  /**
   * Make request for the Git Pull API.
   *
   * @param auth Optional authentication information for the remote repository
   */
  pull(auth?: Git.IAuth): Promise<Git.IPushPullResult>;

  /**
   * Make request for the Git Push API.
   *
   * @param auth Optional authentication information for the remote repository
   */
  push(auth?: Git.IAuth): Promise<Git.IPushPullResult>;

  /**
   * Make request for the Git Clone API.
   *
   * @param path Local path in which the repository will be cloned
   * @param url Distant Git repository URL
   * @param auth Optional authentication information for the remote repository
   */
  clone(path: string, url: string, auth?: Git.IAuth): Promise<Git.ICloneResult>;

  /**
   * Make request for all git info of the repository
   * (This API is also implicitly used to check if the current repo is a Git repo)
   *
   * @param historyCount: Optional number of commits to get from git log
   */
  allHistory(historyCount?: number): Promise<Git.IAllHistory>;

  /**
   * Make request for top level path of repository 'path'
   *
   * @param path Path from which the top Git repository needs to be found
   */
  showTopLevel(path: string): Promise<Git.IShowTopLevelResult>;

  /**
   * Make request for the prefix path of a directory 'path',
   * with respect to the root directory of repository
   *
   * @param path Path for which the prefix is searched for
   */
  showPrefix(path: string): Promise<Git.IShowPrefixResult>;

  /**
   * General git refresh
   */
  refresh(): Promise<void>;

  /**
   * Request git status refresh
   */
  refreshStatus(): Promise<void>;

  /**
   * Make request for git commit logs
   *
   * @param historyCount: Optional number of commits to get from git log
   */
  log(historyCount?: number): Promise<Git.ILogResult>;

  /**
   * Make request for detailed git commit info of
   * commit 'hash'
   *
   * @param hash Commit hash
   */
  detailedLog(hash: string): Promise<Git.ISingleCommitFilePathInfo>;

  /**
   * Make request for a list of all git branches
   */
  refreshBranch(): Promise<void>;

  /**
   * The list of branch in the current repo
   */
  branches: Git.IBranch[];

  /**
   * The current branch
   */
  currentBranch: Git.IBranch;

  /**
   * Make request to add one or all files into
   * the staging area in repository
   *
   * If filename is not provided, all files will be added.
   *
   * @param filename Optional name of the file to add
   */
  add(filename?: string): Promise<Response>;

  /**
   * Make request to add all untracked files into
   * the staging area in repository
   */
  addAllUntracked(): Promise<Response>;

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
   */
  checkout(options?: Git.ICheckoutOptions): Promise<Git.ICheckoutResult>;

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
   * Make request to move one or all files from the staged to the unstaged area
   *
   * If filename is not provided, all files will be reset.
   *
   * @param filename Optional name of the file to add
   */
  reset(filename?: string): Promise<Response>;

  /**
   * Make request to delete changes from selected commit
   *
   * @param message Commit message to use for the new repository state
   * @param commitId Selected commit ID
   */
  deleteCommit(message: string, commitId: string): Promise<Response>;

  /**
   * Make request to reset to selected commit
   *
   * @param commitId Selected commit ID
   */
  resetToCommit(commitId: string): Promise<Response>;

  /**
   * Make request to initialize a  new git repository at path 'path'
   *
   * @param path Folder path to initialize as a git repository.
   */
  init(path: string): Promise<Response>;

  /**
   * Gets the path of the file relative to the Jupyter server root.
   *
   * If no path is provided, returns the Git repository top folder relative path.
   * If no Git repository selected, return null
   *
   * @param path the file path relative to Git repository top folder
   */
  getRelativeFilePath(path?: string): string | null;

  /**
   * Register a new diff provider for specified file types
   *
   * @param filetypes File type list
   * @param callback Callback to use for the provided file types
   */
  registerDiffProvider(filetypes: string[], callback: Git.IDiffCallback): void;

  /**
   * A promise that fulfills when the model is ready;
   * i.e. if the top folder repository has been found.
   */
  ready: Promise<void>;

  /**
   * Test whether the model is ready;
   * i.e. if the top folder repository has been found.
   */
  isReady: boolean;

  /**
   * Add the file named fname to the current marker with given mark
   */
  addMark(fname: string, mark: boolean): void;

  /**
   * Get current mark of file named fname
   */
  getMark(fname: string): boolean;

  /**
   * Toggle the mark for the file named fname
   */
  toggleMark(fname: string): void;
}

export namespace Git {
  /** Function type for diffing a file's revisions */
  export type IDiffCallback = (
    filename: string,
    revisionA: string,
    revisionB: string
  ) => void;

  /** Interface for GitAllHistory request result,
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

  /** Interface for GitShowTopLevel request result,
   * has the git root directory inside a repository
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
  }

  /** Interface for GitStatus request result,
   * has the status of the entire repo
   */
  export interface IStatusResult {
    code: number;
    files?: IStatusFileResult[];
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
    modified_files?: [ICommitModifiedFile];
  }

  /** Interface for GitLog request result,
   * has the info of all past commits
   */
  export interface ILogResult {
    code: number;
    commits?: [ISingleCommitInfo];
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
}
