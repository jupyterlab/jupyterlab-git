"""
Module with all the individual handlers, which execute git commands and return the results to the frontend.
"""
import json


from notebook.utils import url_path_join as ujoin
from notebook.base.handlers import APIHandler


class GitHandler(APIHandler):
    """
    Top-level parent class.
    """

    @property
    def git(self):
        return self.settings["git"]


class GitCloneHandler(GitHandler):
    def post(self):
        """
        Handler for the `git clone`

        Input format:
            {
              'current_path': 'current_file_browser_path',
              'repo_url': 'https://github.com/path/to/myrepo'
            }
        """
        data = json.loads(self.request.body.decode('utf-8'))
        response = self.git.clone(data['current_path'], data['clone_url'])
        self.finish(json.dumps(response))


class GitAllHistoryHandler(GitHandler):
    """
    Parent handler for all four history/status git commands:
    1. git show_top_level
    2. git branch
    3. git log
    4. git status
    Called on refresh of extension's widget
    """

    def post(self):
        """
        POST request handler, calls individual handlers for
        'git show_top_level', 'git branch', 'git log', and 'git status'
        """
        current_path = self.get_json_body()["current_path"]
        show_top_level = self.git.show_top_level(current_path)
        if show_top_level["code"] != 0:
            self.finish(json.dumps(show_top_level))
        else:
            branch = self.git.branch(current_path)
            log = self.git.log(current_path)
            status = self.git.status(current_path)

            result = {
                "code": show_top_level["code"],
                "data": {
                    "show_top_level": show_top_level,
                    "branch": branch,
                    "log": log,
                    "status": status,
                },
            }
            self.finish(json.dumps(result))


class GitShowTopLevelHandler(GitHandler):
    """
    Handler for 'git rev-parse --show-toplevel'.
    Displays the git root directory inside a repository.
    """

    def post(self):
        """
        POST request handler, displays the git root directory inside a repository.
        """
        current_path = self.get_json_body()["current_path"]
        result = self.git.show_top_level(current_path)
        self.finish(json.dumps(result))


class GitShowPrefixHandler(GitHandler):
    """
    Handler for 'git rev-parse --show-prefix'.
    Displays the prefix path of a directory in a repository,
    with respect to the root directory.
    """

    def post(self):
        """
        POST request handler, displays the prefix path of a directory in a repository,
        with respect to the root directory.
        """
        current_path = self.get_json_body()["current_path"]
        result = self.git.show_prefix(current_path)
        self.finish(json.dumps(result))


class GitStatusHandler(GitHandler):
    """
    Handler for 'git status --porcelain', fetches the git status.
    """

    def get(self):
        """
        GET request handler, shows file status, used in refresh method.
        """
        self.finish(
            json.dumps(
                {"add_all": "check", "filename": "filename", "top_repo_path": "path"}
            )
        )

    def post(self):
        """
        POST request handler, fetches the git status.
        """
        current_path = self.get_json_body()["current_path"]
        result = self.git.status(current_path)
        self.finish(json.dumps(result))


class GitLogHandler(GitHandler):
    """
    Handler for 'git log --pretty=format:%H-%an-%ar-%s'.
    Fetches Commit SHA, Author Name, Commit Date & Commit Message.
    """

    def post(self):
        """
        POST request handler,
        fetches Commit SHA, Author Name, Commit Date & Commit Message.
        """
        current_path = self.get_json_body()["current_path"]
        result = self.git.log(current_path)
        self.finish(json.dumps(result))


class GitDetailedLogHandler(GitHandler):
    """
    Handler for 'git log -1 --stat --numstat --oneline' command.
    Fetches file names of committed files, Number of insertions &
    deletions in that commit.
    """

    def post(self):
        """
        POST request handler, fetches file names of committed files, Number of
        insertions & deletions in that commit.
        """
        data = self.get_json_body()
        selected_hash = data["selected_hash"]
        current_path = data["current_path"]
        result = self.git.detailed_log(selected_hash, current_path)
        self.finish(json.dumps(result))


