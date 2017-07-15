# jupyterlab-git REST API
pre-alpha version
1. URLS
2. HTTP verbs (GET, POST, etc): Only POST can send data to server through Jupyterlab's ServerConnection, so, all commands use POST
3. Request JSON
4. Reply JSON
5. How errors are handled (HTTP error codes, error JSON)


## git rev-parse --show-toplevel

URL:  
    POST /git/showtoplevel
Request JSON:
    {
        "current_path": "current/path/in/filebrowser/widget"
    }
Reply JSON:
    {
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
Error JSON:
    {
        "code": "10000",
        "message": "Not in a Git repository"
    }


## git status

URL:  
    POST /git/status
Request JSON:
    {
        "current_path": "current/path/in/filebrowser/widget"
    }
Reply JSON:
    {
        "current_path": "current/path/in/filebrowser/widget",
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
        "code": "10000",
        "message": "Not in a Git repository"
    }

## git add

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

    }
Error JSON:
    {
        "code": "10001",
        "message": "File not found"
    }

## git checkout

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

    }
Error JSON:
    {
        "code": "10001",
        "message": "File not found"
    }

## git commit

URL:  
    POST /git/commit
Request JSON:
    {
        "commit_msg": "/typed/in/message/for/commit", 
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
Reply JSON:
    {

    }
Error JSON:
    {
        "code": "10001",
        "message": "Commit failed"
    }

## git reset

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
        ????
    }
Error JSON:
    {
        "code": "10001",
        "message": "File not found"
    }

