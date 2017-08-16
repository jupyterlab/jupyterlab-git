# Specification of jupyterlab-git REST API
This part of the REST API contains calls for working with the git-plugin of jupyterlab. 
Contents for each call include:
1. URLS: Only POST can send data to server through Jupyterlab's ServerConnection, so, all commands use POST
3. Request JSON
4. Reply JSON
5. How errors are handled (HTTP error codes, error JSON)

## Get all information of current repo
Request with a 'current_path', if it's a git repo, return all the git repo information with a zero 'code', if not, return error message with a non-zero 'code'.
This request consists 4 seperate subprocess executions on server side (showtoplevel, branch, log, status) and may fail individually, so each part has its own 'code' to indicate execution status(zero for success, none-zero for failure)   
URL:
```bash 
    POST /git/API
```
Request JSON:
```bash
    [
        {
        "current_path": "current/path/in/filebrowser/widget"
        }
    ]
```
Reply JSON:
```bash
    {
        "code": 0,
    	"data":{
		    "showtoplevel": {'code': 0, 'top_repo_path': "/absolute/path/to/root/of/repo"};
		    "branch"?: {
                'code': 0,
                'repos': [
                    {'current':false,'remote':true,'name':'branch/name','tag':'branch/tag'}
                ]
            }
		    "log"?: {
                'code': 0,
                'commits': [
                    {'commit':line_array[i], 'author': line_array[i+1],'date':line_array[i+2],'commit_msg':line_array[i+3] }
                ]
            }
		        "status"?: {
                    'code': 0,
                    'files': {
                        "x": "CHECK/bit/X",
                        "y": "CHECK/bit/Y",
                        "to": "file/or/folder/path",
                        "from": "original/path/for/copied/file/or/folder"
                    }
            }
	    }
    }
```
Error JSON:
    {
        "code": 10000,
        "message": "Not in a Git repository"
    }
```

## git rev-parse --show-toplevel
```bash
URL:  
    POST /git/showtoplevel
Request JSON:
    {
        "current_path": "current/path/in/filebrowser/widget"
    }
Reply JSON:
    {
        "code": 0,
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
Error JSON:
    {
        "code": 10000,
        "message": "Not in a Git repository"
    }
```

## git status
```bash
URL:  
    POST /git/status
Request JSON:
    {
        "current_path": "current/path/in/filebrowser/widget"
    }
Reply JSON:
    {
        "code": 0,
        "files": [
            {
                "x": "CHECK/bit/X",
                "y": "CHECK/bit/Y",
                "to": "file/or/folder/path",
                "from": "original/path/for/copied/file/or/folder"
            }
        ]
    }
Error JSON:
    {
        "code": 10001,
        "message": "Not in a Git repository"
    }
```
## git add
```bash
URL:  
    POST /git/add
Request JSON:
    {
        "add_all": false, 
        "filename": "file/or/folder/path", 
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
Reply JSON:
    {
        "code": 0,
    }
Error JSON:
    {
        "code": 10002,
        "message": "File not found"
    }
```
## git checkout
```bash
URL:  
    POST /git/checkout
Request JSON:
    {
        "checkout_all": false, 
        "filename": "file/or/folder/path", 
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
Reply JSON:
    {
        "code": 0,
    }
Error JSON:
    {
        "code": 10003,
        "message": "File not found"
    }
```
## git commit
```bash
URL:  
    POST /git/commit
Request JSON:
    {
        "commit_msg": "/typed/in/message/for/commit", 
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
Reply JSON:
    {
        "code": 0,
    }
Error JSON:
    {
        "code": 10004,
        "message": "Commit failed"
    }
```
## git reset
```bash
URL:  
    POST /git/commit
Request JSON:
    {
        "reset_all": false, 
        "filename": "file/or/folder/path", 
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
Reply JSON:
    {
        "code": 0,
    }
Error JSON:
    {
        "code": 10005,
        "message": "File not found"
    }
```
