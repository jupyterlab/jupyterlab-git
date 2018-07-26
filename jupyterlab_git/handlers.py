"""
Handler Module with all the individual handlers for the jupyterlab-gitextension.
"""
import json


from notebook.utils import url_path_join as ujoin
from notebook.base.handlers import APIHandler


class Git_handler(APIHandler):
    """
    Git Parent Handler.
    """

    @property
    def git(self):
        return self.settings["git"]


class Git_all_history_handler(Git_handler):
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
        my_data = json.loads(self.request.body.decode("utf-8"))
        current_path = my_data["current_path"]
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


class Git_show_top_level_handler(Git_handler):
    """
    Handler for 'git rev-parse --show-toplevel'. 
    Displays the git root directory inside a repository.
    """

    def post(self):
        """
        POST request handler, displays the git root directory inside a repository.
        """
        my_data = json.loads(self.request.body.decode("utf-8"))
        current_path = my_data["current_path"]
        result = self.git.show_top_level(current_path)
        self.finish(json.dumps(result))


class Git_show_prefix_handler(Git_handler):
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
        my_data = json.loads(self.request.body.decode("utf-8"))
        current_path = my_data["current_path"]
        result = self.git.show_prefix(current_path)
        self.finish(json.dumps(result))


class Git_status_handler(Git_handler):
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
        my_data = json.loads(self.request.body.decode("utf-8"))
        current_path = my_data["current_path"]
        result = self.git.status(current_path)
        self.finish(json.dumps(result))


class Git_log_handler(Git_handler):
    """
    Handler for 'git log --pretty=format:%H-%an-%ar-%s'. 
    Fetches Commit SHA, Author Name, Commit Date & Commit Message.
    """

    def post(self):
        """
        POST request handler, 
        fetches Commit SHA, Author Name, Commit Date & Commit Message.
        """
        my_data = json.loads(self.request.body.decode("utf-8"))
        current_path = my_data["current_path"]
        result = self.git.log(current_path)
        self.finish(json.dumps(result))


class Git_detailed_log_handler(Git_handler):
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
        my_data = json.loads(self.request.body.decode("utf-8"))
        selected_hash = my_data["selected_hash"]
        current_path = my_data["current_path"]
        result = self.git.detailed_log(selected_hash, current_path)
        self.finish(json.dumps(result))


class Git_diff_handler(Git_handler):
    """
    Handler for 'git diff --numstat'. Fetches changes between commits & working tree.
    """

    def post(self):
        """
        POST request handler, fetches differences between commits & current working
        tree.
        """
        my_data = json.loads(self.request.body.decode("utf-8"))
        top_repo_path = my_data["top_repo_path"]
        my_output = self.git.diff(top_repo_path)
        self.finish(my_output)
        print("GIT DIFF")
        print(my_output)


class Git_branch_handler(Git_handler):
    """
    Handler for 'git branch -a'. Fetches list of all branches in current repository
    """

    def post(self):
        """
        POST request handler, fetches all branches in current repository.
        """
        my_data = json.loads(self.request.body.decode("utf-8"))
        current_path = my_data["current_path"]
        result = self.git.branch(current_path)
        self.finish(json.dumps(result))


class Git_add_handler(Git_handler):
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
        my_data = json.loads(self.request.body.decode("utf-8"))
        top_repo_path = my_data["top_repo_path"]
        if my_data["add_all"]:
            my_output = self.git.add_all(top_repo_path)
        else:
            filename = my_data["filename"]
            my_output = self.git.add(filename, top_repo_path)
        self.finish(my_output)


class Git_reset_handler(Git_handler):
    """
    Handler for 'git reset <filename>'. 
    Moves one or all files from the staged to the unstaged area.
    """

    def post(self):
        """
        POST request handler, 
        moves one or all files from the staged to the unstaged area.
        """
        my_data = json.loads(self.request.body.decode("utf-8"))
        top_repo_path = my_data["top_repo_path"]
        if my_data["reset_all"]:
            my_output = self.git.reset_all(top_repo_path)
        else:
            filename = my_data["filename"]
            my_output = self.git.reset(filename, top_repo_path)
        self.finish(my_output)


