"""
Module for executing git commands, sending results back to the handlers
"""
import datetime
import os
import pathlib
import re
import shlex
import subprocess
from urllib.parse import unquote

import nbformat
import pexpect
import tornado
import tornado.locks
from nbdime import diff_notebooks

from .log import get_logger

# Regex pattern to capture (key, value) of Git configuration options.
# See https://git-scm.com/docs/git-config#_syntax for git var syntax
CONFIG_PATTERN = re.compile(r"(?:^|\n)([\w\-\.]+)\=")
DEFAULT_REMOTE_NAME = "origin"
# Maximum number of character of command output to print in debug log
MAX_LOG_OUTPUT = 500  # type: int
# How long to wait to be executed or finished your execution before timing out
MAX_WAIT_FOR_EXECUTE_S = 20
# Ensure on NFS or similar, that we give the .git/index.lock time to be removed
MAX_WAIT_FOR_LOCK_S = 5
# How often should we check for the lock above to be free? This comes up more on things like NFS
CHECK_LOCK_INTERVAL_S = 0.1
# Parse Git version output
GIT_VERSION_REGEX = re.compile(r"^git\sversion\s(?P<version>\d+(.\d+)*)")
# Parse Git branch status
GIT_BRANCH_STATUS = re.compile(
    r"^## (?P<branch>([\w\-/]+|HEAD \(no branch\)|No commits yet on \w+))(\.\.\.(?P<remote>[\w\-/]+)( \[(ahead (?P<ahead>\d+))?(, )?(behind (?P<behind>\d+))?\])?)?$"
)

execution_lock = tornado.locks.Lock()


async def execute(
    cmdline: "List[str]",
    cwd: "str",
    env: "Optional[Dict[str, str]]" = None,
    username: "Optional[str]" = None,
    password: "Optional[str]" = None,
) -> "Tuple[int, str, str]":
    """Asynchronously execute a command.

    Args:
        cmdline (List[str]): Command line to be executed
        cwd (Optional[str]): Current working directory
        env (Optional[Dict[str, str]]): Defines the environment variables for the new process
        username (Optional[str]): User name
        password (Optional[str]): User password
    Returns:
        (int, str, str): (return code, stdout, stderr)
    """

    async def call_subprocess_with_authentication(
        cmdline: "List[str]",
        username: "str",
        password: "str",
        cwd: "Optional[str]" = None,
        env: "Optional[Dict[str, str]]" = None,
    ) -> "Tuple[int, str, str]":
        try:
            p = pexpect.spawn(
                cmdline[0],
                cmdline[1:],
                cwd=cwd,
                env=env,
                encoding="utf-8",
                timeout=None,
            )

            # We expect a prompt from git
            # In most of cases git will prompt for username and
            #  then for password
            # In some cases (Bitbucket) username is included in
            #  remote URL, so git will not ask for username
            i = await p.expect(["Username for .*: ", "Password for .*:"], async_=True)
            if i == 0:  # ask for username then password
                p.sendline(username)
                await p.expect("Password for .*:", async_=True)
                p.sendline(password)
            elif i == 1:  # only ask for password
                p.sendline(password)

            await p.expect(pexpect.EOF, async_=True)
            response = p.before

            returncode = p.wait()
            p.close()
            return returncode, "", response
        except pexpect.exceptions.EOF:  # In case of pexpect failure
            response = p.before
            returncode = p.exitstatus
            p.close()  # close process
            return returncode, "", response

    def call_subprocess(
        cmdline: "List[str]",
        cwd: "Optional[str]" = None,
        env: "Optional[Dict[str, str]]" = None,
    ) -> "Tuple[int, str, str]":
        process = subprocess.Popen(
            cmdline, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=cwd, env=env
        )
        output, error = process.communicate()
        return (process.returncode, output.decode("utf-8"), error.decode("utf-8"))

    try:
        await execution_lock.acquire(
            timeout=datetime.timedelta(seconds=MAX_WAIT_FOR_EXECUTE_S)
        )
    except tornado.util.TimeoutError:
        return (1, "", "Unable to get the lock on the directory")

    try:
        # Ensure our execution operation will succeed by first checking and waiting for the lock to be removed
        time_slept = 0
        lockfile = os.path.join(cwd, ".git", "index.lock")
        while os.path.exists(lockfile) and time_slept < MAX_WAIT_FOR_LOCK_S:
            await tornado.gen.sleep(CHECK_LOCK_INTERVAL_S)
            time_slept += CHECK_LOCK_INTERVAL_S

        # If the lock still exists at this point, we will likely fail anyway, but let's try anyway

        get_logger().debug("Execute {!s} in {!s}.".format(cmdline, cwd))
        if username is not None and password is not None:
            code, output, error = await call_subprocess_with_authentication(
                cmdline,
                username,
                password,
                cwd,
                env,
            )
        else:
            current_loop = tornado.ioloop.IOLoop.current()
            code, output, error = await current_loop.run_in_executor(
                None, call_subprocess, cmdline, cwd, env
            )
        log_output = (
            output[:MAX_LOG_OUTPUT] + "..." if len(output) > MAX_LOG_OUTPUT else output
        )
        log_error = (
            error[:MAX_LOG_OUTPUT] + "..." if len(error) > MAX_LOG_OUTPUT else error
        )
        get_logger().debug(
            "Code: {}\nOutput: {}\nError: {}".format(code, log_output, log_error)
        )
    except BaseException:
        get_logger().warning("Fail to execute {!s}".format(cmdline), exc_info=True)
    finally:
        execution_lock.release()

    return code, output, error


