import { ServerConnection } from '@jupyterlab/services';

import { URLExt } from '@jupyterlab/coreutils';
import { JSONObject } from '@phosphor/coreutils';

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

/** Interface for GitBranch request result,
 * has the result of changing the current working branch
 */
export interface IGitBranchResult {
  code: number;
  branches?: Array<{
    is_current_branch: boolean;
    is_remote_branch: boolean;
    name: string;
    upstream: string;
    top_commit: string;
    tag: string;
  }>;
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
  files?: [IGitStatusFileResult];
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

/** Makes a HTTP request, sending a git command to the backend */
export function httpGitRequest(
  url: string,
  method: string,
  request: Object | null
): Promise<Response> {
  let fullRequest;
  if (request === null) {
    fullRequest = {
      method: method
    };
  } else {
    fullRequest = {
      method: method,
      body: JSON.stringify(request)
    };
  }

  let setting = ServerConnection.makeSettings();
  let fullUrl = URLExt.join(setting.baseUrl, url);
  return ServerConnection.makeRequest(fullUrl, fullRequest, setting);
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

/**
 * Array of Git Auth Error Messages
 */
export const AUTH_ERROR_MESSAGES = [
  'Invalid username or password',
  'could not read Username',
  'could not read Password'
];

/** Parent class for all API requests */
export class Git {
  constructor() {}

  /** Make request for the Git Pull API. */
  async pull(path: string, auth?: IGitAuth): Promise<IGitPushPullResult> {
    try {
      let obj: IGitPushPull = {
        current_path: path,
        auth
      };

      let response = await httpGitRequest('/git/pull', 'POST', obj);
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for the Git Push API. */
  async push(path: string, auth?: IGitAuth): Promise<IGitPushPullResult> {
    try {
      let obj: IGitPushPull = {
        current_path: path,
        auth
      };

      let response = await httpGitRequest('/git/push', 'POST', obj);
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for the Git Clone API. */
  async clone(
    path: string,
    url: string,
    auth?: IGitAuth
  ): Promise<IGitCloneResult> {
    try {
      let obj: IGitClone = {
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
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for all git info of repository 'path'
   * (This API is also implicitly used to check if the current repo is a Git repo)
   */
  async allHistory(path: string): Promise<IGitAllHistory> {
    try {
      let response = await httpGitRequest('/git/all_history', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.text();
        throw new ServerConnection.ResponseError(response, data);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for top level path of repository 'path' */
  async showTopLevel(path: string): Promise<IGitShowTopLevelResult> {
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
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for the prefix path of a directory 'path',
   * with respect to the root directory of repository
   */
  async showPrefix(path: string): Promise<IGitShowPrefixResult> {
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
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for git status of repository 'path' */
  async status(path: string): Promise<IGitStatusResult> {
    try {
      let response = await httpGitRequest('/git/status', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for git commit logs of repository 'path' */
  async log(path: string): Promise<IGitLogResult> {
    try {
      let response = await httpGitRequest('/git/log', 'POST', {
        current_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request for detailed git commit info of
   * commit 'hash' in repository 'path'
   */
  async detailedLog(
    hash: string,
    path: string
  ): Promise<ISingleCommitFilePathInfo> {
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
  async branch(path: string): Promise<IGitBranchResult> {
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
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request to add one or all files into
   * the staging area in repository 'path'
   */
  async add(check: boolean, filename: string, path: string): Promise<Response> {
    return httpGitRequest('/git/add', 'POST', {
      add_all: check,
      filename: filename,
      top_repo_path: path
    });
  }

  /** Make request to add all untracked files into
   * the staging area in repository 'path'
   */
  async addAllUntracked(path: string): Promise<Response> {
    try {
      let response = await httpGitRequest('/git/add_all_untracked', 'POST', {
        top_repo_path: path
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new ServerConnection.ResponseError(response, data.message);
      }
      return response.json();
    } catch (err) {
      throw ServerConnection.NetworkError;
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
    filename: string,
    path: string
  ): Promise<Response> {
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
      return response;
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }
  /** Make request to commit all staged files in repository 'path' */
  async commit(message: string, path: string): Promise<Response> {
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
      return response;
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /**
   * Get or set Git configuration options
   *
   * @param path Top repository path
   * @param options Configuration options to set (undefined to get)
   */
  async config(path: string, options?: JSONObject): Promise<Response> {
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
  async reset(
    check: boolean,
    filename: string,
    path: string
  ): Promise<Response> {
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
      return response;
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request to delete changes from selected commit */
  async deleteCommit(
    message: string,
    path: string,
    commitId: string
  ): Promise<Response> {
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
      await this.commit(message, path);
      return response;
    } catch (err) {
      throw ServerConnection.NetworkError;
    }
  }

  /** Make request to reset to selected commit */
  async resetToCommit(
    message: string,
    path: string,
    commitId: string
  ): Promise<Response> {
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
      return response;
    } catch (err) {
      throw ServerConnection.NetworkError;
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
      throw ServerConnection.NetworkError;
    }
  }
}
