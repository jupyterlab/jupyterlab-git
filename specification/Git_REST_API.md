# Specification of jupyterlab-git REST API

A description of all jupyterlab-git REST API endpoints
Contents for each call include:

1. URLS
2. Request JSON
3. Reply JSON
4. How errors are handled (HTTP success codes, error JSON)

### /all_history - Get all git information of current repository

Request with a current_path. If the current_path is a git repository, return all the git repository information. This request contains 4 separate requests on server side (show_top_level, branch, log, status)
and may fail individually, so each request has its own code to indicate execution status (zero for success, non-zero for failure)
URL:

```bash
    POST /git/all_history
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

On success

```bash
    {
        "code": 0,
    	"data":{
            "show_top_level": {
                "code": 0,
                "top_repo_path": "/absolute/path/to/root/of/repo"
            }
            "branch"?: {
                "code": 0,
                "branches": [
                    {
                        "is_current_branch":false,
                        "is_remote_branch":true,
                        "name":"branch-name",
                        "upstream":"upstream-branch-name",
                        "top_commit":"abcdefghijklmnopqrstuvwxyz01234567890123",
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

On failure

```bash
    {
        "code": 128,
        "command": "git show_top_level"
        "message": "Not in a Git repository"
    }
```

### /show_top_level - Show the absolute path of the top-level directory

Request with a current_path. If the current_path is a git repository, return the absolute path of the top-level directory.

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

On success

```bash
    {
        "code": 0,
        "top_repo_path": "/absolute/path/to/root/of/repo"
     }

```

On failure

```bash
    {
        "code": 128,
        "command": "git showtoplevel"
        "message": "Not in a Git repository"
    }
```

### /show_prefix - Show the relative path of the current directory

Request with a current_path. Show the path of the current directory relative to the top-level directory.

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

On success

```bash
    {
        "code": 0,
        "under_repo_path": "/relative/path/to/top/level/of/repo"
     }

```

On failure

```bash
    {
        "code": 11,
        "command": "git rev-parse --show-prefix"
        "message": "Git command err info"
    }
```

### /branch - List all branches

Request with a current_path. Get a list of all the branches.

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

On success

```bash
    {
        "code": 0,
        "branches": [
            {
                "is_current_branch":false,
                "is_remote_branch":true,
                "name":"branch-name",
                "upstream":"upstream-branch-name",
                "top_commit":"abcdefghijklmnopqrstuvwxyz01234567890123",
                "tag":"branch-tag"
            }
        ]
     }

```

On failure

```bash
    {
        "code": 11,
        "command": "git branch -a"
        "message": "Git command error info"
    }
```

### /log - Show past commit logs

Request with a current_path. Get general info on all past commits.

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

On success

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

On failure

```bash
    {
        "code": 11,
        "command": "git log"
        "message": "Git command error info"
    }
```

### /config - Get or set configuration options

If no `options` in the request, get the `options` in the response.
Otherwise set the provided options (if allowed) and return `message`.

URL:

```bash
    POST /git/config
```

Request JSON:

```bash
    {
        "path": "/absolute/path/to/root/of/repo",
        "options": {
            "key1": "value1",
            "keyI": "valueI"
        }
    }
```

HTTP Response

```bash
Status: 201 OK
```

Reply JSON:

On success

```bash
{
    "code": "0",
    "message"?: "Git command output",
    "options"?: {
        "key1": "value1",
        "keyI": "valueI"
    }
}
```

On failure

```bash
    {
        "code": 128,
        "command": "git config --add name value"
        "message": "Git command error info"
    }
```

### /detailed_log - Get detailed information of a specific past commit

Request with a specified selected_hash and a current_path. Get the detailed info of the selected commit.

URL:

```bash
    POST /git/detailed_log
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

On success

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
		"modified_file_name": "filename",
                "insertion": "49";
                "deletion": "108"
            }
        ]
    }

```

On failure

```bash
    {
        "code": 11,
        "command": "git log -1 selected_hash"
        "message": "Git command error info"
    }
```

### /status - Show the working tree's status

Request with a current_path. Get the full status of the current working tree.

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

On success

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

On failure

```bash
    {
        "code": 10001,
        "command": "git status"
        "message": "Not in a Git repository"
    }
```

### /add - Add new file or existing file's changes to git

Request with add_all (check if add all changes), a target filename, and a top_repo_path. Add a new file or an existing file's changes to the current repository.

URL:

```bash
    POST /git/add
```

Request JSON:

```bash
    {
        "add_all": false,
        "file_name": "file/or/folder/path",
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
```

HTTP response

```bash
Status: 200 OK
```

Reply JSON:

On success

```bash
    {
        "code": 0,
     }

```

On failure

```bash
    {
        "code": 11,
        "command": "git add"
        "message": "Git command error info"
    }
```

### /add_all_untracked - Add all the untracked files to git

Request with a top_repo_path. Add only all of the untracked files to git.

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

On success

```bash
    {
        "code": 0,
     }

```

On failure

```bash
    {
        "code": 11,
        "command": "echo "a\n*\nq\n" | git add -i"
        "message": "Git command error info"
    }
```

### /checkout - Switch branches or restore working tree files

Request with a checkout_branch (boolean for if it's a switch branch request), a new_check (boolean for if the target branch needs to be created), a branch target branch_name, a checkout_all (boolean for if discarding all changes), a restore target file_name and a top_repo_path. Performs either a branch change, branch creation and change, checkout of all files, or checkout of a single file.

URL:

```bash
    POST /git/checkout
```

Request JSON:

```bash
    {
        "checkout_branch": false,
        "new_check": false,
        "branch_name": "target-branch-name",
        "checkout_all": false,
        "file_name": "file/or/folder/path",
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
```

HTTP response

```bash
Status: 200 OK
```

Reply JSON:

On success

```bash
    {
        "code": 0,
     }

```

On failure

```bash
    {
        "code": 11,
        "command": "git checkout"
        "message": "Git command error info"
    }
```

### /reset - Reset current HEAD to the specified state

Request with a reset_all (boolean for if reset all changes), a target file_name, and a top_repo_path to reset the specificed file to the last stored version.

URL:

```bash
    POST /git/reset
```

Request JSON:

```bash
    {
        "reset_all": false,
        "file_name": "file/or/folder/path",
        "top_repo_path": "/absolute/path/to/root/of/repo"
    }
```

HTTP response

```bash
Status: 200 OK
```

Reply JSON:

On success

```bash
    {
        "code": 0,
     }

```

On failure

```bash
    {
        "code": 11,
        "command": "git reset"
        "message": "Git command error info"
    }
```

### /commit - Commit working changes to the repository

Request with a commit_msg and a top_repo_path. Commit changes to the repository.

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

On success

```bash
    {
        "code": 0,
     }

```

On failure

```bash
    {
        "code": 11,
        "command": "git commit -m commit_msg"
        "message": "Git command error info"
    }
```

### /init - Create an empty Git repository or reinitialize an existing one

Request with a currrent_path. Create an empty git repository in the current directory or reinitalize the current git repository. WARNING: this will completely wipe your existing local repository.

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

On success

```bash
    {
        "code": 0,
     }

```

On failure

```bash
    {
        "code": 11,
        "command": "git init"
        "message": "Git init command error"
    }
```
