# Specification of jupyterlab-git REST API
This part of the REST API contains calls for working with the git-plugin of jupyterlab. 
Contents for each call include:
1. URLS: Only POST can send data to server through Jupyterlab's ServerConnection, so, all commands use POST
3. Request JSON
4. Reply JSON
5. How errors are handled (HTTP error codes, error JSON)

### git API - Get all information of current repo
Request with a 'current_path', if it's a git repo, return all the git repo information with a zero 'code', if not, return error message with a non-zero 'code'.
This request consists 4 seperate subprocess executions on server side (showtoplevel, branch, log, status) and may fail individually, so each part has its own 'code' to indicate execution status(zero for success, none-zero for failure)   

URL:
```bash 
    POST /git/API
```
Request JSON:
```bash
    {
        "current_path": "current/path/in/filebrowser/widget"
    }
```
HTTP response
```bash
Status: 200 OK
```

Reply JSON:
on git command success
```bash
    {
        "code": 0,
    	"data":{
		    "showtoplevel": {
                'code': 0, 
                'top_repo_path': "/absolute/path/to/root/of/repo"
            }
		    "branch"?: {
                'code': 0,
                'branches': [
                    {'current':false,'remote':true,'name':'branch-name','tag':'branch-tag'}
                ]
            }
		    "log"?: {
                'code': 0,
                'commits': [
                    {'commit':'1234567890987654321', 'author': 'person0','date': '3-hourss-ago','commit_msg': 'update-file-changes' }
                ]
            }
		    "status"?: {
                'code': 0,
                'files': {
                    "x": "CHECK-bit-X",
                    "y": "CHECK-bit-Y",
                    "to": "file/or/folder/path",
                    "from": "original/path/for/copied/file/or/folder"
                }
            }
	    }
    }
```
on git command failure
```bash
    {
        "code": 11,
        "command": 'git showtoplevel'
        "message": "Not in a Git repository"
    }
```

### git showtoplevel - Show the absolute path of the top-level directory
Request with a 'current_path', if it's a git repo, return the absolute path of the top-level directory with a zero 'code', if not, return error message with a non-zero 'code'.

URL:
```bash 
    POST /git/showtoplevel 
```
Request JSON:
```bash
    {
        "current_path": "current/path/in/filebrowser/widget"
    }
```
HTTP response
```bash
Status: 200 OK
```

Reply JSON:
on git command success
```bash
    {
        'code': 0, 
        'top_repo_path': "/absolute/path/to/root/of/repo"
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": 'git showtoplevel'
        "message": "Not in a Git repository"
    }
```

### git branch - List branches
Request with a 'current_path' to get info of all the branches.

URL:
```bash 
    POST /git/branch 
```
Request JSON:
```bash
    {
        "current_path": "current/path/in/filebrowser/widget"
    }
```
HTTP response
```bash
Status: 200 OK
```

Reply JSON:
on git command success
```bash
    {
        'code': 0,
        'branches': [
            {'current':false,'remote':true,'name':'branch-name','tag':'branch-tag'}
        ]
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": 'git branch -a'
        "message": "Git command error info"
    }
```

### git log - Show commit logs
Request with a 'current_path' to get the general info of all past commits.

URL:
```bash 
    POST /git/log 
```
Request JSON:
```bash
    {
        "current_path": "current/path/in/filebrowser/widget"
    }
```
HTTP response
```bash
Status: 200 OK
```

Reply JSON:
on git command success
```bash
    {
        'code': 0,
        'commits': [
            {'commit':'1234567890987654321', 'author': 'person0','date': '3-hourss-ago','commit_msg': 'update-file-changes' }
        ]
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": 'git log'
        "message": "Git command error info"
    }
```

### git status - Show the working tree status
Request with a 'current_path' to get the full status of current working tree.

URL:
```bash 
    POST /git/status 
```
Request JSON:
```bash
    {
        "current_path": "current/path/in/filebrowser/widget"
    }
```
HTTP response
```bash
Status: 200 OK
```

Reply JSON:
on git command success
```bash
    {
        "code": 0,
        "files": [
            {
                "x": "CHECK-bit-X",
                "y": "CHECK-bit-Y",
                "to": "file/or/folder/path",
                "from": "original/path/for/copied/file/or/folder"
            }
        ]
    }
```
on git command failure
```bash
    {
        "code": 10001,
        "command": 'git status'
        "message": "Not in a Git repository"
    }
```

### git add - Show commit logs
Request with a 'current_path' to get the general info of all past commits.

URL:
```bash 
    POST /git/add
```
Request JSON:
```bash
    {
        "add_all": false, 
        "filename": "file/or/folder/path", 
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
```
HTTP response
```bash
Status: 200 OK
```

Reply JSON:
on git command success
```bash
    {
        'code': 0,
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": 'git add'
        "message": "Git command error info"
    }
```


### git checkout - Show commit logs
Request with a 'current_path' to get the general info of all past commits.

URL:
```bash 
    POST /git/checkout
```
Request JSON:
```bash
    {
        "checkout_all": false, 
        "filename": "file/or/folder/path", 
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
```
HTTP response
```bash
Status: 200 OK
```

Reply JSON:
on git command success
```bash
    {
        'code': 0,
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": 'git checkout'
        "message": "Git command error info"
    }
```

### git reset - Show commit logs
Request with a 'current_path' to get the general info of all past commits.

URL:
```bash 
    POST /git/add
```
Request JSON:
```bash
    {
        "reset_all": false, 
        "filename": "file/or/folder/path", 
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
```
HTTP response
```bash
Status: 200 OK
```

Reply JSON:
on git command success
```bash
    {
        'code': 0,
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": 'git reset'
        "message": "Git command error info"
    }
```

### git commit - Show commit logs
Request with a 'current_path' to get the general info of all past commits.

URL:
```bash 
    POST /git/add
```
Request JSON:
```bash
    {
        "commit_msg": "typed-in-message-for-commit", 
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
```
HTTP response
```bash
Status: 200 OK
```

Reply JSON:
on git command success
```bash
    {
        'code': 0,
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": 'git commit'
        "message": "Git command error info"
    }
```


