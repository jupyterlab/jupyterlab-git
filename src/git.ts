import {
  ServerConnection
} from '@jupyterlab/services';

import '../style/index.css';

'use strict';

export interface GitShowTopLevelResult {
	code: number;
	top_repo_path?: string;
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
	async showtoplevel(path:string):Promise<GitShowTopLevelResult>{
		try{
			var val = await HTTP_Git_Request('/git/showtoplevel','POST',{"current_path": path});
			if (val.xhr.status !== 200) {
          		console.log(val.xhr.status)
        		throw ServerConnection.makeError(val);
       	 	}
			if(val.data.code!=0){
				console.log("Git command Error:")
				console.log(val.data.message);
			}
			return val.data;
		}catch(err){
			throw ServerConnection.makeError(err);
		}
	}

	async status(path: string):Promise<GitStatusResult> {
		try{
			var val = await HTTP_Git_Request('/git/status','POST',{"current_path":path});
			if (val.xhr.status !== 200) {
          		console.log(val.xhr.status)
        		throw ServerConnection.makeError(val);
       	 	}
			if(val.data.code!=0){
				console.log("Git command Error:")
				console.log(val.data.message);
			}
			return val.data;
		}catch(err){
			throw ServerConnection.makeError(err);
		}
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


