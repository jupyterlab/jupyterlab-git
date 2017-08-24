# Specification of jupyterlab-git REST API
This part of the REST API contains calls for working with the git-plugin of jupyterlab. 
Contents for each call include:
1. URLS: Only POST can send data to server through Jupyterlab"s ServerConnection, so, all commands use POST
3. Request JSON
4. Reply JSON
5. How errors are handled (HTTP success codes, error JSON)

### git API - Get all information of current repo
Request with a "current_path", if it"s a git repo, return all the git repo information with a zero "code", if not, return error message with a non-zero "code".
This request consists 4 seperate subprocess executions on server side (showtoplevel, branch, log, status) and may fail individually, so each part has its own "code" to indicate execution status(zero for success, none-zero for failure)   

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
                "code": 0, 
                "top_repo_path": "/absolute/path/to/root/of/repo"
            }
            "branch"?: {
                "code": 0,
                "branches": [
                    {
                        "current":false, 
                        "remote":true,
                        "name":"branch-name", 
                        "tag":"branch-tag"
                    }
                ]
            } 
            "log"?: { 
                "code": 0,
                "commits": [
                    {
                        "commit":"1234567890987654321", 
                        "author": "person0",
                        "date": "3-hourss-ago",
                        "commit_msg": "update-file-changes" 
                    }
                ]
            } 
            "status"?: {
                "code": 0,
                "files": {
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
        "code": 128,
        "command": "git showtoplevel"
        "message": "Not in a Git repository"
    }
```

### git showtoplevel - Show the absolute path of the top-level directory
Request with a "current_path", if it"s a git repo, return the absolute path of the top-level directory with a zero "code", if not, return error message with a non-zero "code".

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
        "code": 0, 
        "top_repo_path": "/absolute/path/to/root/of/repo"
     }

```
on git command failure
```bash
    {
        "code": 128,
        "command": "git showtoplevel"
        "message": "Not in a Git repository"
    }
```

### git showprefix - Show the path of the current directory relative to the top-level directory
Request with a "current_path", When the command is invoked from a subdirectory, show the path of the current directory relative to the top-level directory

URL:
```bash 
    POST /git/showprefix 
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
        "under_repo_path": "/relative/path/to/top/level/of/repo"
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": "git rev-parse --show-prefix"
        "message": "Git command err info"
    }
```

### git branch - List branches
Request with a "current_path" to get info of all the branches.

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
        "code": 0,
        "branches": [
            {
                "current":false,
                "remote":true,
                "name":"branch-name",
                "tag":"branch-tag"
            }
        ]
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": "git branch -a"
        "message": "Git command error info"
    }
```

### git log - Show commit logs
Request with a "current_path" to get the general info of all past commits.

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
        "code": 0,
        "commits": [
            {
                "commit":"1234567890987654321", 
                "author": "person0",
                "date": "3-hourss-ago",
                "commit_msg": "update-file-changes" 
            }
        ]
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": "git log"
        "message": "Git command error info"
    }
```

### git log_1 - Get detail information of a selected past commit
Request with a specified "selected_hash" and a "current_path" to get the detail info of this commit.

URL:
```bash 
    POST /git/log_1 
```
Request JSON:
```bash
    {
        "selected_hash": "1234567890987654321"
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
	    "code": 0;
	    "modified_file_note": "5 files changes, 100 insetion, 200 deletion",
        "modified_files_count": "5",
        "number_of_insertions": "100",
        "number_of_deletions": "200",
        "modified_files": [
            { 
                "modified_file_path": "file/path",
                "insertion": "49";
                "deletion": "108"
            }
        ]
    }

```
on git command failure
```bash
    {
        "code": 11,
        "command": "git log -1 selected_hash"
        "message": "Git command error info"
    }
```

### git status - Show the working tree status
Request with a "current_path" to get the full status of current working tree.

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
                "to": "filename",
                "from": "original/path/for/copied/file/or/folder"
            }
        ]
    }
```
on git command failure
```bash
    {
        "code": 10001,
        "command": "git status"
        "message": "Not in a Git repository"
    }
```

### git add - Add file contents to the index
Request with a "add_all" (check if add all changes), a target "filename", and a "top_repo_path" to add file contents to the index.

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
        "code": 0,
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": "git add"
        "message": "Git command error info"
    }
```

### git add_all_untracked - Add all the untracked file contents to the index
Request with a "top_repo_path" to add  and ONLY add all the untracked file contents to the index.

URL:
```bash 
    POST /git/add_all_untracked
```
Request JSON:
```bash
    {
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
        "code": 0,
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": "echo "a\n*\nq\n" | git add -i"
        "message": "Git command error info"
    }
```

### git checkout - Switch branches or restore working tree files
Request with a "checkout_branch" (if it"s a switch-branch request), a "new_check" (if the target branch needs to be created), a branch target "branchname",
a "checkout_all" (if discard all changes), a restore target "filename" and a "top_repo_path" to determine the checkout action and target

URL:
```bash 
    POST /git/checkout
```
Request JSON:
```bash
    {
        "checkout_branch": false,
        "new_check": false,
        "branchname": "target-branch-name",
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
        "code": 0,
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": "git checkout"
        "message": "Git command error info"
    }
```

### git reset - Reset current HEAD to the specified state
Request with a "reset_all" (check if reset all changes), a target "filename", and a "top_repo_path" to reset file contents to the index.

URL:
```bash 
    POST /git/reset
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
        "code": 0,
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": "git reset"
        "message": "Git command error info"
    }
```

### git commit - Record changes to the repository
Request with a "commit_msg" and a "top_repo_path" to commit changes.

URL:
```bash 
    POST /git/commit
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
        "code": 0,
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": "git commit -m commit_msg"
        "message": "Git command error info"
    }
```

### git pull - Fetch from and integrate with another repository or a local branch
Request with a specified remote-repo "origin",  a specified branch "master", and a "curr_fb_path" to fetch.

URL:
```bash 
    POST /git/pull
```
Request JSON:
```bash
    {
        "origin": "remote-repository-to-Pull-from", 
        "master": "branch-to-Pull-into",
        "curr_fb_path": "current/path/in/filebrowser/widget"
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
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": "git pull origin master"
        "message": "Git pull command error and help tips"
    }
```

### git push - Update remote refs along with associated objects
Request with a specified remote-repo "origin",  a specified branch "master", and a "curr_fb_path" to push.

URL:
```bash 
    POST /git/push
```
Request JSON:
```bash
    {
        "origin": "remote-repository-to-Push-into", 
        "master": "branch-to-Push-from",
        "curr_fb_path": "current/path/in/filebrowser/widget"
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
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": "git push origin master"
        "message": "Git push command error and help tips"
    }
```

### git init - Create an empty Git repository or reinitialize an existing one
Request with a "currrent_path" to init as a git repo.

URL:
```bash 
    POST /git/init
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
     }

```
on git command failure
```bash
    {
        "code": 11,
        "command": "git init"
        "message": "Git init command error"
    }
```
