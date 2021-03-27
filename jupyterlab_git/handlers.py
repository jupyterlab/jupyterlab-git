"""
Module with all the individual handlers, which execute git commands and return the results to the frontend.
"""
import json
import os
from pathlib import Path

import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url2path
from jupyter_server.utils import url_path_join as ujoin
from packaging.version import parse

from ._version import __version__
from .git import DEFAULT_REMOTE_NAME
from .log import get_logger

# Git configuration options exposed through the REST API
ALLOWED_OPTIONS = ["user.name", "user.email"]


class GitHandler(APIHandler):
    """
    Top-level parent class.
    """

    @property
    def git(self):
        return self.settings["git"]


class GitCloneHandler(GitHandler):
    @tornado.web.authenticated
    async def post(self):
        """
        Handler for the `git clone`

        Input format:
            {
              'current_path': 'current_file_browser_path',
              'repo_url': 'https://github.com/path/to/myrepo',
              OPTIONAL 'auth': '{ 'username': '<username>',
                                  'password': '<password>'
                                }'
            }
        """
        data = self.get_json_body()
        response = await self.git.clone(
            data["current_path"], data["clone_url"], data.get("auth", None)
        )

        if response["code"] != 0:
            self.set_status(500)
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

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, calls individual handlers for
        'git show_top_level', 'git branch', 'git log', and 'git status'
        """
        body = self.get_json_body()
        current_path = body["current_path"]
        history_count = body["history_count"]

        show_top_level = await self.git.show_top_level(current_path)
        if show_top_level.get("top_repo_path") is None:
            self.set_status(500)
            self.finish(json.dumps(show_top_level))
        else:
            branch = await self.git.branch(current_path)
            log = await self.git.log(current_path, history_count)
            status = await self.git.status(current_path)

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

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, displays the git root directory inside a repository.
        """
        current_path = self.get_json_body()["current_path"]
        result = await self.git.show_top_level(current_path)

        if result["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(result))


class GitShowPrefixHandler(GitHandler):
    """
    Handler for 'git rev-parse --show-prefix'.
    Displays the prefix path of a directory in a repository,
    with respect to the root directory.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, displays the prefix path of a directory in a repository,
        with respect to the root directory.
        """
        current_path = self.get_json_body()["current_path"]
        result = await self.git.show_prefix(current_path)

        if result["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(result))


class GitFetchHandler(GitHandler):
    """
    Handler for 'git fetch'
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, fetch from remotes.
        """
        current_path = self.get_json_body()["current_path"]
        result = await self.git.fetch(current_path)

        if result["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(result))


class GitStatusHandler(GitHandler):
    """
    Handler for 'git status --porcelain', fetches the git status.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, fetches the git status.
        """
        current_path = self.get_json_body()["current_path"]
        result = await self.git.status(current_path)

        if result["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(result))


class GitLogHandler(GitHandler):
    """
    Handler for 'git log --pretty=format:%H-%an-%ar-%s'.
    Fetches Commit SHA, Author Name, Commit Date & Commit Message.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler,
        fetches Commit SHA, Author Name, Commit Date & Commit Message.
        """
        body = self.get_json_body()
        current_path = body["current_path"]
        history_count = body.get("history_count", 25)
        result = await self.git.log(current_path, history_count)

        if result["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(result))


class GitDetailedLogHandler(GitHandler):
    """
    Handler for 'git log -1 --stat --numstat --oneline' command.
    Fetches file names of committed files, Number of insertions &
    deletions in that commit.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, fetches file names of committed files, Number of
        insertions & deletions in that commit.
        """
        data = self.get_json_body()
        selected_hash = data["selected_hash"]
        current_path = data["current_path"]
        result = await self.git.detailed_log(selected_hash, current_path)

        if result["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(result))


class GitDiffHandler(GitHandler):
    """
    Handler for 'git diff --numstat'. Fetches changes between commits & working tree.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, fetches differences between commits & current working
        tree.
        """
        top_repo_path = self.get_json_body()["top_repo_path"]
        my_output = await self.git.diff(top_repo_path)

        if my_output["code"] != 0:
            self.set_status(500)
        self.finish(my_output)


class GitBranchHandler(GitHandler):
    """
    Handler for 'git branch -a'. Fetches list of all branches in current repository
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, fetches all branches in current repository.
        """
        current_path = self.get_json_body()["current_path"]
        result = await self.git.branch(current_path)

        if result["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(result))


class GitBranchDeleteHandler(GitHandler):
    """
    Handler for 'git branch -D <branch>'
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, delete branch in current repository.

        Body: {
            "current_path": Git repository path relatively to the server root,
            "branch": Branch name to be deleted
        }
        """
        data = self.get_json_body()
        result = await self.git.branch_delete(data["current_path"], data["branch"])

        if result["code"] != 0:
            self.set_status(500)
            self.finish(json.dumps(result))
        else:
            self.set_status(204)


class GitAddHandler(GitHandler):
    """
    Handler for git add <filename>'.
    Adds one or all files to the staging area.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, adds one or all files into the staging area.
        """
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        if data["add_all"]:
            body = await self.git.add_all(top_repo_path)
        else:
            filename = data["filename"]
            body = await self.git.add(filename, top_repo_path)

        if body["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(body))


class GitAddAllUnstagedHandler(GitHandler):
    """
    Handler for 'git add -u'. Adds ONLY all unstaged files, does not touch
    untracked or staged files.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, adds all the changed files.
        """
        body = await self.git.add_all_unstaged(self.get_json_body()["top_repo_path"])
        if body["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(body))


class GitAddAllUntrackedHandler(GitHandler):
    """
    Handler for 'echo "a\n*\nq\n" | git add -i'. Adds ONLY all
    untracked files, does not touch unstaged or staged files.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, adds all the untracked files.
        """
        body = await self.git.add_all_untracked(self.get_json_body()["top_repo_path"])
        if body["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(body))


class GitRemoteAddHandler(GitHandler):
    """Handler for 'git remote add <name> <url>'."""

    @tornado.web.authenticated
    async def post(self):
        """POST request handler to add a remote."""
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        name = data.get("name", DEFAULT_REMOTE_NAME)
        url = data["url"]
        output = await self.git.remote_add(top_repo_path, url, name)
        if output["code"] == 0:
            self.set_status(201)
        else:
            self.set_status(500)
        self.finish(json.dumps(output))


class GitResetHandler(GitHandler):
    """
    Handler for 'git reset <filename>'.
    Moves one or all files from the staged to the unstaged area.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler,
        moves one or all files from the staged to the unstaged area.
        """
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        if data["reset_all"]:
            body = await self.git.reset_all(top_repo_path)
        else:
            filename = data["filename"]
            body = await self.git.reset(filename, top_repo_path)

        if body["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(body))


class GitDeleteCommitHandler(GitHandler):
    """
    Handler for 'git revert --no-commit <SHA>'.
    Deletes the specified commit from the repository, leaving history intact.
    """

    @tornado.web.authenticated
    async def post(self):
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        commit_id = data["commit_id"]
        body = await self.git.delete_commit(commit_id, top_repo_path)

        if body["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(body))


class GitResetToCommitHandler(GitHandler):
    """
    Handler for 'git reset --hard <SHA>'.
    Deletes all commits from head to the specified commit, making the specified commit the new head.
    """

    @tornado.web.authenticated
    async def post(self):
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        commit_id = data["commit_id"]
        body = await self.git.reset_to_commit(commit_id, top_repo_path)

        if body["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(body))


class GitCheckoutHandler(GitHandler):
    """
    Handler for 'git checkout <branchname>'. Changes the current working branch.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, changes between branches.
        """
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        if data["checkout_branch"]:
            if data["new_check"]:
                body = await self.git.checkout_new_branch(
                    data["branchname"], data["startpoint"], top_repo_path
                )
            else:
                body = await self.git.checkout_branch(data["branchname"], top_repo_path)
        elif data["checkout_all"]:
            body = await self.git.checkout_all(top_repo_path)
        else:
            body = await self.git.checkout(data["filename"], top_repo_path)

        if body["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(body))


class GitCommitHandler(GitHandler):
    """
    Handler for 'git commit -m <message>'. Commits files.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, commits files.
        """
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        commit_msg = data["commit_msg"]
        body = await self.git.commit(commit_msg, top_repo_path)

        if body["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(body))


class GitUpstreamHandler(GitHandler):
    @tornado.web.authenticated
    async def post(self):
        """
        Handler for the `git rev-parse --abbrev-ref $CURRENT_BRANCH_NAME@{upstream}` on the repo. Used to check if there
        is a upstream branch defined for the current Git repo (and a side-effect is disabling the Git push/pull actions)

        Input format:
            {
              'current_path': 'current_file_browser_path',
            }
        """
        current_path = self.get_json_body()["current_path"]
        current_branch = await self.git.get_current_branch(current_path)
        response = await self.git.get_upstream_branch(current_path, current_branch)
        if response["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(response))


class GitPullHandler(GitHandler):
    """
    Handler for 'git pull'. Pulls files from a remote branch.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, pulls files from a remote branch to your current branch.
        """
        data = self.get_json_body()
        response = await self.git.pull(
            data["current_path"],
            data.get("auth", None),
            data.get("cancel_on_conflict", False),
        )

        if response["code"] != 0:
            self.set_status(500)

        self.finish(json.dumps(response))


class GitPushHandler(GitHandler):
    """
    Handler for 'git push <first-branch> <second-branch>.
    Pushes committed files to a remote branch.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler,
        pushes committed files from your current branch to a remote branch

        Request body:
        {
            current_path: string, # Git repository path
            remote?: string # Remote to push to; i.e. <remote_name> or <remote_name>/<branch>
        }
        """
        data = self.get_json_body()
        current_path = data["current_path"]
        known_remote = data.get("remote")

        current_local_branch = await self.git.get_current_branch(current_path)

        set_upstream = False
        current_upstream_branch = await self.git.get_upstream_branch(
            current_path, current_local_branch
        )

        if known_remote is not None:
            set_upstream = current_upstream_branch["code"] != 0

            remote_name, _, remote_branch = known_remote.partition("/")

            current_upstream_branch = {
                "code": 0,
                "remote_branch": remote_branch or current_local_branch,
                "remote_short_name": remote_name,
            }

        if current_upstream_branch["code"] == 0:
            branch = ":".join(["HEAD", current_upstream_branch["remote_branch"]])
            response = await self.git.push(
                current_upstream_branch["remote_short_name"],
                branch,
                current_path,
                data.get("auth", None),
                set_upstream,
            )

        else:
            # Allow users to specify upstream through their configuration
            # https://git-scm.com/docs/git-config#Documentation/git-config.txt-pushdefault
            # Or use the remote defined if only one remote exists
            config = await self.git.config(current_path)
            config_options = config["options"]
            list_remotes = await self.git.remote_show(current_path)
            remotes = list_remotes.get("remotes", list())
            push_default = config_options.get("remote.pushdefault")

            default_remote = None
            if push_default is not None and push_default in remotes:
                default_remote = push_default
            elif len(remotes) == 1:
                default_remote = remotes[0]

            if default_remote is not None:
                response = await self.git.push(
                    default_remote,
                    current_local_branch,
                    current_path,
                    data.get("auth", None),
                    set_upstream=True,
                )
            else:
                response = {
                    "code": 128,
                    "message": "fatal: The current branch {} has no upstream branch.".format(
                        current_local_branch
                    ),
                    "remotes": remotes,  # Returns the list of known remotes
                }

        if response["code"] != 0:
            self.set_status(500)

        self.finish(json.dumps(response))


class GitInitHandler(GitHandler):
    """
    Handler for 'git init'. Initializes a repository.
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, initializes a repository.
        """
        current_path = self.get_json_body()["current_path"]
        body = await self.git.init(current_path)

        if body["code"] != 0:
            self.set_status(500)

        self.finish(json.dumps(body))


class GitChangedFilesHandler(GitHandler):
    @tornado.web.authenticated
    async def post(self):
        body = await self.git.changed_files(**self.get_json_body())

        if body["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(body))


class GitConfigHandler(GitHandler):
    """
    Handler for 'git config' commands
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST get (if no options are passed) or set configuration options
        """
        data = self.get_json_body()
        top_repo_path = data["path"]
        options = data.get("options", {})

        filtered_options = {k: v for k, v in options.items() if k in ALLOWED_OPTIONS}
        response = await self.git.config(top_repo_path, **filtered_options)
        if "options" in response:
            response["options"] = {
                k: v for k, v in response["options"].items() if k in ALLOWED_OPTIONS
            }

        if response["code"] != 0:
            self.set_status(500)
        else:
            self.set_status(201)
        self.finish(json.dumps(response))


class GitContentHandler(GitHandler):
    """
    Handler to get file content at a certain git reference
    """

    @tornado.web.authenticated
    async def post(self):
        cm = self.contents_manager
        data = self.get_json_body()
        filename = data["filename"]
        reference = data["reference"]
        top_repo_path = os.path.join(cm.root_dir, url2path(data["top_repo_path"]))
        response = await self.git.get_content_at_reference(
            filename, reference, top_repo_path
        )
        self.finish(json.dumps(response))


class GitDiffNotebookHandler(GitHandler):
    """
    Returns nbdime diff of given notebook base content and remote content
    """

    @tornado.web.authenticated
    async def post(self):
        data = self.get_json_body()
        try:
            prev_content = data["previousContent"]
            curr_content = data["currentContent"]
        except KeyError as e:
            get_logger().error(f"Missing key in POST request.", exc_info=e)
            raise tornado.web.HTTPError(
                status_code=400, reason=f"Missing POST key: {e}"
            )
        try:
            content = await self.git.get_nbdiff(prev_content, curr_content)
        except Exception as e:
            get_logger().error(f"Error computing notebook diff.", exc_info=e)
            raise tornado.web.HTTPError(
                status_code=500,
                reason=f"Error diffing content: {e}.",
            ) from e
        self.finish(json.dumps(content))


class GitIgnoreHandler(GitHandler):
    """
    Handler to manage .gitignore
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST add entry in .gitignore
        """
        data = self.get_json_body()
        top_repo_path = data["top_repo_path"]
        file_path = data.get("file_path", None)
        use_extension = data.get("use_extension", False)
        if file_path:
            if use_extension:
                suffixes = Path(file_path).suffixes
                if len(suffixes) > 0:
                    file_path = "**/*" + ".".join(suffixes)
            body = await self.git.ignore(top_repo_path, file_path)
        else:
            body = await self.git.ensure_gitignore(top_repo_path)

        if body["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(body))


class GitSettingsHandler(GitHandler):
    @tornado.web.authenticated
    async def get(self):
        jlab_version = self.get_query_argument("version", None)
        if jlab_version is not None:
            jlab_version = str(parse(jlab_version))
        git_version = None
        try:
            git_version = await self.git.version()
        except Exception as error:
            self.log.debug(
                "[jupyterlab_git] Failed to execute 'git' command: {!s}".format(error)
            )
        server_version = str(__version__)
        # Similar to https://github.com/jupyter/nbdime/blob/master/nbdime/webapp/nb_server_extension.py#L90-L91
        root_dir = getattr(self.contents_manager, "root_dir", None)
        server_root = None if root_dir is None else Path(root_dir).as_posix()
        self.finish(
            json.dumps(
                {
                    "frontendVersion": jlab_version,
                    "gitVersion": git_version,
                    "serverRoot": server_root,
                    "serverVersion": server_version,
                }
            )
        )


class GitTagHandler(GitHandler):
    """
    Handler for 'git tag '. Fetches list of all tags in current repository
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, fetches all tags in current repository.
        """
        current_path = self.get_json_body()["current_path"]
        result = await self.git.tags(current_path)

        if result["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(result))


class GitTagCheckoutHandler(GitHandler):
    """
    Handler for 'git tag checkout '. Checkout the tag version of repo
    """

    @tornado.web.authenticated
    async def post(self):
        """
        POST request handler, checkout the tag version to a branch.
        """
        data = self.get_json_body()
        current_path = data["current_path"]
        tag = data["tag_id"]
        result = await self.git.tag_checkout(current_path, tag)

        if result["code"] != 0:
            self.set_status(500)
        self.finish(json.dumps(result))


# FIXME remove for 0.22 release - this avoid error when upgrading from 0.20 to 0.21 if the frontend
# has not been rebuilt yet.
class GitServerRootHandler(GitHandler):
    @tornado.web.authenticated
    async def get(self):
        # Similar to https://github.com/jupyter/nbdime/blob/master/nbdime/webapp/nb_server_extension.py#L90-L91
        root_dir = getattr(self.contents_manager, "root_dir", None)
        server_root = None if root_dir is None else Path(root_dir).as_posix()
        self.finish(json.dumps({"server_root": server_root}))


def setup_handlers(web_app):
    """
    Setups all of the git command handlers.
    Every handler is defined here, to be used in git.py file.
    """

    git_handlers = [
        ("/git/add", GitAddHandler),
        ("/git/add_all_unstaged", GitAddAllUnstagedHandler),
        ("/git/add_all_untracked", GitAddAllUntrackedHandler),
        ("/git/all_history", GitAllHistoryHandler),
        ("/git/branch", GitBranchHandler),
        ("/git/branch/delete", GitBranchDeleteHandler),
        ("/git/changed_files", GitChangedFilesHandler),
        ("/git/checkout", GitCheckoutHandler),
        ("/git/clone", GitCloneHandler),
        ("/git/commit", GitCommitHandler),
        ("/git/config", GitConfigHandler),
        ("/git/content", GitContentHandler),
        ("/git/delete_commit", GitDeleteCommitHandler),
        ("/git/detailed_log", GitDetailedLogHandler),
        ("/git/diff", GitDiffHandler),
        ("/git/diffnotebook", GitDiffNotebookHandler),
        ("/git/init", GitInitHandler),
        ("/git/log", GitLogHandler),
        ("/git/pull", GitPullHandler),
        ("/git/push", GitPushHandler),
        ("/git/remote/add", GitRemoteAddHandler),
        ("/git/remote/fetch", GitFetchHandler),
        ("/git/reset", GitResetHandler),
        ("/git/reset_to_commit", GitResetToCommitHandler),
        ("/git/server_root", GitServerRootHandler),
        ("/git/settings", GitSettingsHandler),
        ("/git/show_prefix", GitShowPrefixHandler),
        ("/git/show_top_level", GitShowTopLevelHandler),
        ("/git/status", GitStatusHandler),
        ("/git/upstream", GitUpstreamHandler),
        ("/git/ignore", GitIgnoreHandler),
        ("/git/tags", GitTagHandler),
        ("/git/tag_checkout", GitTagCheckoutHandler),
    ]

    # add the baseurl to our paths
    base_url = web_app.settings["base_url"]
    git_handlers = [(ujoin(base_url, x[0]), x[1]) for x in git_handlers]

    web_app.add_handlers(".*", git_handlers)
