import {
  ServerConnection
} from '@jupyterlab/services';

import '../style/index.css';
import { URLExt } from '@jupyterlab/coreutils';

'use strict';

export interface GitAPI{
	code: number;
	data?:{
		showtoplevel?: GitShowTopLevelResult;
		branch?: GitBranchResult;
		log?: GitLogResult;
		status?: GitStatusResult;
	}
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
	branches?: [
            {
                current: boolean,
                remote: boolean,
				name: string,
				tag: string,
            }
        ]
}

export interface GitStatusFileResult{
    x: string,
    y: string,
    to: string,
    from: string
}

export interface GitStatusResult {
	code: number;
	files?: [
            GitStatusFileResult
        ]
}

export interface SingleCommitInfo {
    commit: string,
    author: string,
    date: string,
	commit_msg: string,
	pre_commit: string;
}

export interface CommitModifiedFile{
	modified_file_path: string,
	modified_file_name: string,
	insertion: string,
	deletion: string
}

export interface SingleCommitFilePathInfo {
	code:number;
	modified_file_note?: string,
	modified_files_count?: string,
	number_of_insertions?: string,
	number_of_deletions?: string,
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

function HTTP_Git_Request(URL,METHOD,REQUEST):Promise<Response>{
  let request = {
    method: METHOD,
    body: JSON.stringify(REQUEST),
  };

  let setting = ServerConnection.makeSettings();
  let url = URLExt.join(setting.baseUrl, URL);
  return ServerConnection.makeRequest(url, request, setting);
}

export class Git {

	constructor() {
	}
	
	async api(path:string):Promise<GitAPI>{
		try{
			var val = await HTTP_Git_Request('/git/API','POST',{"current_path": path});
			console.log(val)
			if (val.status !== 200) {
          		console.log(val.status)
        		return val.text().then(data=>{
					throw new ServerConnection.ResponseError(val, data);
				})
			}
			return val.json();
		}catch(err){
			throw ServerConnection.NetworkError;
		}
	}


	async showtoplevel(path:string):Promise<GitShowTopLevelResult>{
		try{
			var val = await HTTP_Git_Request('/git/showtoplevel','POST',{"current_path": path});
			if (val.status !== 200) {
          		console.log(val.status)
				  return val.json().then(data=>{
					throw new ServerConnection.ResponseError(val, data.message);
				})
			}
			return val.json();
		}catch(err){
			throw ServerConnection.NetworkError;
		}
	}

	async showprefix(path:string):Promise<GitShowPrefixResult>{
		try{
			var val = await HTTP_Git_Request('/git/showprefix','POST',{"current_path": path});
			if (val.status !== 200) {
        		return val.json().then(data=>{
					throw new ServerConnection.ResponseError(val, data.message);
				})
			}
			return val.json();
		}catch(err){
			throw ServerConnection.NetworkError;
		}
	}

	async status(path: string):Promise<GitStatusResult> {
		try{
			var val = await HTTP_Git_Request('/git/status','POST',{"current_path":path});
			if (val.status !== 200) {
        		return val.json().then(data=>{
					throw new ServerConnection.ResponseError(val, data.message);
				})
			}
			return val.json();
		}catch(err){
			throw ServerConnection.NetworkError;
		}
	}

	async log(path: string):Promise<GitLogResult> {
		try{
			var val = await HTTP_Git_Request('/git/log', 'POST', {"current_path": path});
			if(val.status!== 200) {
        		return val.json().then(data=>{
					throw new ServerConnection.ResponseError(val, data.message);
				})
			}
			return val.json();
		} catch (err) {
			throw ServerConnection.NetworkError;
		}
	}

	async log_1(hash: string, path: string):Promise<SingleCommitFilePathInfo> {
		try{
			var val = await HTTP_Git_Request('/git/log_1', 'POST', {"selected_hash":hash,"current_path": path});
			if(val.status!== 200) {
        		return val.json().then(data=>{
					throw new ServerConnection.ResponseError(val, data.message);
				})
			}
			return val.json();
		} catch (err) {
			throw ServerConnection.NetworkError;
		}
	}

	async branch(path: string): Promise<GitBranchResult>{
		try{
			var val = await HTTP_Git_Request('/git/branch','POST',{"current_path":path});
			if (val.status !== 200) {
        		return val.json().then(data=>{
					throw new ServerConnection.ResponseError(val, data.message);
				})
			}
			return val.json();
		}catch(err){
			throw ServerConnection.NetworkError;
		}
	}

	add(check: boolean, filename: string, path: string) {
		return  HTTP_Git_Request('/git/add','POST',{"add_all": check , "filename":filename, "top_repo_path": path});
	}

	async add_all_untracked(path: string){
		try{
			var val =  await HTTP_Git_Request('/git/add_all_untracked','POST',{"top_repo_path": path});
			if (val.status !== 200) {
        		return val.json().then(data=>{
					throw new ServerConnection.ResponseError(val, data.message);
				})
			}
			return val.json();
		}catch(err){
			throw ServerConnection.NetworkError;
		}		
	}


	async checkout(checkout_branch: boolean, new_check: boolean, branchname: string, checkout_all: boolean, filename: string,  path: string):Promise<GitCheckoutResult> {
		try{
			var val =  await HTTP_Git_Request('/git/checkout','POST',{"checkout_branch": checkout_branch, "new_check": new_check, "branchname":branchname, "checkout_all": checkout_all , "filename":filename, "top_repo_path": path});
			if (val.status !== 200) {
        		return val.json().then(data=>{
					throw new ServerConnection.ResponseError(val, data.message);
				})
			}
			return val.json();
		}catch(err){
			throw ServerConnection.NetworkError;
		}
	}

	commit(message: string, path: string) {
		return HTTP_Git_Request('/git/commit','POST',{"commit_msg":message, "top_repo_path": path});
	}

	reset(check: boolean, filename: string, path: string) {
		return HTTP_Git_Request('/git/reset','POST',{"reset_all": check, "filename":filename, "top_repo_path": path});
	}

	async pull(origin: string, master: string, path:string) {
		try{
			var val = await HTTP_Git_Request('/git/pull', 'POST', {"origin": origin, "master":master,"curr_fb_path": path});
			if (val.status !== 200) {
        		return val.json().then(data=>{
					throw new ServerConnection.ResponseError(val, data.message);
				})
			}
			return val.json();
		}catch(err){
			throw ServerConnection.NetworkError;
		}	
	}


	async push(origin: string, master: string, path:string) {
		try{
			var val = await HTTP_Git_Request('/git/push', 'POST', {"origin": origin, "master":master,"curr_fb_path": path});
			if (val.status !== 200) {
        		return val.json().then(data=>{
					throw new ServerConnection.ResponseError(val, data.message);
				})
			}
			return val.json();
		}catch(err){
			throw ServerConnection.NetworkError;
		}	
	 }
	
	init(path:string){
		return HTTP_Git_Request('/git/init','POST',{"current_path":path});
	}

}