class GitDiffHandler(GitHandler):
    """
    Handler for 'git diff --numstat'. Fetches changes between commits & working tree.
    """

    def post(self):
        """
        POST request handler, fetches differences between commits & current working
        tree.
        """
        top_repo_path = self.get_json_body()["top_repo_path"]
        my_output = self.git.diff(top_repo_path)
        self.finish(my_output)
        print("GIT DIFF")
        print(my_output)


class GitBranchHandler(GitHandler):
    """
    Handler for 'git branch -a'. Fetches list of all branches in current repository
    """

    def post(self):
        """
        POST request handler, fetches all branches in current repository.
        """
        current_path = self.get_json_body()["current_path"]
        result = self.git.branch(current_path)
        self.finish(json.dumps(result))


class GitAddHandler(GitHandler):
    """
    Handler for git add <filename>'.
    Adds one or all files into to the staging area.
    """

    def get(self):
        """
        GET request handler, adds files in the staging area.
        """
        self.finish(
            json.dumps(
                {"add_all": "check", "filename": "filename", "top_repo_path": "path"}
            )
        )

    def post(self):
        """
        POST request handler, adds one or all files into the staging area.
        """
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        if data["add_all"]:
            my_output = self.git.add_all(top_repo_path)
        else:
            filename = data["filename"]
            my_output = self.git.add(filename, top_repo_path)
        self.finish(my_output)


class GitResetHandler(GitHandler):
    """
    Handler for 'git reset <filename>'.
    Moves one or all files from the staged to the unstaged area.
    """

    def post(self):
        """
        POST request handler,
        moves one or all files from the staged to the unstaged area.
        """
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        if data["reset_all"]:
            my_output = self.git.reset_all(top_repo_path)
        else:
            filename = data["filename"]
            my_output = self.git.reset(filename, top_repo_path)
        self.finish(my_output)


class GitDeleteCommitHandler(GitHandler):
    """
    Handler for 'git revert --no-commit <SHA>'.
    Deletes the specified commit from the repository, leaving history intact.
    """

    def post(self):
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        commit_id = data["commit_id"]
        output = self.git.delete_commit(commit_id, top_repo_path)
        self.finish(output)


class GitResetToCommitHandler(GitHandler):
    """
    Handler for 'git reset --hard <SHA>'.
    Deletes all commits from head to the specified commit, making the specified commit the new head.
    """

    def post(self):
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        commit_id = data["commit_id"]
        output = self.git.reset_to_commit(commit_id, top_repo_path)
        self.finish(output)


class GitCheckoutHandler(GitHandler):
    """
    Handler for 'git checkout <branchname>'. Changes the current working branch.
    """

    def post(self):
        """
        POST request handler, changes between branches.
        """
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        if data["checkout_branch"]:
            if data["new_check"]:
                print("to create a new branch")
                my_output = self.git.checkout_new_branch(
                    data["branchname"], top_repo_path
                )
            else:
                print("switch to an old branch")
                my_output = self.git.checkout_branch(
                    data["branchname"], top_repo_path
                )
        elif data["checkout_all"]:
            my_output = self.git.checkout_all(top_repo_path)
        else:
            my_output = self.git.checkout(data["filename"], top_repo_path)
        self.finish(my_output)


class GitCommitHandler(GitHandler):
    """
    Handler for 'git commit -m <message>'. Commits files.
    """

    def post(self):
        """
        POST request handler, commits files.
        """
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        commit_msg = data["commit_msg"]
        my_output = self.git.commit(commit_msg, top_repo_path)
        self.finish(my_output)


