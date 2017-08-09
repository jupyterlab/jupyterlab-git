import {
  ServerConnection
} from '@jupyterlab/services';

import '../style/index.css';

'use strict';

export class GitErrorInfo {
	error?: Error;
	message?: string;
	stdout?: string;
	stderr?: string;
	code?: number;
	gitErrorCode?: string;
	gitCommand?: string;
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

export interface GitShowTopLevelResult {
	code: number;
	top_repo_path?: string;
}
export interface GitShowPrefixResult {
	code: number;
	under_repo_path?: string;
}
export interface GitCheckoutResult {
	code: number;
	message?: string;
}
export interface GitBranchResult {
	code: number;
	repos?: [
            {
                current: boolean,
                remote: boolean,
				name: string,
				tag: string,
            }
        ]
}
export interface GitStatusResult {
	code: number;
	files?: [
            {
                x: string,
                y: string,
                to: string,
                from: string
            }
        ]
}

export interface SingleCommitInfo {
    commit: string,
    author: string,
    date: string,
	commit_msg: string,
	modified_file_note?: string,
	modified_files?: [{
		modified_file_path: string,
	}]
}

export interface CommitModifiedFile{
	modified_file_path: string,
	insertion: string;
	deletion: string
}

export interface SingleCommitFilePathInfo {
	code:number;
	modified_file_note?: string,
	modified_files?: [
		CommitModifiedFile
	]
}

export interface GitLogResult {
	code: number;
	commits?: [
			SingleCommitInfo
        ]
}

function HTTP_Git_Request(URL,METHOD,REQUEST):Promise<ServerConnection.IResponse>{
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
}

export class Git {

	constructor() {
	}
	async showtoplevel(path:string):Promise<GitShowTopLevelResult|GitErrorInfo>{
		try{
			var val = await HTTP_Git_Request('/git/showtoplevel','POST',{"current_path": path});
			if (val.xhr.status !== 200) {
          		console.log(val.xhr.status)
        		throw ServerConnection.makeError(val);
       	 	}
			if(val.data.code!=0){
				let err = new GitErrorInfo();
				err.code = val.data.code;
				err.gitCommand = val.data.command;
				err.message = 'Failed to execute git';
				err.gitErrorCode = getGitErrorCode(val.data.message);
				err.stderr = val.data.message;

				console.log(err.message);
				console.log(err.gitCommand);
				console.log(err.gitErrorCode);

				return err;
			}
			return val.data;
		}catch(err){
			throw ServerConnection.makeError(err);
		}
	}

	async showprefix(path:string):Promise<GitShowPrefixResult|GitErrorInfo>{
		try{
			var val = await HTTP_Git_Request('/git/showprefix','POST',{"current_path": path});
			if (val.xhr.status !== 200) {
          		console.log(val.xhr.status)
        		throw ServerConnection.makeError(val);
       	 	}
			if(val.data.code!=0){
				let err = new GitErrorInfo();
				err.code = val.data.code;
				err.gitCommand = val.data.command;
				err.message = 'Failed to execute git';
				err.gitErrorCode = getGitErrorCode(val.data.message);
				err.stderr = val.data.message;

				console.log(err.message);
				console.log(err.gitCommand);
				console.log(err.gitErrorCode);
				return err;
			}
			return val.data;
		}catch(err){
			throw ServerConnection.makeError(err);
		}
	}

	async status(path: string):Promise<GitStatusResult|GitErrorInfo> {
		try{
			var val = await HTTP_Git_Request('/git/status','POST',{"current_path":path});
			if (val.xhr.status !== 200) {
          		console.log(val.xhr.status)
        		throw ServerConnection.makeError(val);
       	 	}
			if(val.data.code!=0){
				let err = new GitErrorInfo();
				err.code = val.data.code;
				err.gitCommand = val.data.command;
				err.message = 'Failed to execute git';
				err.gitErrorCode = getGitErrorCode(val.data.message);
				err.stderr = val.data.message;
				console.log(err.message);
				console.log(err.gitCommand);
				console.log(err.gitErrorCode);				
				return err;
			}
			return val.data;
		}catch(err){
			throw ServerConnection.makeError(err);
		}
	}

