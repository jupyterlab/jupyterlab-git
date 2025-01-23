"""
Module for executing git commands, sending results back to the handlers
"""

import base64
import datetime
import os
import pathlib
import re
import shlex
import shutil
import subprocess
import traceback
from enum import Enum, IntEnum
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import unquote

import nbformat
import pexpect
import tornado
import tornado.locks
from jupyter_server.utils import ensure_async
from nbdime import diff_notebooks, merge_notebooks

from .log import get_logger

# Regex pattern to capture (key, value) of Git configuration options.
# See https://git-scm.com/docs/git-config#_syntax for git var syntax
CONFIG_PATTERN = re.compile(r"(?:^|\n)([\w\-\.]+)\=")
DEFAULT_REMOTE_NAME = "origin"
# Maximum number of character of command output to print in debug log
MAX_LOG_OUTPUT = 500  # type: int
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
# Parse Git detached head
GIT_DETACHED_HEAD = re.compile(r"^\(HEAD detached at (?P<commit>.+?)\)$")
# Parse Git branch rebase name
GIT_REBASING_BRANCH = re.compile(r"^\(no branch, rebasing (?P<branch>.+?)\)$")
# Git cache as a credential helper
GIT_CREDENTIAL_HELPER_CACHE = re.compile(r"cache\b")
# Parse git stash list
GIT_STASH_LIST = re.compile(
    r"^stash@{(?P<index>\d+)}: (WIP on|On) (?P<branch>.+?): (?P<message>.+?)$"
)

execution_lock = tornado.locks.Lock()


class State(IntEnum):
    """Git repository state."""

    # Default state
    DEFAULT = (0,)
    # Detached head state
    DETACHED = (1,)
    # Merge in progress
    MERGING = (2,)
    # Rebase in progress
    REBASING = (3,)
    # Cherry-pick in progress
    CHERRY_PICKING = 4


class RebaseAction(Enum):
    """Git available action when rebasing."""

    CONTINUE = 1
    SKIP = 2
    ABORT = 3


async def execute(
    cmdline: "List[str]",
    cwd: "str",
    timeout: "float" = 20,
    env: "Optional[Dict[str, str]]" = None,
    username: "Optional[str]" = None,
    password: "Optional[str]" = None,
    is_binary=False,
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
        is_binary=is_binary,
    ) -> "Tuple[int, str, str]":
        process = subprocess.Popen(
            cmdline, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=cwd, env=env
        )
        output, error = process.communicate()
        if is_binary:
            return (
                process.returncode,
                base64.encodebytes(output).decode("ascii"),
                error.decode("utf-8"),
            )
        else:
            return (process.returncode, output.decode("utf-8"), error.decode("utf-8"))

    try:
        await execution_lock.acquire(timeout=datetime.timedelta(seconds=timeout))
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
    except BaseException as e:
        code, output, error = -1, "", traceback.format_exc()
        get_logger().warning("Fail to execute {!s}".format(cmdline), exc_info=True)
    finally:
        execution_lock.release()

    return code, output, error


def strip_and_split(s):
    """strip trailing \x00 and split on \x00
    Useful for parsing output of git commands with -z flag.
    """
    return s.strip("\x00").strip("\n").split("\x00")