class Git_checkout_handler(Git_handler):
    """
    Handler for 'git checkout <branchname>'. Changes the current working branch.
    """

    def post(self):
        """
        POST request handler, changes between branches.
        """
        my_data = json.loads(self.request.body.decode("utf-8"))
        top_repo_path = my_data["top_repo_path"]
        if my_data["checkout_branch"]:
            if my_data["new_check"]:
                print("to create a new branch")
                my_output = self.git.checkout_new_branch(
                    my_data["branchname"], top_repo_path
                )
            else:
                print("switch to an old branch")
                my_output = self.git.checkout_branch(
                    my_data["branchname"], top_repo_path
                )
        elif my_data["checkout_all"]:
            my_output = self.git.checkout_all(top_repo_path)
        else:
            my_output = self.git.checkout(my_data["filename"], top_repo_path)
        self.finish(my_output)


class Git_commit_handler(Git_handler):
    """
    Handler for 'git commit -m <message>'. Commits files.
    """

    def post(self):
        """
        POST request handler, commits files.
        """
        my_data = json.loads(self.request.body.decode("utf-8"))
        top_repo_path = my_data["top_repo_path"]
        commit_msg = my_data["commit_msg"]
        my_output = self.git.commit(commit_msg, top_repo_path)
        self.finish(my_output)


class Git_pull_handler(Git_handler):
    """
    Handler for 'git pull <first-branch> <second-branch>'. Pulls files from a remote branch.
    """

    def post(self):
        """
        POST request handler, pulls files from a remote branch to your current branch.
        """
        my_data = json.loads(self.request.body.decode("utf-8"))
        origin = my_data["origin"]
        master = my_data["master"]
        curr_fb_path = my_data["curr_fb_path"]
        my_output = self.git.pull(origin, master, curr_fb_path)
        self.finish(my_output)
        print("You Pulled")


class Git_push_handler(Git_handler):
    """
    Handler for 'git push <first-branch> <second-branch>. 
    Pushes committed files to a remote branch.
    """

    def post(self):
        """
        POST request handler, 
        pushes comitted files from your current branch to a remote branch
        """
        my_data = json.loads(self.request.body.decode("utf-8"))
        origin = my_data["origin"]
        master = my_data["master"]
        curr_fb_path = my_data["curr_fb_path"]
        my_output = self.git.push(origin, master, curr_fb_path)
        self.finish(my_output)
        print("You Pushed")


class Git_init_handler(Git_handler):
    """
    Handler for 'git init'. Initializes a repository.
    """

    def post(self):
        """
        POST request handler, initializes a repository.
        """
        my_data = json.loads(self.request.body.decode("utf-8"))
        current_path = my_data["current_path"]
        my_output = self.git.init(current_path)
        self.finish(my_output)


class Git_add_all_untracked_handler(Git_handler):
    """
    Handler for 'echo "a\n*\nq\n" | git add -i'. Adds ONLY all untracked files.
    """

    def post(self):
        """
        POST request handler, adds all the untracked files.
        """
        my_data = json.loads(self.request.body.decode("utf-8"))
        top_repo_path = my_data["top_repo_path"]
        my_output = self.git.add_all_untracked(top_repo_path)
        print(my_output)
        self.finish(my_output)


def setup_handlers(web_app):
    """
    Setups all of the git command handlers.
    Every handler is defined here, to be used in git.py file.
    """

    git_handlers = [
        ("/git/show_top_level", Git_show_top_level_handler),
        ("/git/show_prefix", Git_show_prefix_handler),
        ("/git/add", Git_add_handler),
        ("/git/status", Git_status_handler),
        ("/git/branch", Git_branch_handler),
        ("/git/reset", Git_reset_handler),
        ("/git/checkout", Git_checkout_handler),
        ("/git/commit", Git_commit_handler),
        ("/git/pull", Git_pull_handler),
        ("/git/push", Git_push_handler),
        ("/git/diff", Git_diff_handler),
        ("/git/log", Git_log_handler),
        ("/git/detailed_log", Git_detailed_log_handler),
        ("/git/init", Git_init_handler),
        ("/git/all_history", Git_all_history_handler),
        ("/git/add_all_untracked", Git_add_all_untracked_handler),
    ]

    # add the baseurl to our paths
    base_url = web_app.settings["base_url"]
    git_handlers = [(ujoin(base_url, x[0]), x[1]) for x in git_handlers]
    print("base_url: {}".format(base_url))
    print(git_handlers)

    web_app.add_handlers(".*", git_handlers)