	async log(path: string):Promise<GitLogResult> {
		try{
			var val = await HTTP_Git_Request('/git/log', 'POST', {"current_path": path});
			if(val.xhr.status!== 200) {
				console.log(val.xhr.status)
				throw ServerConnection.makeError(val);
			}
			if(val.data.code!=0){
				console.log("Git Command Error:")
				console.log(val.data.message);
			}
			return val.data;
		} catch (err) {
			throw ServerConnection.makeError(err);
		}
	}

	async log_1(hash: string, path: string):Promise<SingleCommitFilePathInfo> {
		try{
			var val = await HTTP_Git_Request('/git/log_1', 'POST', {"selected_hash":hash,"current_path": path});
			if(val.xhr.status!== 200) {
				console.log(val.xhr.status)
				throw ServerConnection.makeError(val);
			}
			if(val.data.code!=0){
				console.log("Git Command Error:")
				console.log(val.data.message);
			}
			return val.data;
		} catch (err) {
			throw ServerConnection.makeError(err);
		}
	}

	async branch(path: string): Promise<GitBranchResult|GitErrorInfo>{
		try{
			var val = await HTTP_Git_Request('/git/branch','POST',{"current_path":path});
			if (val.xhr.status !== 200) {
          		console.log(val.xhr.status)
        		throw ServerConnection.makeError(val);
       	 	}
			if(val.data.code!=0){
				let err = new GitErrorInfo();
				err.code = val.data.code;
				err.gitCommand = val.data.command;
				err.message = 'Failed to execute git';
				err.gitErrorCode = getGitErrorCode(val.data.message);
				err.stderr = val.data.message;
				console.log(err.message);
				console.log(err.gitCommand);
				console.log(err.gitErrorCode);
				return err;				
			}
			return val.data;
		}catch(err){
			throw ServerConnection.makeError(err);
		}
	}

	add(check: boolean, filename: string, path: string) {
		return  HTTP_Git_Request('/git/add','POST',{"add_all": check , "filename":filename, "top_repo_path": path});
	}

	async checkout(checkout_branch: boolean, new_check: boolean, branchname: string, checkout_all: boolean, filename: string,  path: string):Promise<GitCheckoutResult|GitErrorInfo> {
		try{
			var val =  await HTTP_Git_Request('/git/checkout','POST',{"checkout_branch": checkout_branch, "new_check": new_check, "branchname":branchname, "checkout_all": checkout_all , "filename":filename, "top_repo_path": path});
			if (val.xhr.status !== 200) {
          		console.log(val.xhr.status)
        		throw ServerConnection.makeError(val);
       	 	}
			if(val.data.code!=0){
				let err = new GitErrorInfo();
				err.code = val.data.code;
				err.gitCommand = val.data.command;
				err.message = 'Failed to execute git';
				err.gitErrorCode = getGitErrorCode(val.data.message);
				err.stderr = val.data.message;	
				
				console.log(err.message);
				console.log(err.gitCommand);
				console.log(err.gitErrorCode);

				return err;			
			}
			return val.data;
		}catch(err){
			throw ServerConnection.makeError(err);
		}
	}

	commit(message: string, path: string) {
		return HTTP_Git_Request('/git/commit','POST',{"commit_msg":message, "top_repo_path": path});
	}

	reset(check: boolean, filename: string, path: string) {
		return HTTP_Git_Request('/git/reset','POST',{"reset_all": check, "filename":filename, "top_repo_path": path});
	}

	pull(origin: string, master: string, path:string) {
		return HTTP_Git_Request('/git/pull', 'POST', {"origin": origin, "master":master,"top_repo_path": path});	
	}

	push(origin: string, master: string, path:string) {
 		return HTTP_Git_Request('/git/push', 'POST', {"origin": origin, "master":master,"top_repo_path": path});
	 }
	
	init(path:string){
		//return HTTP_Git_Request('/git/init','POST',{"top_repo_path":path});
	}

	


}