class Git:
    """
    A single parent class containing all of the individual git methods in it.
    """

    _GIT_CREDENTIAL_CACHE_DAEMON_PROCESS: subprocess.Popen = None

    def __init__(self, config=None):
        self._config = config
        self._execute_timeout = (
            20.0 if self._config is None else self._config.git_command_timeout
        )

    def __del__(self):
        if self._GIT_CREDENTIAL_CACHE_DAEMON_PROCESS:
            self._GIT_CREDENTIAL_CACHE_DAEMON_PROCESS.terminate()

    async def __execute(
        self,
        cmdline: "List[str]",
        cwd: "str",
        env: "Optional[Dict[str, str]]" = None,
        username: "Optional[str]" = None,
        password: "Optional[str]" = None,
        is_binary=False,
    ) -> "Tuple[int, str, str]":
        return await execute(
            cmdline,
            cwd=cwd,
            timeout=self._execute_timeout,
            env=env,
            username=username,
            password=password,
            is_binary=is_binary,
        )

    async def config(self, path, **kwargs):
        """Get or set Git options.

        If no kwargs, all options are returned. Otherwise kwargs are set.
        """
        response = {"code": 1}

        if len(kwargs):
            output = []
            for k, v in kwargs.items():
                cmd = ["git", "config", "--add", k, v]
                code, out, err = await self.__execute(cmd, cwd=path)
                output.append(out.strip())
                response["code"] = code
                if code != 0:
                    response["command"] = " ".join(cmd)
                    response["message"] = err.strip()
                    return response

            response["message"] = "\n".join(output).strip()
        else:
            cmd = ["git", "config", "--list"]
            code, output, error = await self.__execute(cmd, cwd=path)
            response = {"code": code}

            if code != 0:
                response["command"] = " ".join(cmd)
                response["message"] = error.strip()
            else:
                raw = output.strip()
                s = CONFIG_PATTERN.split(raw)
                response["options"] = {k: v for k, v in zip(s[1::2], s[2::2])}

        return response

    async def changed_files(self, path, base=None, remote=None, single_commit=None):
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
                cmd = ["git", "diff", base, remote, "--name-only", "-z", "--"]
        else:
            raise tornado.web.HTTPError(
                400, "Either single_commit or (base and remote) must be provided"
            )

        response = {}
        try:
            code, output, error = await self.__execute(cmd, cwd=path)
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

    async def clone(self, path, repo_url, auth=None, versioning=True, submodules=False):
        """
        Execute `git clone`.
        When no auth is provided, disables prompts for the password to avoid the terminal hanging.
        When auth is provided, await prompts for username/passwords and sends them
        :param path: the directory where the clone will be performed.
        :param repo_url: the URL of the repository to be cloned.
        :param auth: OPTIONAL dictionary with 'username' and 'password' fields
        :param versioning: OPTIONAL whether to clone or download a snapshot of the remote repository; default clone
        :param submodules: OPTIONAL whether to clone submodules content; default False
        :return: response with status code and error message.
        """
        env = os.environ.copy()
        cmd = ["git", "clone"]
        if not versioning:
            cmd.append("--depth=1")
            current_content = set(os.listdir(path))
        if submodules:
            cmd.append("--recurse-submodules")
        cmd.append(unquote(repo_url))

        if auth:
            if auth.get("cache_credentials"):
                await self.ensure_credential_helper(path)
            env["GIT_TERMINAL_PROMPT"] = "1"
            cmd.append("-q")
            code, output, error = await self.__execute(
                cmd,
                username=auth["username"],
                password=auth["password"],
                cwd=path,
                env=env,
            )
        else:
            env["GIT_TERMINAL_PROMPT"] = "0"
            code, output, error = await self.__execute(
                cmd,
                cwd=path,
                env=env,
            )

        if not versioning:
            new_content = set(os.listdir(path))
            directory = (new_content - current_content).pop()
            shutil.rmtree(f"{path}/{directory}/.git")

        response = {"code": code, "message": output.strip()}

        if code != 0:
            response["message"] = error.strip()

        return response

    async def fetch(self, path, auth=None):
        """
        Execute git fetch command
        """
        cwd = path
        # Start by fetching to get accurate ahead/behind status
        cmd = [
            "git",
            "fetch",
            "--all",
            "--prune",
        ]  # Run prune by default to help beginners
        env = os.environ.copy()
        if auth:
            if auth.get("cache_credentials"):
                await self.ensure_credential_helper(path)
            env["GIT_TERMINAL_PROMPT"] = "1"
            code, _, fetch_error = await self.__execute(
                cmd,
                cwd=cwd,
                username=auth["username"],
                password=auth["password"],
                env=env,
            )
        else:
            env["GIT_TERMINAL_PROMPT"] = "0"
            code, _, fetch_error = await self.__execute(cmd, cwd=cwd, env=env)

        result = {
            "code": code,
        }
        if code != 0:
            result["command"] = " ".join(cmd)
            result["error"] = fetch_error
            result["message"] = fetch_error

        return result

    async def get_nbdiff(
        self, prev_content: str, curr_content: str, base_content=None
    ) -> dict:
        """Compute the diff between two notebooks.

        Args:
            prev_content: Notebook previous content
            curr_content: Notebook current content
            base_content: Notebook base content - only passed during a merge conflict
        Returns:
            if not base_content:
                {"base": Dict, "diff": Dict}
            else:
                {"base": Dict, "merge_decisions": Dict}
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

        # TODO Fix this in nbdime
        def remove_cell_ids(nb):
            for cell in nb.cells:
                cell.pop("id", None)
            return nb

        current_loop = tornado.ioloop.IOLoop.current()
        prev_nb = await current_loop.run_in_executor(None, read_notebook, prev_content)
        curr_nb = await current_loop.run_in_executor(None, read_notebook, curr_content)
        if base_content:
            base_nb = await current_loop.run_in_executor(
                None, read_notebook, base_content
            )
            # Only remove ids from merge_notebooks as a workaround
            _, merge_decisions = await current_loop.run_in_executor(
                None,
                merge_notebooks,
                remove_cell_ids(base_nb),
                remove_cell_ids(prev_nb),
                remove_cell_ids(curr_nb),
            )

            return {"base": base_nb, "merge_decisions": merge_decisions}
        else:
            thediff = await current_loop.run_in_executor(
                None, diff_notebooks, prev_nb, curr_nb
            )

            return {"base": prev_nb, "diff": thediff}

    async def status(self, path: str) -> dict:
        """
        Execute git status command & return the result.
        """
        cmd = ["git", "status", "--porcelain", "-b", "-u", "-z"]
        code, status, my_error = await self.__execute(cmd, cwd=path)

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
        text_code, text_output, _ = await self.__execute(command, cwd=path)

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

        # Test for repository state
        states = {
            State.CHERRY_PICKING: "CHERRY_PICK_HEAD",
            State.MERGING: "MERGE_HEAD",
            # Looking at REBASE_HEAD is not reliable as it may not be clean in the .git folder
            # e.g. when skipping the last commit of a ongoing rebase
            # So looking for folder `rebase-apply` and `rebase-merge`; see https://stackoverflow.com/questions/3921409/how-to-know-if-there-is-a-git-rebase-in-progress
            State.REBASING: ["rebase-merge", "rebase-apply"],
        }

        state = State.DEFAULT
        for state_, head in states.items():
            if isinstance(head, str):
                code, _, _ = await self.__execute(
                    ["git", "show", "--quiet", head], cwd=path
                )
                if code == 0:
                    state = state_
                    break
            else:
                found = False
                for directory in head:
                    code, output, _ = await self.__execute(
                        ["git", "rev-parse", "--git-path", directory], cwd=path
                    )
                    filepath = output.strip("\n\t ")
                    if code == 0 and (Path(path) / filepath).exists():
                        found = True
                        state = state_
                        break
                if found:
                    break

        if state == State.DEFAULT and data["branch"] == "(detached)":
            state = State.DETACHED

        data["state"] = state

        return data

    async def log(self, path, history_count=10, follow_path=None):
        """
        Execute git log command & return the result.
        """
        is_single_file = follow_path != None
        cmd = [
            "git",
            "log",
            "--pretty=format:%H%n%an%n%ar%n%s%n%P",
            ("-%d" % history_count),
        ]
        if is_single_file:
            cmd += [
                "-z",
                "--numstat",
                "--follow",
                "--",
                follow_path,
            ]
        code, my_output, my_error = await self.__execute(
            cmd,
            cwd=path,
        )
        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": my_error}

        result = []
        line_array = my_output.splitlines()

        if is_single_file:
            parsed_lines = []
            for line in line_array:
                parsed_lines.extend(
                    re.sub(r"\t\0|\0", "\t", l)
                    for l in line.strip("\0\t").split("\0\0", maxsplit=1)
                )
            line_array = parsed_lines

        PREVIOUS_COMMIT_OFFSET = 6 if is_single_file else 5
        for i in range(0, len(line_array), PREVIOUS_COMMIT_OFFSET):
            commit = {
                "commit": line_array[i],
                "author": line_array[i + 1],
                "date": line_array[i + 2],
                "commit_msg": line_array[i + 3],
                "pre_commits": (
                    line_array[i + 4].split(" ")
                    if i + 4 < len(line_array) and line_array[i + 4]
                    else []
                ),
            }

            if is_single_file:
                commit["is_binary"] = line_array[i + 5].startswith("-\t-\t")

                # [insertions, deletions, previous_file_path?, current_file_path]
                file_info = line_array[i + 5].split()

                if len(file_info) == 4:
                    commit["previous_file_path"] = file_info[2]
                commit["file_path"] = file_info[-1]

            result.append(commit)

        return {"code": code, "commits": result}

    async def detailed_log(self, selected_hash, path):
        """
        Execute git log -m --cc -1 --numstat --oneline -z command (used to get
        insertions & deletions per file) & return the result.
        """
        cmd = [
            "git",
            "log",
            "--cc",
            "-m",
            "-1",
            "--oneline",
            "--numstat",
            "--pretty=format:%b%x00",
            "-z",
            selected_hash,
        ]

        code, my_output, my_error = await self.__execute(
            cmd,
            cwd=path,
        )
        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": my_error}

        total_insertions = 0
        total_deletions = 0
        result = []
        first_split = my_output.split("\x00", 1)
        commit_body = first_split[0].strip()
        line_iterable = iter(strip_and_split(first_split[1].strip()))
        for line in line_iterable:
            is_binary = line.startswith("-\t-\t")
            previous_file_path = ""
            tokens = line.split("\t")

            if len(tokens) == 3:
                insertions, deletions, file = line.split("\t")
                insertions = insertions.replace("-", "0")
                deletions = deletions.replace("-", "0")

                if file == "":
                    # file was renamed or moved, we need next two lines of output
                    from_path = next(line_iterable)
                    to_path = next(line_iterable)
                    previous_file_path = from_path
                    modified_file_name = from_path + " => " + to_path
                    modified_file_path = to_path
                else:
                    modified_file_name = file.split("/")[-1]
                    modified_file_path = file

                file_info = {
                    "modified_file_path": modified_file_path,
                    "modified_file_name": modified_file_name,
                    "insertion": insertions,
                    "deletion": deletions,
                    "is_binary": is_binary,
                }

                if previous_file_path:
                    file_info["previous_file_path"] = previous_file_path

                result.append(file_info)
                total_insertions += int(insertions)
                total_deletions += int(deletions)

        modified_file_note = "{num_files} files changed, {insertions} insertions(+), {deletions} deletions(-)".format(
            num_files=len(result),
            insertions=total_insertions,
            deletions=total_deletions,
        )

        return {
            "code": code,
            "commit_body": commit_body,
            "modified_file_note": modified_file_note,
            "modified_files_count": str(len(result)),
            "number_of_insertions": str(total_insertions),
            "number_of_deletions": str(total_deletions),
            "modified_files": result,
        }

    async def diff(self, path, previous=None, current=None):
        """
        Execute git diff command & return the result.
        """
        cmd = ["git", "diff", "--numstat", "-z"]

        if previous:
            cmd.append(previous)
            if current:
                cmd.append(current)

        code, my_output, my_error = await self.__execute(cmd, cwd=path)

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

    async def branch(self, path):
        """
        Execute 'git for-each-ref' command & return the result.
        """
        heads = await self.branch_heads(path)
        if heads["code"] != 0:
            # error; bail
            return heads

        remotes = await self.branch_remotes(path)
        if remotes["code"] != 0:
            # error; bail
            return remotes

        # Extract commit hash in case of detached head
        is_detached = GIT_DETACHED_HEAD.match(heads["current_branch"]["name"])
        if is_detached is not None:
            try:
                heads["current_branch"]["name"] = is_detached.groupdict()["commit"]
            except KeyError:
                pass
        else:
            # Extract branch name in case of rebasing
            rebasing = GIT_REBASING_BRANCH.match(heads["current_branch"]["name"])
            if rebasing is not None:
                try:
                    heads["current_branch"]["name"] = rebasing.groupdict()["branch"]
                except KeyError:
                    pass

        # all's good; concatenate results and return
        return {
            "code": 0,
            "branches": heads["branches"] + remotes["branches"],
            "current_branch": heads["current_branch"],
        }

    async def branch_delete(self, path, branch):
        """Execute 'git branch -D <branchname>'"""
        cmd = ["git", "branch", "-D", branch]
        code, _, error = await self.__execute(cmd, cwd=path)
        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        else:
            return {"code": code}

    async def branch_heads(self, path):
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

        code, output, error = await self.__execute(cmd, cwd=path)
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
                current_name = await self.get_current_branch(path)
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

    async def branch_remotes(self, path):
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

        code, output, error = await self.__execute(cmd, cwd=path)
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

    async def show_top_level(self, path):
        """
        Execute git --show-toplevel command & return the result.
        """
        cmd = ["git", "rev-parse", "--show-toplevel"]
        code, my_output, my_error = await self.__execute(
            cmd,
            cwd=path,
        )
        if code == 0:
            return {"code": code, "path": my_output.strip("\n")}
        else:
            # Handle special case where cwd not inside a git repo
            lower_error = my_error.lower()
            if "fatal: not a git repository" in lower_error:
                return {"code": 0, "path": None}

            return {
                "code": code,
                "command": " ".join(cmd),
                "message": my_error,
            }

    async def show_prefix(self, path, contents_manager):
        """
        Execute git --show-prefix command & return the result.
        """
        cmd = ["git", "rev-parse", "--show-prefix"]
        code, my_output, my_error = await self.__execute(
            cmd,
            cwd=path,
        )

        if code == 0:
            relative_git_path = my_output.strip("\n")
            repository_path = (
                path[: -len(relative_git_path)] if relative_git_path else path
            )
            try:
                # Raise an error is the repository_path is not a subpath of root_dir
                Path(repository_path).absolute().relative_to(
                    Path(contents_manager.root_dir).absolute()
                )
            except ValueError:
                return {
                    "code": code,
                    "path": None,
                }
            else:
                result = {
                    "code": code,
                    "path": relative_git_path,
                }
                return result
        else:
            # Handle special case where cwd not inside a git repo
            lower_error = my_error.lower()
            if "fatal: not a git repository" in lower_error:
                return {"code": 0, "path": None}

            return {
                "code": code,
                "command": " ".join(cmd),
                "message": my_error,
            }

    async def add(self, filename, path):
        """
        Execute git add<filename> command & return the result.
        """
        if not isinstance(filename, str):
            # assume filename is a sequence of str
            cmd = ["git", "add"] + list(filename)
        else:
            cmd = ["git", "add", filename]
        code, _, error = await self.__execute(cmd, cwd=path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def add_all(self, path):
        """
        Execute git add all command & return the result.
        """
        cmd = ["git", "add", "-A"]
        code, _, error = await self.__execute(cmd, cwd=path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def add_all_unstaged(self, path):
        """
        Execute git add all unstaged command & return the result.
        """
        cmd = ["git", "add", "-u"]
        code, _, error = await self.__execute(cmd, cwd=path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def add_all_untracked(self, path):
        """
        Find all untracked files, execute git add & return the result.
        """
        status = await self.status(path)
        if status["code"] != 0:
            return status

        untracked = []
        for f in status["files"]:
            if f["x"] == "?" and f["y"] == "?":
                untracked.append(f["from"].strip('"'))

        return await self.add(untracked, path)

    async def reset(self, filename, path):
        """
        Execute git reset <filename> command & return the result.
        """
        cmd = ["git", "reset", "--", filename]
        code, _, error = await self.__execute(cmd, cwd=path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def reset_all(self, path):
        """
        Execute git reset command & return the result.
        """
        cmd = ["git", "reset"]
        code, _, error = await self.__execute(cmd, cwd=path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def delete_commit(self, commit_id, path):
        """
        Delete a specified commit from the repository.
        """
        cmd = ["git", "revert", "-m", "1", "--no-commit", commit_id]
        code, _, error = await self.__execute(cmd, cwd=path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def reset_to_commit(self, commit_id, path):
        """
        Reset the current branch to a specific past commit.
        """
        cmd = ["git", "reset", "--hard"]
        if commit_id:
            cmd.append(commit_id)
        code, _, error = await self.__execute(cmd, cwd=path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def checkout_new_branch(self, branchname, startpoint, path):
        """
        Execute git checkout <make-branch> command & return the result.
        """
        cmd = ["git", "checkout", "-b", branchname, startpoint]
        code, my_output, my_error = await self.__execute(
            cmd,
            cwd=path,
        )
        if code == 0:
            return {"code": code, "message": my_output}
        else:
            return {
                "code": code,
                "command": " ".join(cmd),
                "message": my_error,
            }

    async def _get_branch_reference(self, branchname, path):
        """
        Execute git rev-parse --symbolic-full-name <branch-name> and return the result (or None).
        """
        code, my_output, _ = await self.__execute(
            ["git", "rev-parse", "--symbolic-full-name", branchname],
            cwd=path,
        )
        if code == 0:
            return my_output.strip("\n")
        else:
            return None

    async def checkout_branch(self, branchname, path):
        """
        Execute git checkout <branch-name> command & return the result.
        Use the --track parameter for a remote branch.
        """
        reference_name = await self._get_branch_reference(branchname, path)
        if reference_name is None:
            is_remote_branch = False
        else:
            is_remote_branch = self._is_remote_branch(reference_name)

        if is_remote_branch:
            local_branchname = branchname.split("/")[-1]
            cmd = ["git", "checkout", "-B", local_branchname, branchname]
        else:
            cmd = ["git", "checkout", branchname]

        code, my_output, my_error = await self.__execute(cmd, cwd=path)

        if code == 0:
            return {"code": 0, "message": my_output}
        else:
            return {"code": code, "message": my_error, "command": " ".join(cmd)}

    async def checkout(self, filename, path):
        """
        Execute git checkout command for the filename & return the result.
        """
        cmd = ["git", "checkout", "--", filename]
        code, _, error = await self.__execute(cmd, cwd=path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def checkout_all(self, path):
        """
        Execute git checkout command & return the result.
        """
        cmd = ["git", "checkout", "--", "."]
        code, _, error = await self.__execute(cmd, cwd=path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def merge(self, branch: str, path: str) -> dict:
        """
        Execute git merge command & return the result.
        """
        cmd = ["git", "merge", branch]
        code, output, error = await self.__execute(cmd, cwd=path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code, "message": output.strip()}

    async def commit(self, commit_msg, amend, path, author=None):
        """
        Execute git commit <filename> command & return the result.

        If the amend argument is true, amend the commit instead of creating a new one.
        """
        cmd = ["git", "commit"]
        if author:
            cmd.extend(["--author", author])
        if amend:
            cmd.extend(["--amend", "--no-edit"])
        else:
            cmd.extend(["--m", commit_msg])

        code, _, error = await self.__execute(cmd, cwd=path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def pull(self, path, auth=None, cancel_on_conflict=False):
        """
        Execute git pull --no-commit.  Disables prompts for the password to avoid the terminal hanging while waiting
        for auth.
        """
        env = os.environ.copy()
        if auth:
            if auth.get("cache_credentials"):
                await self.ensure_credential_helper(path)
            env["GIT_TERMINAL_PROMPT"] = "1"
            code, output, error = await self.__execute(
                ["git", "pull", "--no-commit"],
                username=auth["username"],
                password=auth["password"],
                cwd=path,
                env=env,
            )
        else:
            env["GIT_TERMINAL_PROMPT"] = "0"
            code, output, error = await self.__execute(
                ["git", "pull", "--no-commit"],
                env=env,
                cwd=path,
            )

        response = {"code": code, "message": output.strip()}

        if code != 0:
            output = output.strip()
            has_conflict = (
                "automatic merge failed; fix conflicts and then commit the result."
                in output.lower()
            )
            if cancel_on_conflict and has_conflict:
                code, _, error = await self.__execute(
                    ["git", "merge", "--abort"],
                    cwd=path,
                )
                if code == 0:
                    response["message"] = (
                        "Unable to pull latest changes as doing so would result in a merge conflict. In order to push your local changes, you may want to consider creating a new branch based on your current work and pushing the new branch. Provided your repository is hosted (e.g., on GitHub), once pushed, you can create a pull request against the original branch on the remote repository and manually resolve the conflicts during pull request review."
                    )
                else:
                    response["message"] = error.strip()
            elif has_conflict:
                response["message"] = output
            else:
                response["message"] = error.strip()

        return response

    async def push(
        self,
        remote,
        branch,
        path,
        auth=None,
        set_upstream=False,
        force=False,
        tags=True,
    ):
        """
        Execute `git push $UPSTREAM $BRANCH`. The choice of upstream and branch is up to the caller.
        """
        command = ["git", "push"]
        if tags:
            command.append("--tags")
        if force:
            command.append("--force-with-lease")
        if set_upstream:
            command.append("--set-upstream")
        command.extend([remote, branch])

        env = os.environ.copy()
        if auth:
            if auth.get("cache_credentials"):
                await self.ensure_credential_helper(path)
            env["GIT_TERMINAL_PROMPT"] = "1"
            code, output, error = await self.__execute(
                command,
                username=auth["username"],
                password=auth["password"],
                cwd=path,
                env=env,
            )
        else:
            env["GIT_TERMINAL_PROMPT"] = "0"
            code, output, error = await self.__execute(
                command,
                env=env,
                cwd=path,
            )

        response = {"code": code, "message": output.strip()}

        if code != 0:
            response["message"] = error.strip()

        return response

    async def init(self, path):
        """
        Execute git init command & return the result.
        """
        cmd = ["git", "init"]
        cwd = path
        code, _, error = await self.__execute(cmd, cwd=cwd)

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

    async def _empty_commit_for_init(self, path):
        cmd = ["git", "commit", "--allow-empty", "-m", '"First Commit"']

        code, _, error = await self.__execute(cmd, cwd=path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code}

    async def _maybe_run_actions(self, name, cwd):
        code = 0
        actions = None
        if self._config and name in self._config.actions:
            actions = []
            actions_list = self._config.actions[name]
            for action in actions_list:
                try:
                    # We trust the actions as they were passed via a config and not the UI
                    code, stdout, stderr = await self.__execute(
                        shlex.split(action), cwd=cwd
                    )
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

    async def get_current_branch(self, path):
        """Use `symbolic-ref` to get the current branch name. In case of
        failure, assume that the HEAD is currently detached or rebasing, and fall back
        to the `branch` command to get the name.
        See https://git-blame.blogspot.com/2013/06/checking-current-branch-programatically.html
        """
        command = ["git", "symbolic-ref", "--short", "HEAD"]
        code, output, error = await self.__execute(command, cwd=path)
        if code == 0:
            return output.strip()
        elif "not a symbolic ref" in error.lower():
            current_branch = await self._get_current_branch_detached(path)
            return current_branch
        else:
            raise Exception(
                "Error [{}] occurred while executing [{}] command to get current branch.".format(
                    error, " ".join(command)
                )
            )

    async def _get_current_branch_detached(self, path):
        """Execute 'git branch -a' to get current branch details in case of dirty state (rebasing, detached head,...)."""
        command = ["git", "branch", "-a"]
        code, output, error = await self.__execute(command, cwd=path)
        if code == 0:
            for branch in output.splitlines():
                branch = branch.strip()
                if branch.startswith("*"):
                    return branch.lstrip("* ")
        else:
            raise Exception(
                "Error [{}] occurred while executing [{}] command to get current state.".format(
                    error, " ".join(command)
                )
            )

    async def get_upstream_branch(self, path, branch_name):
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
        code, output, error = await self.__execute(command, cwd=path)
        if code != 0:
            return {"code": code, "command": " ".join(command), "message": error}
        rev_parse_output = output.strip()

        command = ["git", "config", "--local", "branch.{}.remote".format(branch_name)]
        code, output, error = await self.__execute(command, cwd=path)
        if code != 0:
            return {"code": code, "command": " ".join(command), "message": error}

        remote_name = output.strip()
        remote_branch = rev_parse_output.strip().replace(remote_name + "/", "", 1)
        return {
            "code": code,
            "remote_short_name": remote_name,
            "remote_branch": remote_branch,
        }

    async def _get_tag(self, path, commit_sha):
        """Execute 'git describe commit_sha' to get
        nearest tag associated with latest commit in branch.
        Reference : https://git-scm.com/docs/git-describe#git-describe-ltcommit-ishgt82308203
        """
        command = ["git", "describe", "--tags", commit_sha]
        code, output, error = await self.__execute(command, cwd=path)
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

    async def _get_base_ref(self, path, filename):
        """Get the object reference for an unmerged ``filename`` at base stage.

        Execute git ls-files -u -z <filename>

        Returns:
            The object reference or None
        """
        command = ["git", "ls-files", "-u", "-z", filename]

        code, output, error = await self.__execute(command, cwd=path)
        if code != 0:
            raise subprocess.CalledProcessError(
                code, " ".join(command), output=output, stderr=error
            )

        split_line = strip_and_split(output)[0].split()

        return split_line[1] if len(split_line) > 1 else None

    async def show(self, path, ref, filename=None, is_binary=False):
        """
        Execute
            git show <ref:filename>
          Or
            git show <ref>

        Return the file content
        """
        command = ["git", "show"]

        if filename is None:
            command.append(ref)
        else:
            command.append(f"{ref}:{filename}")

        code, output, error = await self.__execute(
            command, cwd=path, is_binary=is_binary
        )

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

    async def get_content(self, contents_manager, filename, path):
        """
        Get the file content of filename.
        """
        relative_repo = os.path.relpath(path, contents_manager.root_dir)
        try:
            # Never request notebook model - see https://github.com/jupyterlab/jupyterlab-git/issues/970
            model = await ensure_async(
                contents_manager.get(
                    path=os.path.join(relative_repo, filename), type="file"
                )
            )
        except tornado.web.HTTPError as error:
            # Handle versioned file being deleted case
            if error.status_code == 404 and (
                error.log_message.startswith("No such file or directory: ")
                or error.log_message.startswith("file or directory does not exist:")
            ):
                return ""
            raise error
        return model["content"]

    async def get_content_at_reference(
        self, filename, reference, path, contents_manager
    ):
        """
        Collect get content of the file at the git reference.
        """
        if "special" in reference:
            if reference["special"] == "WORKING":
                content = await self.get_content(contents_manager, filename, path)
            elif reference["special"] == "INDEX":
                is_binary = await self._is_binary(filename, "INDEX", path)
                if is_binary:
                    content = await self.show(
                        path, reference["git"], filename, is_binary=True
                    )
                else:
                    content = await self.show(path, "", filename)
            elif reference["special"] == "BASE":
                # Special case of file in merge conflict for which we want the base (aka common ancestor) version
                ref = await self._get_base_ref(path, filename)
                content = await self.show(path, ref)
            else:
                raise tornado.web.HTTPError(
                    log_message="Error while retrieving plaintext content, unknown special ref '{}'.".format(
                        reference["special"]
                    )
                )
        elif "git" in reference:
            is_binary = await self._is_binary(filename, reference["git"], path)
            if is_binary:
                content = await self.show(
                    path, reference["git"], filename, is_binary=True
                )
            else:
                content = await self.show(path, reference["git"], filename)
        else:
            content = ""

        return {"content": content}

    async def _is_binary(self, filename, ref, path):
        """
        Determine whether Git handles a file as binary or text.

        ## References

        -   <https://stackoverflow.com/questions/6119956/how-to-determine-if-git-handles-a-file-as-binary-or-as-text/6134127#6134127>
        -   <https://git-scm.com/docs/git-diff#Documentation/git-diff.txt---numstat>
        -   <https://git-scm.com/docs/git-diff#_other_diff_formats>

        Args:
            filename (str): Filename (relative to the git repository)
            ref (str): Commit reference or "INDEX" if file is staged
            path (str): Git repository filepath

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
        code, output, error = await self.__execute(command, cwd=path)

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

    async def remote_add(self, path, url, name=DEFAULT_REMOTE_NAME):
        """Handle call to `git remote add` command.

        path: str
            Top Git repository path
        url: str
            Git remote url
        name: str
            Remote name; default "origin"
        """
        cmd = ["git", "remote", "add", name, url]
        code, _, error = await self.__execute(cmd, cwd=path)
        response = {"code": code, "command": " ".join(cmd)}

        if code != 0:
            response["message"] = error

        return response

    async def remote_show(self, path, verbose=False):
        """Handle call to `git remote show` command.
        Args:
            path (str): Git repository path
            verbose (bool): true if details are needed, otherwise, false
        Returns:
            if not verbose: List[str]: Known remotes
            if verbose: List[ { name: str, url: str } ]: Known remotes
        """
        command = ["git", "remote"]
        if verbose:
            command.extend(["-v", "show"])
        else:
            command.append("show")

        code, output, error = await self.__execute(command, cwd=path)
        response = {"code": code, "command": " ".join(command)}

        if code == 0:
            if verbose:
                response["remotes"] = [
                    {"name": r.split("\t")[0], "url": r.split("\t")[1][:-7]}
                    for r in output.splitlines()
                    if "(push)" in r
                ]
            else:
                response["remotes"] = [r.strip() for r in output.splitlines()]
        else:
            response["message"] = error

        return response

    async def remote_remove(self, path, name):
        """Handle call to `git remote remove <name>` command.
        Args:
            path (str): Git repository path
            name (str): Remote name
        """
        command = ["git", "remote", "remove", name]

        code, _, error = await self.__execute(command, cwd=path)
        response = {"code": code, "command": " ".join(command)}

        if code != 0:
            response["message"] = error

        return response

    def read_file(self, path):
        """
        Reads file content located at path and returns it as a string

        path: str
            The path of the file
        """
        try:
            file = pathlib.Path(path)
            content = file.read_text()
            return {"code": 0, "content": content}
        except BaseException as error:
            return {"code": -1, "content": ""}

    async def ensure_gitignore(self, path):
        """Handle call to ensure .gitignore file exists and the
        next append will be on a new line (this means an empty file
        or a file ending with \n).

        path: str
            Top Git repository path
        """
        try:
            gitignore = pathlib.Path(path) / ".gitignore"
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

    async def ignore(self, path, file_path):
        """Handle call to add an entry in .gitignore.

        path: str
            Top Git repository path
        file_path: str
            The path of the file in .gitignore
        """
        try:
            res = await self.ensure_gitignore(path)
            if res["code"] != 0:
                return res
            gitignore = pathlib.Path(path) / ".gitignore"
            with gitignore.open("a") as f:
                f.write(file_path + "\n")
        except BaseException as error:
            return {"code": -1, "message": str(error)}
        return {"code": 0}

    async def write_gitignore(self, path, content):
        """
        Handle call to overwrite .gitignore.
        Takes the .gitignore file and clears its previous contents
        Writes the new content onto the file

        path: str
            Top Git repository path
        content: str
            New file contents
        """
        try:
            res = await self.ensure_gitignore(path)
            if res["code"] != 0:
                return res
            gitignore = pathlib.Path(path) / ".gitignore"
            if content and content[-1] != "\n":
                content += "\n"
            gitignore.write_text(content)
        except BaseException as error:
            return {"code": -1, "message": str(error)}
        return {"code": 0}

    async def version(self):
        """Return the Git command version.

        If an error occurs, return None.
        """
        command = ["git", "--version"]
        code, output, _ = await self.__execute(command, cwd=os.curdir)
        if code == 0:
            version = GIT_VERSION_REGEX.match(output)
            if version is not None:
                return version.group("version")

        return None

    async def tags(self, path):
        """List all tags of the git repository, including the commit each tag points to.

        path: str
            Git path repository
        """
        formats = ["refname:short", "objectname"]
        command = [
            "git",
            "for-each-ref",
            "--format=" + "%09".join("%({})".format(f) for f in formats),
            "refs/tags",
        ]
        code, output, error = await self.__execute(command, cwd=path)
        if code != 0:
            return {"code": code, "command": " ".join(command), "message": error}
        tags = []
        for tag_name, commit_id in (line.split("\t") for line in output.splitlines()):
            tag = {"name": tag_name, "baseCommitId": commit_id}
            tags.append(tag)
        return {"code": code, "tags": tags}

    async def tag_checkout(self, path, tag):
        """Checkout the git repository at a given tag.

        path: str
            Git path repository
        tag : str
            Tag to checkout
        """
        command = ["git", "checkout", "tags/" + tag]
        code, _, error = await self.__execute(command, cwd=path)
        if code == 0:
            return {"code": code, "message": "Tag {} checked out".format(tag)}
        else:
            return {
                "code": code,
                "command": " ".join(command),
                "message": error,
            }

    async def set_tag(self, path, tag, commitId):
        """Set a git tag pointing to a specific commit.

        path: str
            Git path repository
        tag : str
            Name of new tag.
        commitId:
           Identifier of commit tag is pointing to.
        """
        command = ["git", "tag", tag, commitId]
        code, _, error = await self.__execute(command, cwd=path)
        if code == 0:
            return {
                "code": code,
                "message": "Tag {} created, pointing to commit {}".format(
                    tag, commitId
                ),
            }
        else:
            return {
                "code": code,
                "command": " ".join(command),
                "message": error,
            }

    async def check_credential_helper(self, path: str) -> Optional[bool]:
        """
        Check if the credential helper exists, and whether we need to setup a Git credential cache daemon in case the credential helper is Git credential cache.

        path: str
            Git path repository

        Return None if the credential helper is not set.
        Otherwise, return True if we need to setup a Git credential cache daemon, else False.

        Raise an exception if `git config` errored.
        """

        git_config_response: Dict[str, str] = await self.config(path)
        if git_config_response["code"] != 0:
            raise RuntimeError(git_config_response["message"])

        git_config_kv_pairs = git_config_response["options"]
        has_credential_helper = "credential.helper" in git_config_kv_pairs

        if not has_credential_helper:
            return None

        if has_credential_helper and GIT_CREDENTIAL_HELPER_CACHE.match(
            git_config_kv_pairs["credential.helper"].strip()
        ):
            return True

        return False

    async def ensure_credential_helper(
        self, path: str, env: Dict[str, str] = None
    ) -> None:
        """
        Check whether `git config --list` contains `credential.helper`.
        If it is not set, then it will be set to the value string for `credential.helper`
        defined in the server settings.

        path: str
            Git path repository
        env: Dict[str, str]
            Environment variables
        """

        try:
            has_credential_helper = await self.check_credential_helper(path)
            if has_credential_helper == False:
                return
        except RuntimeError as e:
            get_logger().error("Error checking credential helper: %s", e, exc_info=True)
            return

        cache_daemon_required = has_credential_helper == True

        if has_credential_helper is None:
            credential_helper: str = self._config.credential_helper
            await self.config(path, **{"credential.helper": credential_helper})
            if GIT_CREDENTIAL_HELPER_CACHE.match(credential_helper.strip()):
                cache_daemon_required = True

        # special case: Git credential cache
        if cache_daemon_required:
            try:
                self.ensure_git_credential_cache_daemon(cwd=path, env=env)
            except Exception as e:
                get_logger().error(
                    "Error setting up Git credential cache daemon: %s", e, exc_info=True
                )

    def ensure_git_credential_cache_daemon(
        self,
        socket: Optional[pathlib.Path] = None,
        debug: bool = False,
        force: bool = False,
        cwd: Optional[str] = None,
        env: Dict[str, str] = None,
    ) -> None:
        """
        Spawn a Git credential cache daemon with the socket file being `socket` if it does not exist.
        If `debug` is `True`, the daemon will be spawned with `--debug` flag.
        If `socket` is empty, it is set to `~/.git-credential-cache-daemon`.
        If `force` is `True`, a daemon will be spawned, and if the daemon process is accessible,
        the existing daemon process will be terminated before spawning a new one.
        Otherwise, if `force` is `False`, the PID of the existing daemon process is returned.
        If the daemon process is not accessible, `-1` is returned.
        `cwd` and `env` are passed to the process that spawns the daemon.
        """

        if not socket:
            socket = pathlib.Path.home() / ".git-credential-cache" / "socket"

        if socket.exists():
            return

        if self._GIT_CREDENTIAL_CACHE_DAEMON_PROCESS is None or force:
            if force and self._GIT_CREDENTIAL_CACHE_DAEMON_PROCESS:
                self._GIT_CREDENTIAL_CACHE_DAEMON_PROCESS.terminate()

            if not socket.parent.exists():
                socket.parent.mkdir(parents=True, exist_ok=True)
                socket.parent.chmod(0o700)

            args: List[str] = ["git", "credential-cache--daemon"]

            if debug:
                args.append("--debug")

            args.append(socket)

            self._GIT_CREDENTIAL_CACHE_DAEMON_PROCESS = subprocess.Popen(
                args,
                cwd=cwd,
                env=env,
            )

            get_logger().debug(
                "A credential cache daemon has been spawned with PID %d",
                self._GIT_CREDENTIAL_CACHE_DAEMON_PROCESS.pid,
            )

        elif self._GIT_CREDENTIAL_CACHE_DAEMON_PROCESS.poll():
            self.ensure_git_credential_cache_daemon(socket, debug, True, cwd, env)

    async def rebase(self, branch: str, path: str) -> dict:
        """
        Execute git rebase command & return the result.

        Args:
            branch: Branch to rebase onto
            path: Git repository path
        """
        cmd = ["git", "rebase", branch]
        code, output, error = await execute(cmd, cwd=path)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code, "message": output.strip()}

    async def resolve_rebase(self, path: str, action: RebaseAction) -> dict:
        """
        Execute git rebase --<action> command & return the result.

        Args:
            path: Git repository path
        """
        option = action.name.lower()
        cmd = ["git", "rebase", f"--{option}"]
        env = None
        # For continue we force the editor to not show up
        # Ref: https://stackoverflow.com/questions/43489971/how-to-suppress-the-editor-for-git-rebase-continue
        if option == "continue":
            env = os.environ.copy()
            env["GIT_EDITOR"] = "true"
        code, output, error = await execute(cmd, cwd=path, env=env)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}
        return {"code": code, "message": output.strip()}

    async def stash(self, path: str, stashMsg: str = "") -> dict:
        """
        Stash changes in a dirty working directory away
        path: str            Git path repository
        stashMsg (optional): str
            A message that describes the stash entry
        """
        cmd = ["git", "stash"]

        if len(stashMsg) > 0:
            cmd.extend(["save", "-m", stashMsg])

        env = os.environ.copy()
        # if the git command is run in a non-interactive terminal, it will not prompt for user input
        env["GIT_TERMINAL_PROMPT"] = "0"

        code, output, error = await self.__execute(cmd, cwd=path, env=env)

        # code 0: no changes to stash
        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}

        return {"code": code, "message": output.strip()}

    async def stash_list(self, path: str) -> dict:
        """
        Execute git stash list command
        """
        cmd = ["git", "stash", "list"]

        env = os.environ.copy()
        env["GIT_TERMINAL_PROMPT"] = "0"

        code, output, error = await self.__execute(cmd, cwd=path, env=env)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}

        stashes = []
        for line in output.strip("\n").splitlines():
            match = GIT_STASH_LIST.match(line)
            if match is not None:
                d = match.groupdict()
                d["index"] = int(d["index"])
                stashes.append(d)

        return {"code": code, "stashes": stashes}

    async def stash_show(self, path: str, index: int) -> dict:
        """
        Execute git stash show command
        """
        # stash_index = "stash@{" + str(index) + "}"
        stash_index = f"stash@{{{index!s}}}"

        cmd = ["git", "stash", "show", "-p", stash_index, "--name-only"]

        env = os.environ.copy()
        env["GIT_TERMINAL_PROMPT"] = "0"

        code, output, error = await self.__execute(cmd, cwd=path, env=env)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}

        files = output.strip("\n").splitlines()

        return {"code": code, "files": files}

    async def pop_stash(self, path: str, stash_index: Optional[int] = None) -> dict:
        """
        Execute git stash pop for a certain index of the stash list. If no index is provided, it will

        path: str
            Git path repository
        stash_index: number
            Index of the stash list is first applied to the current branch, then removed from the stash.
            If the index is not provided, the most recent stash (index=0) will be removed from the stash.
        """
        cmd = ["git", "stash", "pop"]

        if stash_index:
            cmd.append(str(stash_index))

        env = os.environ.copy()
        env["GIT_TERMINAL_PROMPT"] = "0"

        code, output, error = await self.__execute(cmd, cwd=path, env=env)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}

        return {"code": code, "message": output.strip()}

    async def drop_stash(self, path, stash_index: Optional[int] = None) -> dict:
        """
        Execute git stash drop to delete a single stash entry.
        If not stash_index is provided, delete the entire stash.

        path: Git path repository
        stash_index: number or None
            Index of the stash list to remove from the stash.
            If None, the entire stash is removed.
        """
        cmd = ["git", "stash"]
        if stash_index is None:
            cmd.append("clear")
        else:
            cmd.extend(["drop", str(stash_index)])

        env = os.environ.copy()
        env["GIT_TERMINAL_PROMPT"] = "0"

        code, output, error = await self.__execute(cmd, cwd=path, env=env)

        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}

        return {"code": code, "message": output.strip()}

    async def apply_stash(self, path: str, stash_index: Optional[int] = None) -> dict:
        """
        Execute git stash apply to apply a single stash entry to the repository.
        If not stash_index is provided, apply the latest stash.

        path: str
            Git path repository
        stash_index: number
            Index of the stash list is applied to the repository.
        """
        # Clear
        cmd = ["git", "stash", "apply"]

        if stash_index is not None:
            cmd.append("stash@{" + str(stash_index) + "}")

        env = os.environ.copy()
        env["GIT_TERMINAL_PROMPT"] = "0"

        code, output, error = await self.__execute(cmd, cwd=path, env=env)

        # error:
        if code != 0:
            return {"code": code, "command": " ".join(cmd), "message": error}

        return {"code": code, "message": output.strip()}

    async def submodule(self, path):
        """
        Execute git submodule status --recursive
        """

        cmd = ["git", "submodule", "status", "--recursive"]

        code, output, error = await self.__execute(cmd, cwd=path)

        results = []

        for line in output.splitlines():
            name = line.strip().split(" ")[1]
            submodule = {
                "name": name,
            }
            results.append(submodule)

        return {"code": code, "submodules": results, "error": error}

    @property
    def excluded_paths(self) -> List[str]:
        """Wildcard-style path patterns that do not support git commands.

        You can use ``*`` to match everything or ``?`` to match any single character.
        """
        return self._config.excluded_paths
