import {
  ServerConnection
} from '@jupyterlab/services';

import '../style/index.css';




/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

export interface IGit {
	path: string;
	version: string;
}

export interface IFileStatus {
	x: string;
	y: string;
	path: string;
	rename?: string;
}

export interface Remote {
	name: string;
	url: string;
}

export enum RefType {
	Head,
	RemoteHead,
	Tag
}

export interface Ref {
	type: RefType;
	name?: string;
	commit?: string;
	remote?: string;
}

export interface Branch extends Ref {
	upstream?: string;
	ahead?: number;
	behind?: number;
}


export interface IExecutionResult {
	exitCode: number;
	stdout: string;
	stderr: string;
}



function HTTP_Git_Request(URL,METHOD,REQUEST):Promise<ServerConnection.IResponse>{
  //let data0 = {"git_command":git_command , "current_path":current_path};
  let request = {
    url:URL,
    method: METHOD,
    cache: true,
    contentType: 'bar',
    headers: {
      foo: 'bar'
    },
    data: JSON.stringify(REQUEST),
  };
  return ServerConnection.makeRequest(request, ServerConnection.makeSettings());
  /*
  ServerConnection.makeRequest(request, ServerConnection.makeSettings()).then(response =>{
    if (response.xhr.status !== 200) {
          throw ServerConnection.makeError(response);
    }
    console.log(JSON.stringify(response.data, null, 2)); 
    return  response;
  });
  */
  
}

export interface IGitErrorData {
	error?: Error;
	message?: string;
	stdout?: string;
	stderr?: string;
	exitCode?: number;
	gitErrorCode?: string;
	gitCommand?: string;
}

export class GitError {

	error?: Error;
	message: string;
	stdout?: string;
	stderr?: string;
	exitCode?: number;
	gitErrorCode?: string;
	gitCommand?: string;

	constructor(data: IGitErrorData) {
		if (data.error) {
			this.error = data.error;
			this.message = data.error.message;
		} else {
			this.error = void 0;
		}

		this.message = this.message || data.message || 'Git error';
		this.stdout = data.stdout;
		this.stderr = data.stderr;
		this.exitCode = data.exitCode;
		this.gitErrorCode = data.gitErrorCode;
		this.gitCommand = data.gitCommand;
	}

	toString(): string {
		let result = this.message + ' ' + JSON.stringify({
			exitCode: this.exitCode,
			gitErrorCode: this.gitErrorCode,
			gitCommand: this.gitCommand,
			stdout: this.stdout,
			stderr: this.stderr
		}, [], 2);

		if (this.error) {
			result += (<any>this.error).stack;
		}

		return result;
	}
}

export interface IGitOptions {
	gitPath: string;
	version: string;
	env?: any;
}

export const GitErrorCodes = {
	BadConfigFile: 'BadConfigFile',
	AuthenticationFailed: 'AuthenticationFailed',
	NoUserNameConfigured: 'NoUserNameConfigured',
	NoUserEmailConfigured: 'NoUserEmailConfigured',
	NoRemoteRepositorySpecified: 'NoRemoteRepositorySpecified',
	NotAGitRepository: 'NotAGitRepository',
	NotAtRepositoryRoot: 'NotAtRepositoryRoot',
	Conflict: 'Conflict',
	UnmergedChanges: 'UnmergedChanges',
	PushRejected: 'PushRejected',
	RemoteConnectionError: 'RemoteConnectionError',
	DirtyWorkTree: 'DirtyWorkTree',
	CantOpenResource: 'CantOpenResource',
	GitNotFound: 'GitNotFound',
	CantCreatePipe: 'CantCreatePipe',
	CantAccessRemote: 'CantAccessRemote',
	RepositoryNotFound: 'RepositoryNotFound',
	RepositoryIsLocked: 'RepositoryIsLocked',
	BranchNotFullyMerged: 'BranchNotFullyMerged',
	NoRemoteReference: 'NoRemoteReference'
};
/*
function getGitErrorCode(stderr: string): string | undefined {
	if (/Another git process seems to be running in this repository|If no other git process is currently running/.test(stderr)) {
		return GitErrorCodes.RepositoryIsLocked;
	} else if (/Authentication failed/.test(stderr)) {
		return GitErrorCodes.AuthenticationFailed;
	} else if (/Not a git repository/.test(stderr)) {
		return GitErrorCodes.NotAGitRepository;
	} else if (/bad config file/.test(stderr)) {
		return GitErrorCodes.BadConfigFile;
	} else if (/cannot make pipe for command substitution|cannot create standard input pipe/.test(stderr)) {
		return GitErrorCodes.CantCreatePipe;
	} else if (/Repository not found/.test(stderr)) {
		return GitErrorCodes.RepositoryNotFound;
	} else if (/unable to access/.test(stderr)) {
		return GitErrorCodes.CantAccessRemote;
	} else if (/branch '.+' is not fully merged/.test(stderr)) {
		return GitErrorCodes.BranchNotFullyMerged;
	} else if (/Couldn\'t find remote ref/.test(stderr)) {
		return GitErrorCodes.NoRemoteReference;
	}

	return void 0;
}
*/
export class Git {

	constructor() {
	}
	showtoplevel(path:string):Promise<ServerConnection.IResponse> {
		return HTTP_Git_Request('/git/showtoplevel','POST',{"current_path": path});
	}

	status(path: string):Promise<ServerConnection.IResponse> {
		return HTTP_Git_Request('/git/status','POST',{"current_path":path});
	}

	add(check: boolean, filename: string, path: string) {
		return  HTTP_Git_Request('/git/add','POST',{"add_all": check , "filename":filename, "top_repo_path": path});
	}

	checkout(check: boolean,filename: string,  path: string) {
		return  HTTP_Git_Request('/git/checkout','POST',{"checkout_all": check , "filename":filename, "top_repo_path": path});
	}

	commit(message: string, path: string) {
		return HTTP_Git_Request('/git/commit','POST',{"commit_msg":message, "top_repo_path": path});
	}

	reset(check: boolean, filename: string, path: string) {
		return HTTP_Git_Request('/git/reset','POST',{"reset_all": check, "filename":filename, "top_repo_path": path});
	}



}