class GitUpstreamHandler(GitHandler):
    def post(self):
        """
        Handler for the `git rev-parse --abbrev-ref $CURRENT_BRANCH_NAME@{upstream}` on the repo. Used to check if there
        is a upstream branch defined for the current Git repo (and a side-effect is disabling the Git push/pull actions)

        Input format:
            {
              'current_path': 'current_file_browser_path',
            }
        """
        current_path = self.get_json_body()['current_path']
        current_branch = self.git.get_current_branch(current_path)
        upstream = self.git.get_upstream_branch(current_path, current_branch)
        self.finish(json.dumps({
            'upstream': upstream
        }))


class GitPullHandler(GitHandler):
    """
    Handler for 'git pull'. Pulls files from a remote branch.
    """

    def post(self):
        """
        POST request handler, pulls files from a remote branch to your current branch.
        """
        output = self.git.pull(self.get_json_body()['current_path'])
        self.finish(json.dumps(output))


class GitPushHandler(GitHandler):
    """
    Handler for 'git push <first-branch> <second-branch>.
    Pushes committed files to a remote branch.
    """

    def post(self):
        """
        POST request handler,
        pushes committed files from your current branch to a remote branch
        """
        current_path = self.get_json_body()['current_path']

        current_local_branch = self.git.get_current_branch(current_path)
        current_upstream_branch = self.git.get_upstream_branch(current_path, current_local_branch)

        if current_upstream_branch and current_upstream_branch.strip():
            upstream = current_upstream_branch.split('/')
            if len(upstream) == 1:
                # If upstream is a local branch
                remote = '.'
                branch = ':'.join(['HEAD', upstream[0]])
            else:
                # If upstream is a remote branch
                remote = upstream[0]
                branch = ':'.join(['HEAD', upstream[1]])

            response = self.git.push(remote, branch, current_path)

        else:
            response = {
                'code': 128,
                'message': 'fatal: The current branch {} has no upstream branch.'.format(current_local_branch)
            }
        self.finish(json.dumps(response))


class GitInitHandler(GitHandler):
    """
    Handler for 'git init'. Initializes a repository.
    """

    def post(self):
        """
        POST request handler, initializes a repository.
        """
        current_path = self.get_json_body()["current_path"]
        my_output = self.git.init(current_path)
        self.finish(my_output)


class GitAddAllUntrackedHandler(GitHandler):
    """
    Handler for 'echo "a\n*\nq\n" | git add -i'. Adds ONLY all untracked files.
    """

    def post(self):
        """
        POST request handler, adds all the untracked files.
        """
        top_repo_path = self.get_json_body()["top_repo_path"]
        my_output = self.git.add_all_untracked(top_repo_path)
        print(my_output)
        self.finish(my_output)


def setup_handlers(web_app):
    """
    Setups all of the git command handlers.
    Every handler is defined here, to be used in git.py file.
    """

    git_handlers = [
        ("/git/show_top_level", GitShowTopLevelHandler),
        ("/git/show_prefix", GitShowPrefixHandler),
        ("/git/add", GitAddHandler),
        ("/git/status", GitStatusHandler),
        ("/git/branch", GitBranchHandler),
        ("/git/reset", GitResetHandler),
        ("/git/delete_commit", GitDeleteCommitHandler),
        ("/git/reset_to_commit", GitResetToCommitHandler),
        ("/git/checkout", GitCheckoutHandler),
        ("/git/commit", GitCommitHandler),
        ("/git/pull", GitPullHandler),
        ("/git/push", GitPushHandler),
        ("/git/diff", GitDiffHandler),
        ("/git/log", GitLogHandler),
        ("/git/detailed_log", GitDetailedLogHandler),
        ("/git/init", GitInitHandler),
        ("/git/all_history", GitAllHistoryHandler),
        ("/git/add_all_untracked", GitAddAllUntrackedHandler),
        ("/git/clone", GitCloneHandler),
        ("/git/upstream", GitUpstreamHandler)
    ]

    # add the baseurl to our paths
    base_url = web_app.settings["base_url"]
    git_handlers = [(ujoin(base_url, x[0]), x[1]) for x in git_handlers]

    web_app.add_handlers(".*", git_handlers)