def strip_and_split(s):
    """strip trailing \x00 and split on \x00
    Useful for parsing output of git commands with -z flag.
    """
    return s.strip("\x00").split("\x00")


class Git:
    """
    A single parent class containing all of the individual git methods in it.
    """

    def __init__(self, contents_manager, config=None):
        self.contents_manager = contents_manager
        self.root_dir = os.path.expanduser(contents_manager.root_dir)
        self._config = config

    async def config(self, top_repo_path, **kwargs):
        """Get or set Git options.

        If no kwargs, all options are returned. Otherwise kwargs are set.
        """
        response = {"code": 1}

        if len(kwargs):
            output = []
            for k, v in kwargs.items():
                cmd = ["git", "config", "--add", k, v]
                code, out, err = await execute(cmd, cwd=top_repo_path)
                output.append(out.strip())
                response["code"] = code
                if code != 0:
                    response["command"] = " ".join(cmd)
                    response["message"] = err.strip()
                    return response

            response["message"] = "\n".join(output).strip()
        else:
            cmd = ["git", "config", "--list"]
            code, output, error = await execute(cmd, cwd=top_repo_path)
            response = {"code": code}

            if code != 0:
                response["command"] = " ".join(cmd)
                response["message"] = error.strip()
            else:
                raw = output.strip()
                s = CONFIG_PATTERN.split(raw)
                response["options"] = {k: v for k, v in zip(s[1::2], s[2::2])}

        return response

    async def changed_files(
        self, current_path, base=None, remote=None, single_commit=None
    ):
        """Gets the list of changed files between two Git refs, or the files changed in a single commit

        There are two reserved "refs" for the base
            1. WORKING : Represents the Git working tree
            2. INDEX: Represents the Git staging area / index

        Keyword Arguments:
            single_commit {string} -- The single commit ref
            base {string} -- the base Git ref
            remote {string} -- the remote Git ref

        Returns:
            dict -- the response of format {
                "code": int, # Command status code
                "files": [string, string], # List of files changed.
                "message": [string] # Error response
            }
        """
        if single_commit:
            cmd = ["git", "diff", single_commit, "--name-only", "-z"]
        elif base and remote:
            if base == "WORKING":
                cmd = ["git", "diff", remote, "--name-only", "-z"]
            elif base == "INDEX":
                cmd = ["git", "diff", "--staged", remote, "--name-only", "-z"]
            else:
                cmd = ["git", "diff", base, remote, "--name-only", "-z"]
        else:
            raise tornado.web.HTTPError(
                400, "Either single_commit or (base and remote) must be provided"
            )

        response = {}
        try:
            code, output, error = await execute(
                cmd, cwd=os.path.join(self.root_dir, current_path)
            )
        except subprocess.CalledProcessError as e:
            response["code"] = e.returncode
            response["message"] = e.output.decode("utf-8")
        else:
            response["code"] = code
            if code != 0:
                response["command"] = " ".join(cmd)
                response["message"] = error
            else:
                response["files"] = strip_and_split(output)

        return response

    async def clone(self, current_path, repo_url, auth=None):
        """
        Execute `git clone`.
        When no auth is provided, disables prompts for the password to avoid the terminal hanging.
        When auth is provided, await prompts for username/passwords and sends them
        :param current_path: the directory where the clone will be performed.
        :param repo_url: the URL of the repository to be cloned.
        :param auth: OPTIONAL dictionary with 'username' and 'password' fields
        :return: response with status code and error message.
        """
        env = os.environ.copy()
        if auth:
            env["GIT_TERMINAL_PROMPT"] = "1"
            code, output, error = await execute(
                ["git", "clone", unquote(repo_url), "-q"],
                username=auth["username"],
                password=auth["password"],
                cwd=os.path.join(self.root_dir, current_path),
                env=env,
            )
        else:
            env["GIT_TERMINAL_PROMPT"] = "0"
            code, output, error = await execute(
                ["git", "clone", unquote(repo_url)],
                cwd=os.path.join(self.root_dir, current_path),
                env=env,
            )

        response = {"code": code, "message": output.strip()}

        if code != 0:
            response["message"] = error.strip()

        return response

    async def fetch(self, current_path):
        """
        Execute git fetch command
        """
        cwd = os.path.join(self.root_dir, current_path)
        # Start by fetching to get accurate ahead/behind status
        cmd = [
            "git",
            "fetch",
            "--all",
            "--prune",
        ]  # Run prune by default to help beginners

        code, _, fetch_error = await execute(cmd, cwd=cwd)

        result = {
            "code": code,
        }
        if code != 0:
            result["command"] = " ".join(cmd)
            result["error"] = fetch_error

        return result

    async def get_nbdiff(self, prev_content: str, curr_content: str) -> dict:
        """Compute the diff between two notebooks.

        Args:
            prev_content: Notebook previous content
            curr_content: Notebook current content
        Returns:
            {"base": Dict, "diff": Dict}
        """

        def read_notebook(content):
            if not content:
                return nbformat.versions[nbformat.current_nbformat].new_notebook()
            if isinstance(content, dict):
                # Content may come from model as a dict directly
                return (
                    nbformat.versions[
                        content.get("nbformat", nbformat.current_nbformat)
                    ]
                    .nbjson.JSONReader()
                    .to_notebook(content)
                )
            else:
                return nbformat.reads(content, as_version=4)

        current_loop = tornado.ioloop.IOLoop.current()
        prev_nb = await current_loop.run_in_executor(None, read_notebook, prev_content)
        curr_nb = await current_loop.run_in_executor(None, read_notebook, curr_content)
        thediff = await current_loop.run_in_executor(
            None, diff_notebooks, prev_nb, curr_nb
        )

        return {"base": prev_nb, "diff": thediff}

    async def status(self, current_path):
        """
        Execute git status command & return the result.
        """
        cwd = os.path.join(self.root_dir, current_path)
        cmd = ["git", "status", "--porcelain", "-b", "-u", "-z"]
        code, status, my_error = await execute(cmd, cwd=cwd)

        if code != 0:
            return {
                "code": code,
                "command": " ".join(cmd),
                "message": my_error,
            }

        # Add attribute `is_binary`
        command = [  # Compare stage to an empty tree see `_is_binary`
            "git",
            "diff",
            "--numstat",
            "-z",
            "--cached",
            "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
        ]
        text_code, text_output, _ = await execute(command, cwd=cwd)

        are_binary = dict()
        if text_code == 0:
            for line in filter(lambda l: len(l) > 0, strip_and_split(text_output)):
                diff, name = line.rsplit("\t", maxsplit=1)
                are_binary[name] = diff.startswith("-\t-")

        data = {
            "code": code,
            "branch": None,
            "remote": None,
            "ahead": 0,
            "behind": 0,
            "files": [],
        }
        result = []
        line_iterable = (line for line in strip_and_split(status) if line)

        try:
            first_line = next(line_iterable)
            # Interpret branch line
            match = GIT_BRANCH_STATUS.match(first_line)
            if match is not None:
                d = match.groupdict()
                branch = d.get("branch")
                if branch == "HEAD (no branch)":
                    branch = "(detached)"
                elif branch.startswith("No commits yet on "):
                    branch = "(initial)"
                data["branch"] = branch
                data["remote"] = d.get("remote")
                data["ahead"] = int(d.get("ahead") or 0)
                data["behind"] = int(d.get("behind") or 0)

            # Interpret file lines
            for line in line_iterable:
                name = line[3:]
                result.append(
                    {
                        "x": line[0],
                        "y": line[1],
                        "to": name,
                        # if file was renamed, next line contains original path
                        "from": next(line_iterable) if line[0] == "R" else name,
                        "is_binary": are_binary.get(name, None),
                    }
                )

            data["files"] = result
        except StopIteration:  # Raised if line_iterable is empty
            pass

        return data

    async def log(self, current_path, history_count=10):
        """
        Execute git log command & return the result.
        """
        cmd = [
            "git",
            "log",
            "--pretty=format:%H%n%an%n%ar%n%s",
            ("-%d" % history_count),
        ]
        code, my_output, my_error = await execute(
            cmd,
            cwd=os.path.join(self.root_dir, current_path),
        )
        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": my_error}

        result = []
        line_array = my_output.splitlines()
        i = 0
        PREVIOUS_COMMIT_OFFSET = 4
        while i < len(line_array):
            if i + PREVIOUS_COMMIT_OFFSET < len(line_array):
                result.append(
                    {
                        "commit": line_array[i],
                        "author": line_array[i + 1],
                        "date": line_array[i + 2],
                        "commit_msg": line_array[i + 3],
                        "pre_commit": line_array[i + PREVIOUS_COMMIT_OFFSET],
                    }
                )
            else:
                result.append(
                    {
                        "commit": line_array[i],
                        "author": line_array[i + 1],
                        "date": line_array[i + 2],
                        "commit_msg": line_array[i + 3],
                        "pre_commit": "",
                    }
                )
            i += PREVIOUS_COMMIT_OFFSET
        return {"code": code, "commits": result}

    async def detailed_log(self, selected_hash, current_path):
        """
        Execute git log -1 --numstat --oneline -z command (used to get
        insertions & deletions per file) & return the result.
        """
        cmd = ["git", "log", "-1", "--numstat", "--oneline", "-z", selected_hash]
        code, my_output, my_error = await execute(
            cmd,
            cwd=os.path.join(self.root_dir, current_path),
        )

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": my_error}

        total_insertions = 0
        total_deletions = 0
        result = []
        line_iterable = iter(strip_and_split(my_output)[1:])
        for line in line_iterable:
            is_binary = line.startswith("-\t-\t")
            insertions, deletions, file = line.split("\t")
            insertions = insertions.replace("-", "0")
            deletions = deletions.replace("-", "0")

            if file == "":
                # file was renamed or moved, we need next two lines of output
                from_path = next(line_iterable)
                to_path = next(line_iterable)
                modified_file_name = from_path + " => " + to_path
                modified_file_path = to_path
            else:
                modified_file_name = file.split("/")[-1]
                modified_file_path = file

            result.append(
                {
                    "modified_file_path": modified_file_path,
                    "modified_file_name": modified_file_name,
                    "insertion": insertions,
                    "deletion": deletions,
                    "is_binary": is_binary,
                }
            )
            total_insertions += int(insertions)
            total_deletions += int(deletions)

        modified_file_note = "{num_files} files changed, {insertions} insertions(+), {deletions} deletions(-)".format(
            num_files=len(result),
            insertions=total_insertions,
            deletions=total_deletions,
        )

        return {
            "code": code,
            "modified_file_note": modified_file_note,
            "modified_files_count": str(len(result)),
            "number_of_insertions": str(total_insertions),
            "number_of_deletions": str(total_deletions),
            "modified_files": result,
        }

    async def diff(self, top_repo_path):
        """
        Execute git diff command & return the result.
        """
        cmd = ["git", "diff", "--numstat", "-z"]
        code, my_output, my_error = await execute(cmd, cwd=top_repo_path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": my_error}

        result = []
        line_array = strip_and_split(my_output)
        for line in line_array:
            linesplit = line.split()
            result.append(
                {
                    "insertions": linesplit[0],
                    "deletions": linesplit[1],
                    "filename": linesplit[2],
                }
            )
        return {"code": code, "result": result}

    async def branch(self, current_path):
        """
        Execute 'git for-each-ref' command & return the result.
        """
        heads = await self.branch_heads(current_path)
        if heads["code"] != 0:
            # error; bail
            return heads

        remotes = await self.branch_remotes(current_path)
        if remotes["code"] != 0:
            # error; bail
            return remotes

        # all's good; concatenate results and return
        return {
            "code": 0,
            "branches": heads["branches"] + remotes["branches"],
            "current_branch": heads["current_branch"],
        }

    async def branch_delete(self, current_path, branch):
        """Execute 'git branch -D <branchname>'"""
        cmd = ["git", "branch", "-D", branch]
        code, _, error = await execute(
            cmd, cwd=os.path.join(self.root_dir, current_path)
        )
        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        else:
            return {"code": code}

    async def branch_heads(self, current_path):
        """
        Execute 'git for-each-ref' command on refs/heads & return the result.
        """
        # Format reference: https://git-scm.com/docs/git-for-each-ref#_field_names
        formats = ["refname:short", "objectname", "upstream:short", "HEAD"]
        cmd = [
            "git",
            "for-each-ref",
            "--format=" + "%09".join("%({})".format(f) for f in formats),
            "refs/heads/",
        ]

        code, output, error = await execute(
            cmd, cwd=os.path.join(self.root_dir, current_path)
        )
        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}

        current_branch = None
        results = []
        try:
            for name, commit_sha, upstream_name, is_current_branch in (
                line.split("\t") for line in output.splitlines()
            ):
                is_current_branch = bool(is_current_branch.strip())

                branch = {
                    "is_current_branch": is_current_branch,
                    "is_remote_branch": False,
                    "name": name,
                    "upstream": upstream_name if upstream_name else None,
                    "top_commit": commit_sha,
                    "tag": None,
                }
                results.append(branch)
                if is_current_branch:
                    current_branch = branch

            # Above can fail in certain cases, such as an empty repo with
            # no commits. In that case, just fall back to determining
            # current branch
            if not current_branch:
                current_name = await self.get_current_branch(current_path)
                branch = {
                    "is_current_branch": True,
                    "is_remote_branch": False,
                    "name": current_name,
                    "upstream": None,
                    "top_commit": None,
                    "tag": None,
                }
                results.append(branch)
                current_branch = branch

            return {
                "code": code,
                "branches": results,
                "current_branch": current_branch,
            }

        except Exception as downstream_error:
            return {
                "code": -1,
                "command": " ".join(cmd),
                "message": str(downstream_error),
            }

    async def branch_remotes(self, current_path):
        """
        Execute 'git for-each-ref' command on refs/heads & return the result.
        """
        # Format reference: https://git-scm.com/docs/git-for-each-ref#_field_names
        formats = ["refname:short", "objectname"]
        cmd = [
            "git",
            "for-each-ref",
            "--format=" + "%09".join("%({})".format(f) for f in formats),
            "refs/remotes/",
        ]

        code, output, error = await execute(
            cmd, cwd=os.path.join(self.root_dir, current_path)
        )
        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}

        results = []
        try:
            for name, commit_sha in (line.split("\t") for line in output.splitlines()):
                results.append(
                    {
                        "is_current_branch": False,
                        "is_remote_branch": True,
                        "name": name,
                        "upstream": None,
                        "top_commit": commit_sha,
                        "tag": None,
                    }
                )
            return {"code": code, "branches": results}
        except Exception as downstream_error:
            return {
                "code": -1,
                "command": " ".join(cmd),
                "message": str(downstream_error),
            }

    async def show_top_level(self, current_path):
        """
        Execute git --show-toplevel command & return the result.
        """
        cmd = ["git", "rev-parse", "--show-toplevel"]
        code, my_output, my_error = await execute(
            cmd,
            cwd=os.path.join(self.root_dir, current_path),
        )
        if code == 0:
            return {"code": code, "top_repo_path": my_output.strip("\n")}
        else:
            # Handle special case where cwd not inside a git repo
            lower_error = my_error.lower()
            if "fatal: not a git repository" in lower_error:
                return {"code": 0, "top_repo_path": None}

            return {
                "code": code,
                "command": " ".join(cmd),
                "message": my_error,
            }

    async def show_prefix(self, current_path):
        """
        Execute git --show-prefix command & return the result.
        """
        cmd = ["git", "rev-parse", "--show-prefix"]
        code, my_output, my_error = await execute(
            cmd,
            cwd=os.path.join(self.root_dir, current_path),
        )
        if code == 0:
            result = {"code": code, "under_repo_path": my_output.strip("\n")}
            return result
        else:
            return {
                "code": code,
                "command": " ".join(cmd),
                "message": my_error,
            }

    async def add(self, filename, top_repo_path):
        """
        Execute git add<filename> command & return the result.
        """
        if not isinstance(filename, str):
            # assume filename is a sequence of str
            cmd = ["git", "add"] + list(filename)
        else:
            cmd = ["git", "add", filename]
        code, _, error = await execute(cmd, cwd=top_repo_path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def add_all(self, top_repo_path):
        """
        Execute git add all command & return the result.
        """
        cmd = ["git", "add", "-A"]
        code, _, error = await execute(cmd, cwd=top_repo_path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def add_all_unstaged(self, top_repo_path):
        """
        Execute git add all unstaged command & return the result.
        """
        cmd = ["git", "add", "-u"]
        code, _, error = await execute(cmd, cwd=top_repo_path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def add_all_untracked(self, top_repo_path):
        """
        Find all untracked files, execute git add & return the result.
        """
        status = await self.status(top_repo_path)
        if status["code"] != 0:
            return status

        untracked = []
        for f in status["files"]:
            if f["x"] == "?" and f["y"] == "?":
                untracked.append(f["from"].strip('"'))

        return await self.add(untracked, top_repo_path)

    async def reset(self, filename, top_repo_path):
        """
        Execute git reset <filename> command & return the result.
        """
        cmd = ["git", "reset", "--", filename]
        code, _, error = await execute(cmd, cwd=top_repo_path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def reset_all(self, top_repo_path):
        """
        Execute git reset command & return the result.
        """
        cmd = ["git", "reset"]
        code, _, error = await execute(cmd, cwd=top_repo_path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def delete_commit(self, commit_id, top_repo_path):
        """
        Delete a specified commit from the repository.
        """
        cmd = ["git", "revert", "--no-commit", commit_id]
        code, _, error = await execute(cmd, cwd=top_repo_path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def reset_to_commit(self, commit_id, top_repo_path):
        """
        Reset the current branch to a specific past commit.
        """
        cmd = ["git", "reset", "--hard"]
        if commit_id:
            cmd.append(commit_id)
        code, _, error = await execute(cmd, cwd=top_repo_path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def checkout_new_branch(self, branchname, startpoint, current_path):
        """
        Execute git checkout <make-branch> command & return the result.
        """
        cmd = ["git", "checkout", "-b", branchname, startpoint]
        code, my_output, my_error = await execute(
            cmd,
            cwd=os.path.join(self.root_dir, current_path),
        )
        if code == 0:
            return {"code": code, "message": my_output}
        else:
            return {
                "code": code,
                "command": " ".join(cmd),
                "message": my_error,
            }

    async def _get_branch_reference(self, branchname, current_path):
        """
        Execute git rev-parse --symbolic-full-name <branch-name> and return the result (or None).
        """
        code, my_output, _ = await execute(
            ["git", "rev-parse", "--symbolic-full-name", branchname],
            cwd=os.path.join(self.root_dir, current_path),
        )
        if code == 0:
            return my_output.strip("\n")
        else:
            return None

    async def checkout_branch(self, branchname, current_path):
        """
        Execute git checkout <branch-name> command & return the result.
        Use the --track parameter for a remote branch.
        """
        reference_name = await self._get_branch_reference(branchname, current_path)
        if reference_name is None:
            is_remote_branch = False
        else:
            is_remote_branch = self._is_remote_branch(reference_name)

        if is_remote_branch:
            cmd = ["git", "checkout", "--track", branchname]
        else:
            cmd = ["git", "checkout", branchname]

        code, my_output, my_error = await execute(
            cmd, cwd=os.path.join(self.root_dir, current_path)
        )

        if code == 0:
            return {"code": 0, "message": my_output}
        else:
            return {"code": code, "message": my_error, "command": " ".join(cmd)}

    async def checkout(self, filename, top_repo_path):
        """
        Execute git checkout command for the filename & return the result.
        """
        cmd = ["git", "checkout", "--", filename]
        code, _, error = await execute(cmd, cwd=top_repo_path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def checkout_all(self, top_repo_path):
        """
        Execute git checkout command & return the result.
        """
        cmd = ["git", "checkout", "--", "."]
        code, _, error = await execute(cmd, cwd=top_repo_path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def commit(self, commit_msg, top_repo_path):
        """
        Execute git commit <filename> command & return the result.
        """
        cmd = ["git", "commit", "-m", commit_msg]
        code, _, error = await execute(cmd, cwd=top_repo_path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def pull(self, curr_fb_path, auth=None, cancel_on_conflict=False):
        """
        Execute git pull --no-commit.  Disables prompts for the password to avoid the terminal hanging while waiting
        for auth.
        """
        env = os.environ.copy()
        if auth:
            env["GIT_TERMINAL_PROMPT"] = "1"
            code, output, error = await execute(
                ["git", "pull", "--no-commit"],
                username=auth["username"],
                password=auth["password"],
                cwd=os.path.join(self.root_dir, curr_fb_path),
                env=env,
            )
        else:
            env["GIT_TERMINAL_PROMPT"] = "0"
            code, output, error = await execute(
                ["git", "pull", "--no-commit"],
                env=env,
                cwd=os.path.join(self.root_dir, curr_fb_path),
            )

        response = {"code": code, "message": output.strip()}

        if code != 0:
            output = output.strip()
            has_conflict = (
                "automatic merge failed; fix conflicts and then commit the result."
                in output.lower()
            )
            if cancel_on_conflict and has_conflict:
                code, _, error = await execute(
                    ["git", "merge", "--abort"],
                    cwd=os.path.join(self.root_dir, curr_fb_path),
                )
                if code == 0:
                    response[
                        "message"
                    ] = "Unable to pull latest changes as doing so would result in a merge conflict. In order to push your local changes, you may want to consider creating a new branch based on your current work and pushing the new branch. Provided your repository is hosted (e.g., on GitHub), once pushed, you can create a pull request against the original branch on the remote repository and manually resolve the conflicts during pull request review."
                else:
                    response["message"] = error.strip()
            elif has_conflict:
                response["message"] = output
            else:
                response["message"] = error.strip()

        return response

    async def push(self, remote, branch, curr_fb_path, auth=None, set_upstream=False):
        """
        Execute `git push $UPSTREAM $BRANCH`. The choice of upstream and branch is up to the caller.
        """
        command = ["git", "push"]
        if set_upstream:
            command.append("--set-upstream")
        command.extend([remote, branch])

        env = os.environ.copy()
        if auth:
            env["GIT_TERMINAL_PROMPT"] = "1"
            code, output, error = await execute(
                command,
                username=auth["username"],
                password=auth["password"],
                cwd=os.path.join(self.root_dir, curr_fb_path),
                env=env,
            )
        else:
            env["GIT_TERMINAL_PROMPT"] = "0"
            code, output, error = await execute(
                command,
                env=env,
                cwd=os.path.join(self.root_dir, curr_fb_path),
            )

        response = {"code": code, "message": output.strip()}

        if code != 0:
            response["message"] = error.strip()

        return response

    async def init(self, current_path):
        """
        Execute git init command & return the result.
        """
        cmd = ["git", "init"]
        cwd = os.path.join(self.root_dir, current_path)
        code, _, error = await execute(cmd, cwd=cwd)

        actions = None
        if code == 0:
            code, actions = await self._maybe_run_actions("post_init", cwd)

        if code != 0:
            return {
                "code": code,
                "command": " ".join(cmd),
                "message": error,
                "actions": actions,
            }
        return {"code": code, "actions": actions}

    async def _maybe_run_actions(self, name, cwd):
        code = 0
        actions = None
        if self._config and name in self._config.actions:
            actions = []
            actions_list = self._config.actions[name]
            for action in actions_list:
                try:
                    # We trust the actions as they were passed via a config and not the UI
                    code, stdout, stderr = await execute(shlex.split(action), cwd=cwd)
                    actions.append(
                        {
                            "cmd": action,
                            "code": code,
                            "stdout": stdout,
                            "stderr": stderr,
                        }
                    )
                    # After any failure, stop
                except Exception as e:
                    code = 1
                    actions.append(
                        {
                            "cmd": action,
                            "code": 1,
                            "stdout": None,
                            "stderr": "Exception: {}".format(e),
                        }
                    )
                if code != 0:
                    break

        return code, actions

    def _is_remote_branch(self, branch_reference):
        """Check if given branch is remote branch by comparing with 'remotes/',
        TODO : Consider a better way to check remote branch
        """
        return branch_reference.startswith("refs/remotes/")

    async def get_current_branch(self, current_path):
        """Use `symbolic-ref` to get the current branch name. In case of
        failure, assume that the HEAD is currently detached, and fall back
        to the `branch` command to get the name.
        See https://git-blame.blogspot.com/2013/06/checking-current-branch-programatically.html
        """
        command = ["git", "symbolic-ref", "--short", "HEAD"]
        code, output, error = await execute(
            command, cwd=os.path.join(self.root_dir, current_path)
        )
        if code == 0:
            return output.strip()
        elif "not a symbolic ref" in error.lower():
            current_branch = await self._get_current_branch_detached(current_path)
            return current_branch
        else:
            raise Exception(
                "Error [{}] occurred while executing [{}] command to get current branch.".format(
                    error, " ".join(command)
                )
            )

    async def _get_current_branch_detached(self, current_path):
        """Execute 'git branch -a' to get current branch details in case of detached HEAD"""
        command = ["git", "branch", "-a"]
        code, output, error = await execute(
            command, cwd=os.path.join(self.root_dir, current_path)
        )
        if code == 0:
            for branch in output.splitlines():
                branch = branch.strip()
                if branch.startswith("*"):
                    return branch.lstrip("* ")
        else:
            raise Exception(
                "Error [{}] occurred while executing [{}] command to get detached HEAD name.".format(
                    error, " ".join(command)
                )
            )

    async def get_upstream_branch(self, current_path, branch_name):
        """Execute 'git rev-parse --abbrev-ref branch_name@{upstream}' to get
        upstream branch name tracked by given local branch.
        Reference : https://git-scm.com/docs/git-rev-parse#git-rev-parse-emltbranchnamegtupstreamemegemmasterupstreamememuem
        """
        command = [
            "git",
            "rev-parse",
            "--abbrev-ref",
            "{}@{{upstream}}".format(branch_name),
        ]
        code, output, error = await execute(
            command, cwd=os.path.join(self.root_dir, current_path)
        )
        if code != 0:
            return {"code": code, "command": " ".join(command), "message": error}
        rev_parse_output = output.strip()

        command = ["git", "config", "--local", "branch.{}.remote".format(branch_name)]
        code, output, error = await execute(
            command, cwd=os.path.join(self.root_dir, current_path)
        )
        if code != 0:
            return {"code": code, "command": " ".join(command), "message": error}

        remote_name = output.strip()
        remote_branch = rev_parse_output.strip().replace(remote_name + "/", "", 1)
        return {
            "code": code,
            "remote_short_name": remote_name,
            "remote_branch": remote_branch,
        }

    async def _get_tag(self, current_path, commit_sha):
        """Execute 'git describe commit_sha' to get
        nearest tag associated with latest commit in branch.
        Reference : https://git-scm.com/docs/git-describe#git-describe-ltcommit-ishgt82308203
        """
        command = ["git", "describe", "--tags", commit_sha]
        code, output, error = await execute(
            command, cwd=os.path.join(self.root_dir, current_path)
        )
        if code == 0:
            return output.strip()
        elif "fatal: no tags can describe '{}'.".format(commit_sha) in error.lower():
            return None
        elif "fatal: no names found" in error.lower():
            return None
        else:
            raise Exception(
                "Error [{}] occurred while executing [{}] command to get nearest tag associated with branch.".format(
                    error, " ".join(command)
                )
            )

    async def show(self, filename, ref, top_repo_path):
        """
        Execute git show <ref:filename> command & return the result.
        """
        command = ["git", "show", "{}:{}".format(ref, filename)]

        code, output, error = await execute(command, cwd=top_repo_path)

        error_messages = map(
            lambda n: n.lower(),
            [
                "fatal: Path '{}' exists on disk, but not in '{}'".format(
                    filename, ref
                ),
                "fatal: Path '{}' does not exist (neither on disk nor in the index)".format(
                    filename
                ),
                "fatal: Path '{}' does not exist in '{}'".format(filename, ref),
                "fatal: Invalid object name 'HEAD'",
            ],
        )
        lower_error = error.lower()
        if code == 0:
            return output
        elif any([msg in lower_error for msg in error_messages]):
            return ""
        else:
            raise tornado.web.HTTPError(
                log_message="Error [{}] occurred while executing [{}] command to retrieve plaintext diff.".format(
                    error, " ".join(command)
                )
            )

    def get_content(self, filename, top_repo_path):
        """
        Get the file content of filename.
        """
        relative_repo = os.path.relpath(top_repo_path, self.root_dir)
        try:
            model = self.contents_manager.get(
                path=os.path.join(relative_repo, filename)
            )
        except tornado.web.HTTPError as error:
            # Handle versioned file being deleted case
            if error.status_code == 404 and error.log_message.startswith(
                "No such file or directory: "
            ):
                return ""
            raise error
        return model["content"]

    async def get_content_at_reference(self, filename, reference, top_repo_path):
        """
        Collect get content of the file at the git reference.
        """
        if "special" in reference:
            if reference["special"] == "WORKING":
                content = self.get_content(filename, top_repo_path)
            elif reference["special"] == "INDEX":
                is_binary = await self._is_binary(filename, "INDEX", top_repo_path)
                if is_binary:
                    raise tornado.web.HTTPError(
                        log_message="Error occurred while executing command to retrieve plaintext content as file is not UTF-8."
                    )

                content = await self.show(filename, "", top_repo_path)
            else:
                raise tornado.web.HTTPError(
                    log_message="Error while retrieving plaintext content, unknown special ref '{}'.".format(
                        reference["special"]
                    )
                )
        elif reference["git"]:
            is_binary = await self._is_binary(filename, reference["git"], top_repo_path)
            if is_binary:
                raise tornado.web.HTTPError(
                    log_message="Error occurred while executing command to retrieve plaintext content as file is not UTF-8."
                )

            content = await self.show(filename, reference["git"], top_repo_path)
        else:
            content = ""

        return {"content": content}

    async def _is_binary(self, filename, ref, top_repo_path):
        """
        Determine whether Git handles a file as binary or text.

        ## References

        -   <https://stackoverflow.com/questions/6119956/how-to-determine-if-git-handles-a-file-as-binary-or-as-text/6134127#6134127>
        -   <https://git-scm.com/docs/git-diff#Documentation/git-diff.txt---numstat>
        -   <https://git-scm.com/docs/git-diff#_other_diff_formats>

        Args:
            filename (str): Filename (relative to the git repository)
            ref (str): Commit reference or "INDEX" if file is staged
            top_repo_path (str): Git repository filepath

        Returns:
            bool: Is file binary?

        Raises:
            HTTPError: if git command failed
        """
        if ref == "INDEX":
            command = [
                "git",
                "diff",
                "--numstat",
                "--cached",
                "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                "--",
                filename,
            ]
        else:
            command = [
                "git",
                "diff",
                "--numstat",
                "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                ref,
                "--",
                filename,
            ]  # where 4b825... is a magic SHA which represents the empty tree
        code, output, error = await execute(command, cwd=top_repo_path)

        if code != 0:
            error_messages = map(
                lambda n: n.lower(),
                [
                    "fatal: Path '{}' does not exist (neither on disk nor in the index)".format(
                        filename
                    ),
                    "fatal: bad revision 'HEAD'",
                ],
            )
            lower_error = error.lower()
            if any([msg in lower_error for msg in error_messages]):
                return False

            raise tornado.web.HTTPError(
                log_message="Error while determining if file is binary or text '{}'.".format(
                    error
                )
            )

        # For binary files, `--numstat` outputs two `-` characters separated by TABs:
        return output.startswith("-\t-\t")

    async def remote_add(self, top_repo_path, url, name=DEFAULT_REMOTE_NAME):
        """Handle call to `git remote add` command.

        top_repo_path: str
            Top Git repository path
        url: str
            Git remote url
        name: str
            Remote name; default "origin"
        """
        cmd = ["git", "remote", "add", name, url]
        code, _, error = await execute(cmd, cwd=top_repo_path)
        response = {"code": code, "command": " ".join(cmd)}

        if code != 0:
            response["message"] = error

        return response

    async def remote_show(self, path):
        """Handle call to `git remote show` command.
        Args:
            path (str): Git repository path

        Returns:
            List[str]: Known remotes
        """
        command = ["git", "remote", "show"]
        code, output, error = await execute(command, cwd=path)
        response = {"code": code, "command": " ".join(command)}
        if code == 0:
            response["remotes"] = [r.strip() for r in output.splitlines()]
        else:
            response["message"] = error

        return response

    async def ensure_gitignore(self, top_repo_path):
        """Handle call to ensure .gitignore file exists and the
        next append will be on a new line (this means an empty file
        or a file ending with \n).

        top_repo_path: str
            Top Git repository path
        """
        try:
            gitignore = pathlib.Path(top_repo_path) / ".gitignore"
            if not gitignore.exists():
                gitignore.touch()
            elif gitignore.stat().st_size > 0:
                content = gitignore.read_text()
                if content[-1] != "\n":
                    with gitignore.open("a") as f:
                        f.write("\n")
        except BaseException as error:
            return {"code": -1, "message": str(error)}
        return {"code": 0}

    async def ignore(self, top_repo_path, file_path):
        """Handle call to add an entry in .gitignore.

        top_repo_path: str
            Top Git repository path
        file_path: str
            The path of the file in .gitignore
        """
        try:
            res = await self.ensure_gitignore(top_repo_path)
            if res["code"] != 0:
                return res
            gitignore = pathlib.Path(top_repo_path) / ".gitignore"
            with gitignore.open("a") as f:
                f.write(file_path + "\n")
        except BaseException as error:
            return {"code": -1, "message": str(error)}
        return {"code": 0}

    async def version(self):
        """Return the Git command version.

        If an error occurs, return None.
        """
        command = ["git", "--version"]
        code, output, _ = await execute(command, cwd=os.curdir)
        if code == 0:
            version = GIT_VERSION_REGEX.match(output)
            if version is not None:
                return version.group("version")

        return None

    async def tags(self, current_path):
        """List all tags of the git repository.

        current_path: str
            Git path repository
        """
        command = ["git", "tag", "--list"]
        code, output, error = await execute(
            command, cwd=os.path.join(self.root_dir, current_path)
        )
        if code != 0:
            return {"code": code, "command": " ".join(command), "message": error}
        tags = [tag for tag in output.split("\n") if len(tag) > 0]
        return {"code": code, "tags": tags}

    async def tag_checkout(self, current_path, tag):
        """Checkout the git repository at a given tag.

        current_path: str
            Git path repository
        tag : str
            Tag to checkout
        """
        command = ["git", "checkout", "tags/" + tag]
        code, _, error = await execute(
            command, cwd=os.path.join(self.root_dir, current_path)
        )
        if code == 0:
            return {"code": code, "message": "Tag {} checked out".format(tag)}
        else:
            return {
                "code": code,
                "command": " ".join(command),
                "message": error,
            }
