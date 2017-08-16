# jupyterlab-git REST API
pre-alpha version
1. URLS
2. HTTP verbs (GET, POST, etc): Only POST can send data to server through Jupyterlab's ServerConnection, so, all commands use POST
3. Request JSON
4. Reply JSON
5. How errors are handled (HTTP error codes, error JSON)

## git api (not a real command)
```bash
URL:  
    POST /git/API
Request JSON:
    {
        "current_path": "current/path/in/filebrowser/widget"
    }
Reply JSON:
    {
        "code": 0,
    	"data":{
		    "showtoplevel": GitShowTopLevelResult;
		    "branch"?: GitBranchResult;
		    "log"?: GitLogResult;
		    "status"?: GitStatusResult;
	    }
    }
    }
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
