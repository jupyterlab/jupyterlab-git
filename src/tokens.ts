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

  readonly status: Git.IGitStatusFileResult[];

  /**
   * A signal emitted when the current status of the git repository changes.
   */
  readonly statusChanged: ISignal<IGitExtension, Git.IGitStatusFileResult[]>;

  /**
   * Make request for the Git Pull API.
   *
   * @param auth
   */
  pull(auth?: Git.IGitAuth): Promise<Git.IGitPushPullResult>;

  /**
   * Make request for the Git Push API.
   *
   * @param auth
   */
  push(auth?: Git.IGitAuth): Promise<Git.IGitPushPullResult>;

  /**
   * Make request for the Git Clone API.
   *
   * @param path
   * @param url
   * @param auth
   */
  clone(
    path: string,
    url: string,
    auth?: Git.IGitAuth
  ): Promise<Git.IGitCloneResult>;

  /**
   * Make request for all git info of repository 'path'
   * (This API is also implicitly used to check if the current repo is a Git repo)
   *
   */
  allHistory(historyCount?: number): Promise<Git.IGitAllHistory>;

  /**
   * Make request for top level path of repository 'path'
   *
   * @param path Git repository path
   */
  showTopLevel(path: string): Promise<Git.IGitShowTopLevelResult>;

  /**
   * Make request for the prefix path of a directory 'path',
   * with respect to the root directory of repository
   */
  showPrefix(path: string): Promise<Git.IGitShowPrefixResult>;

  /**
   * Request git status refresh
   */
  refreshStatus(): Promise<void>;

  /**
   * Make request for git commit logs
   */
  log(): Promise<Git.IGitLogResult>;

  /**
   * Make request for detailed git commit info of
   * commit 'hash'
   *
   * @param hash
   */
  detailedLog(hash: string): Promise<Git.ISingleCommitFilePathInfo>;

  /**
   * Make request for a list of all git branches
   */
  branch(): Promise<Git.IGitBranchResult>;

  /**
   * Make request to add one or all files into
   * the staging area in repository 'path'
   *
   * @param check
   * @param filename
   */
  add(check: boolean, filename: string): Promise<Response>;

  /**
   * Make request to add all untracked files into
   * the staging area in repository 'path'
   */
  addAllUntracked(): Promise<Response>;

  /** Make request to switch current working branch,
   * create new branch if needed,
   * or discard all changes,
   * or discard a specific file change
   * TODO: Refactor into seperate endpoints for each kind of checkout request
   *
   * @param checkoutBranch
   * @param newCheck
   * @param branchname
   * @param checkoutAll
   * @param filename
   */
  checkout(
    checkoutBranch: boolean,
    newCheck: boolean,
    branchname: string,
    checkoutAll: boolean,
    filename: string
  ): Promise<Response>;

  /**
   * Make request to commit all staged files in repository 'path'
   *
   * @param message
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
   * @param check
   * @param filename
   */
  reset(check: boolean, filename: string): Promise<Response>;

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
  export interface IGitAllHistory {
    code: number;
    data?: {
      show_top_level?: IGitShowTopLevelResult;
      branch?: IGitBranchResult;
      log?: IGitLogResult;
      status?: IGitStatusResult;
    };
  }

  /** Interface for GitShowTopLevel request result,
   * has the git root directory inside a repository
   */
  export interface IGitShowTopLevelResult {
    code: number;
    top_repo_path?: string;
  }

  /** Interface for GitShowPrefix request result,
   * has the prefix path of a directory in a repository,
   * with respect to the root directory.
   */
  export interface IGitShowPrefixResult {
    code: number;
    under_repo_path?: string;
  }

  /** Interface for GitShowPrefix request result,
   * has the prefix path of a directory in a repository,
   * with respect to the root directory.
   */
  export interface IGitCheckoutResult {
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
   * has the result of changing the current working branch
   */
  export interface IGitBranchResult {
    code: number;
    branches?: IBranch[];
  }

  /** Interface for GitStatus request result,
   * has the status of each changed file
   */
  export interface IGitStatusFileResult {
    x: string;
    y: string;
    to: string;
    from: string;
  }

  /** Interface for GitStatus request result,
   * has the status of the entire repo
   */
  export interface IGitStatusResult {
    code: number;
    files?: IGitStatusFileResult[];
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
  export interface IGitLogResult {
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
  export interface IGitAuth {
    username: string;
    password: string;
  }

  /**
   * Structure for the request to the Git Clone API.
   */
  export interface IGitClone {
    current_path: string;
    clone_url: string;
    auth?: IGitAuth;
  }

  /**
   * Structure for the request to the Git Clone API.
   */
  export interface IGitPushPull {
    current_path: string;
    auth?: IGitAuth;
  }

  /**
   * Structure for the result of the Git Clone API.
   */
  export interface IGitCloneResult {
    code: number;
    message?: string;
  }

  /**
   * Structure for the result of the Git Push & Pull API.
   */
  export interface IGitPushPullResult {
    code: number;
    message?: string;
  }
}
