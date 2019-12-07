"""
Module for executing git commands, sending results back to the handlers
"""
import os
import re
import subprocess
from urllib.parse import unquote

import pexpect
import tornado


# Git configuration options exposed through the REST API
ALLOWED_OPTIONS = ['user.name', 'user.email']
# Regex pattern to capture (key, value) of Git configuration options.
# See https://git-scm.com/docs/git-config#_syntax for git var syntax
CONFIG_PATTERN = re.compile(r"(?:^|\n)([\w\-\.]+)\=")


@tornado.gen.coroutine
def execute(
    cmdline: "List[str]",
    cwd: "Optional[str]" = None,
    env: "Optional[Dict[str, str]]" = None,
) -> "Tuple[int, str, str]":
    """Asynchronously execute a command.
    
    Args:
        cmdline (List[str]): Command line to be executed
        cwd (Optional[str]): Current working directory
        env (Optional[Dict[str, str]]): Defines the environment variables for the new process.
    Returns:
        (int, str, str): (return code, stdout, stderr)
    """

    def call_subprocess(
        cmdline: "List[str]",
        cwd: "Optional[str]" = None,
        env: "Optional[Dict[str, str]]" = None,
    ) -> "Tuple[int, bytes, bytes]":
        process = subprocess.Popen(
            cmdline, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=cwd, env=env
        )
        output, error = process.communicate()
        return (process.returncode, output, error)

    current_loop = tornado.ioloop.IOLoop.current()
    returncode, output, error = yield current_loop.run_in_executor(
        None, call_subprocess, cmdline, cwd, env
    )

    return returncode, output.decode("utf-8"), error.decode("utf-8")


@tornado.gen.coroutine
def execute_with_authentication(
    cmdline: "List[str]",
    username: "str",
    password: "str",
    cwd: "Optional[str]" = None,
    env: "Optional[Dict[str, str]]" = None,
) -> "Tuple[int, str]":
    """Asynchronously execute a command.
    
    Args:
        cmdline (List[str]): Command line to be executed
        username (str): User name
        password (str): User password
        cwd (Optional[str]): Current working directory
        env (Optional[Dict[str, str]]): Defines the environment variables for the new process.
    Returns:
        (int, str): (return code, output)
    """

    def call_subprocess(
        cmdline: "List[str]",
        username: "str",
        password: "str",
        cwd: "Optional[str]" = None,
        env: "Optional[Dict[str, str]]" = None,
    ) -> "Tuple[int, str]":
        try:
            p = pexpect.spawn(
                cmdline[0], cmdline[1:], cwd=cwd, env=env, encoding="utf-8"
            )

            # We expect a prompt from git
            # In most of cases git will prompt for username and
            #  then for password
            # In some cases (Bitbucket) username is included in
            #  remote URL, so git will not ask for username
            i = p.expect(["Username for .*: ", "Password for .*:"])
            if i == 0:  # ask for username then password
                p.sendline(username)
                p.expect("Password for .*:")
                p.sendline(password)
            elif i == 1:  # only ask for password
                p.sendline(password)

            p.expect(pexpect.EOF)
            response = p.before

            returncode = p.wait()
            p.close()

            return returncode, response
        except pexpect.exceptions.EOF:  # In case of pexpect failure
            response = p.before
            returncode = p.exitstatus
            p.close()  # close process
            return returncode, response

    current_loop = tornado.ioloop.IOLoop.current()
    returncode, output = yield current_loop.run_in_executor(
        None, call_subprocess, cmdline, username, password, cwd, env
    )

    return returncode, output


class Git:
    """
    A single parent class containing all of the individual git methods in it.
    """

    def __init__(self, contents_manager):
        self.contents_manager = contents_manager
        self.root_dir = os.path.expanduser(contents_manager.root_dir)

    @tornado.gen.coroutine
    def config(self, top_repo_path, **kwargs):
        """Get or set Git options.
        
        If no kwargs, all options are returned. Otherwise kwargs are set.
        """
        response = {"code": 1}

        if len(kwargs):
            output = []
            for k, v in filter(
                lambda t: True if t[0] in ALLOWED_OPTIONS else False, kwargs.items()
            ):
                cmd = ["git", "config", "--add", k, v]
                code, out, err = yield execute(cmd, cwd=top_repo_path)
                output.append(out.strip())
                response["code"] = code
                if code != 0:
                    response["command"] = " ".join(cmd)
                    response["message"] = err.strip()
                    return response

            response["message"] = "\n".join(output).strip()
        else:
            cmd = ["git", "config", "--list"]
            code, output, error = yield execute(cmd, cwd=top_repo_path)
            response = {"code": code}

            if code != 0:
                response["command"] = " ".join(cmd)
                response["message"] = error.strip()
            else:
                raw = output.decode("utf-8").strip()
                s = CONFIG_PATTERN.split(raw)
                response["options"] = {k:v for k, v in zip(s[1::2], s[2::2]) if k in ALLOWED_OPTIONS}

        return response

    @tornado.gen.coroutine
    def changed_files(self, base=None, remote=None, single_commit=None):
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
            cmd = ["git", "diff", "{}^!".format(single_commit), "--name-only"]
        elif base and remote:
            if base == "WORKING":
                cmd = ["git", "diff", remote, "--name-only"]
            elif base == "INDEX":
                cmd = ["git", "diff", "--staged", remote, "--name-only"]
            else:
                cmd = ["git", "diff", base, remote, "--name-only"]
        else:
            raise tornado.web.HTTPError(
                400, "Either single_commit or (base and remote) must be provided"
            )

        response = {}
        try:
            _, output, _ = yield execute(cmd, cwd=self.root_dir)
            response["files"] = output.strip().split("\n")
            response["code"] = 0
        except subprocess.CalledProcessError as e:
            response["message"] = e.output.decode("utf-8")
            response["code"] = e.returncode

        return response

    @tornado.gen.coroutine
    def clone(self, current_path, repo_url, auth=None):
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
            code, error = yield execute_with_authentication(
                ["git", "clone", unquote(repo_url), "-q"],
                username=auth["username"],
                password=auth["password"],
                cwd=os.path.join(self.root_dir, current_path),
                env=env,
            )
        else:
            env["GIT_TERMINAL_PROMPT"] = "0"
            code, _, error = yield execute(
                ["git", "clone", unquote(repo_url)],
                cwd=os.path.join(self.root_dir, current_path),
                env=env,
            )

        response = {"code": code}

        if code != 0:
            response["message"] = error.strip()

        return response

    @tornado.gen.coroutine
    def status(self, current_path):
        """
        Execute git status command & return the result.
        """
        code, my_output, my_error = yield execute(
            ["git", "status", "--porcelain", "-u"],
            cwd=os.path.join(self.root_dir, current_path),
        )
        if code == 0:
            result = []
            line_array = my_output.splitlines()
            for line in line_array:
                to1 = None
                from_path = line[3:]
                if line[0] == "R":
                    to0 = line[3:].split(" -> ")
                    to1 = to0[len(to0) - 1]
                else:
                    to1 = line[3:]
                if to1.startswith('"'):
                    to1 = to1[1:]
                if to1.endswith('"'):
                    to1 = to1[:-1]
                result.append(
                    {"x": line[0], "y": line[1], "to": to1, "from": from_path}
                )
            return {"code": code, "files": result}
        else:
            return {
                "code": code,
                "command": "git status --porcelain -u",
                "message": my_error,
            }

    @tornado.gen.coroutine
    def log(self, current_path, history_count=10):
        """
        Execute git log command & return the result.
        """
        code, my_output, my_error = yield execute(
            ["git", "log", "--pretty=format:%H%n%an%n%ar%n%s", ("-%d" % history_count)],
            cwd=os.path.join(self.root_dir, current_path),
        )
        if code == 0:
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
        else:
            return {"code": code, "message": my_error}

    @tornado.gen.coroutine
    def detailed_log(self, selected_hash, current_path):
        """
        Execute git log -1 --stat --numstat --oneline command (used to get
        insertions & deletions per file) & return the result.
        """
        code, my_output, my_error = yield execute(
            ["git", "log", "-1", "--stat", "--numstat", "--oneline", selected_hash],
            cwd=os.path.join(self.root_dir, current_path),
        )
        if code == 0:
            result = []
            note = [0] * 3
            count = 0
            temp = ""
            line_array = my_output.splitlines()
            length = len(line_array)
            INSERTION_INDEX = 0
            DELETION_INDEX = 1
            MODIFIED_FILE_PATH_INDEX = 2
            if length > 1:
                temp = line_array[length - 1]
                words = temp.split()
                for i in range(0, len(words)):
                    if words[i].isdigit():
                        note[count] = words[i]
                        count += 1
                for num in range(1, int(length / 2)):
                    line_info = line_array[num].split(maxsplit=2)
                    words = line_info[2].split("/")
                    length = len(words)
                    result.append(
                        {
                            "modified_file_path": line_info[MODIFIED_FILE_PATH_INDEX],
                            "modified_file_name": words[length - 1],
                            "insertion": line_info[INSERTION_INDEX],
                            "deletion": line_info[DELETION_INDEX],
                        }
                    )

            if note[2] == 0 and length > 1:
                if "-" in temp:
                    exchange = note[1]
                    note[1] = note[2]
                    note[2] = exchange

            return {
                "code": code,
                "modified_file_note": temp,
                "modified_files_count": note[0],
                "number_of_insertions": note[1],
                "number_of_deletions": note[2],
                "modified_files": result,
            }
        else:
            return {"code": code, "command": "git log_1", "message": my_error}

    @tornado.gen.coroutine
    def diff(self, top_repo_path):
        """
        Execute git diff command & return the result.
        """
        code, my_output, my_error = yield execute(
            ["git", "diff", "--numstat"], cwd=top_repo_path
        )
        if code == 0:
            result = []
            line_array = my_output.splitlines()
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
        else:
            return {"code": code, "message": my_error}

    @tornado.gen.coroutine
    def branch(self, current_path):
        """
        Execute 'git for-each-ref' command & return the result.
        """
        heads = yield self.branch_heads(current_path)
        if heads["code"] != 0:
            # error; bail
            return heads

        remotes = yield self.branch_remotes(current_path)
        if remotes["code"] != 0:
            # error; bail
            return remotes

        # all's good; concatenate results and return
        return {
            "code": 0,
            "branches": heads["branches"] + remotes["branches"],
            "current_branch": heads["current_branch"],
        }

    @tornado.gen.coroutine
    def branch_heads(self, current_path):
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

        code, output, error = yield execute(
            cmd, cwd=os.path.join(self.root_dir, current_path)
        )
        if code == 0:
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
                    branch = {
                        "is_current_branch": True,
                        "is_remote_branch": False,
                        "name": self.get_current_branch(current_path),
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
        else:
            return {"code": code, "command": " ".join(cmd), "message": error}

    @tornado.gen.coroutine
    def branch_remotes(self, current_path):
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

        code, output, error = yield execute(
            cmd, cwd=os.path.join(self.root_dir, current_path)
        )
        if code == 0:
            results = []
            try:
                for name, commit_sha in (
                    line.split("\t") for line in output.splitlines()
                ):
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
        else:
            return {"code": code, "command": " ".join(cmd), "message": error}

    @tornado.gen.coroutine
    def show_top_level(self, current_path):
        """
        Execute git --show-toplevel command & return the result.
        """
        code, my_output, my_error = yield execute(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=os.path.join(self.root_dir, current_path),
        )
        if code == 0:
            result = {"code": code, "top_repo_path": my_output.strip("\n")}
            return result
        else:
            return {
                "code": code,
                "command": "git rev-parse --show-toplevel",
                "message": my_error,
            }

    @tornado.gen.coroutine
    def show_prefix(self, current_path):
        """
        Execute git --show-prefix command & return the result.
        """
        code, my_output, my_error = yield execute(
            ["git", "rev-parse", "--show-prefix"],
            cwd=os.path.join(self.root_dir, current_path),
        )
        if code == 0:
            result = {"code": code, "under_repo_path": my_output.strip("\n")}
            return result
        else:
            return {
                "code": code,
                "command": "git rev-parse --show-prefix",
                "message": my_error,
            }

    @tornado.gen.coroutine
    def add(self, filename, top_repo_path):
        """
        Execute git add<filename> command & return the result.
        """
        if not isinstance(filename, str):
            # assume filename is a sequence of str
            cmd = ["git", "add"] + list(filename)
        else:
            cmd = ["git", "add", filename]

        _, output, _ = yield execute(cmd, cwd=top_repo_path)
        return output

    @tornado.gen.coroutine
    def add_all(self, top_repo_path):
        """
        Execute git add all command & return the result.
        """
        _, output, _ = yield execute(["git", "add", "-A"], cwd=top_repo_path)
        return output

    @tornado.gen.coroutine
    def add_all_unstaged(self, top_repo_path):
        """
        Execute git add all unstaged command & return the result.
        """
        code, _, _ = yield execute(["git", "add", "-u"], cwd=top_repo_path)
        return {"result": code}

    @tornado.gen.coroutine
    def add_all_untracked(self, top_repo_path):
        """
        Execute git add all untracked command & return the result.
        """
        code, _, _ = yield execute(
            ["echo", "a\n*\nq\n", "|", "git", "add", "-i"], cwd=top_repo_path
        )
        return {"result": code}

    @tornado.gen.coroutine
    def reset(self, filename, top_repo_path):
        """
        Execute git reset <filename> command & return the result.
        """
        _, my_output, _ = yield execute(
            ["git", "reset", "--", filename], cwd=top_repo_path
        )
        return my_output

    @tornado.gen.coroutine
    def reset_all(self, top_repo_path):
        """
        Execute git reset command & return the result.
        """
        _, my_output, _ = yield execute(["git", "reset"], cwd=top_repo_path)
        return my_output

    @tornado.gen.coroutine
    def delete_commit(self, commit_id, top_repo_path):
        """
        Delete a specified commit from the repository.
        """
        _, my_output, _ = yield execute(
            ["git", "revert", "--no-commit", commit_id], cwd=top_repo_path
        )
        return my_output

    @tornado.gen.coroutine
    def reset_to_commit(self, commit_id, top_repo_path):
        """
        Reset the current branch to a specific past commit.
        """
        cmd = ["git", "reset", "--hard"]
        if commit_id:
            cmd.append(commit_id)

        _, my_output, _ = yield execute(cmd, cwd=top_repo_path)
        return my_output

    @tornado.gen.coroutine
    def checkout_new_branch(self, branchname, current_path):
        """
        Execute git checkout <make-branch> command & return the result.
        """
        code, my_output, my_error = yield execute(
            ["git", "checkout", "-b", branchname],
            cwd=os.path.join(self.root_dir, current_path),
        )
        if code == 0:
            return {"code": code, "message": my_output}
        else:
            return {
                "code": code,
                "command": "git checkout " + "-b" + branchname,
                "message": my_error,
            }

    @tornado.gen.coroutine
    def _get_branch_reference(self, branchname, current_path):
        """
        Execute git rev-parse --symbolic-full-name <branch-name> and return the result (or None).
        """
        code, my_output, _ = yield execute(
            ["git", "rev-parse", "--symbolic-full-name", branchname],
            cwd=os.path.join(self.root_dir, current_path),
        )
        if code == 0:
            return my_output.strip("\n")
        else:
            return None

    @tornado.gen.coroutine
    def checkout_branch(self, branchname, current_path):
        """
        Execute git checkout <branch-name> command & return the result.
        Use the --track parameter for a remote branch.
        """
        reference_name = yield self._get_branch_reference(branchname, current_path)
        if reference_name is None:
            is_remote_branch = False
        else:
            is_remote_branch = self._is_remote_branch(reference_name)

        if is_remote_branch:
            cmd = ["git", "checkout", "--track", branchname]
        else:
            cmd = ["git", "checkout", branchname]

        code, my_output, my_error = yield execute(
            cmd, cwd=os.path.join(self.root_dir, current_path)
        )

        if code == 0:
            return {"code": 0, "message": my_output}
        else:
            return {"code": code, "message": my_error, "command": " ".join(cmd)}

    @tornado.gen.coroutine
    def checkout(self, filename, top_repo_path):
        """
        Execute git checkout command for the filename & return the result.
        """
        _, my_output, _ = yield execute(
            ["git", "checkout", "--", filename], cwd=top_repo_path
        )
        return my_output

    @tornado.gen.coroutine
    def checkout_all(self, top_repo_path):
        """
        Execute git checkout command & return the result.
        """
        _, my_output, _ = yield execute(
            ["git", "checkout", "--", "."], cwd=top_repo_path
        )
        return my_output

    @tornado.gen.coroutine
    def commit(self, commit_msg, top_repo_path):
        """
        Execute git commit <filename> command & return the result.
        """
        _, my_output, _ = yield execute(
            ["git", "commit", "-m", commit_msg], cwd=top_repo_path
        )
        return my_output

    @tornado.gen.coroutine
    def pull(self, curr_fb_path, auth=None):
        """
        Execute git pull --no-commit.  Disables prompts for the password to avoid the terminal hanging while waiting
        for auth.
        """
        env = os.environ.copy()
        if auth:
            env["GIT_TERMINAL_PROMPT"] = "1"
            code, error = yield execute_with_authentication(
                ["git", "pull", "--no-commit"],
                username=auth["username"],
                password=auth["password"],
                cwd=os.path.join(self.root_dir, curr_fb_path),
                env=env,
            )
        else:
            env["GIT_TERMINAL_PROMPT"] = "0"
            code, _, error = yield execute(
                ["git", "pull", "--no-commit"],
                env=env,
                cwd=os.path.join(self.root_dir, curr_fb_path),
            )

        response = {"code": code}

        if code != 0:
            response["message"] = error.strip()

        return response

    @tornado.gen.coroutine
    def push(self, remote, branch, curr_fb_path, auth=None):
        """
        Execute `git push $UPSTREAM $BRANCH`. The choice of upstream and branch is up to the caller.
        """
        env = os.environ.copy()
        if auth:
            env["GIT_TERMINAL_PROMPT"] = "1"
            code, error = yield execute_with_authentication(
                ["git", "push", remote, branch],
                username=auth["username"],
                password=auth["password"],
                cwd=os.path.join(self.root_dir, curr_fb_path),
                env=env,
            )
        else:
            env["GIT_TERMINAL_PROMPT"] = "0"
            code, _, error = yield execute(
                ["git", "push", remote, branch],
                env=env,
                cwd=os.path.join(self.root_dir, curr_fb_path),
            )

        response = {"code": code}

        if code != 0:
            response["message"] = error.strip()

        return response

    @tornado.gen.coroutine
    def init(self, current_path):
        """
        Execute git init command & return the result.
        """
        _, my_output, _ = yield execute(
            ["git", "init"], cwd=os.path.join(self.root_dir, current_path)
        )
        return my_output

    def _is_remote_branch(self, branch_reference):
        """Check if given branch is remote branch by comparing with 'remotes/',
        TODO : Consider a better way to check remote branch
        """
        return branch_reference.startswith("refs/remotes/")

    @tornado.gen.coroutine
    def get_current_branch(self, current_path):
        """Use `symbolic-ref` to get the current branch name. In case of
        failure, assume that the HEAD is currently detached, and fall back
        to the `branch` command to get the name.
        See https://git-blame.blogspot.com/2013/06/checking-current-branch-programatically.html
        """
        command = ["git", "symbolic-ref", "HEAD"]
        code, output, error = yield execute(
            command, cwd=os.path.join(self.root_dir, current_path)
        )
        if code == 0:
            return output.split("/")[-1].strip()
        elif "not a symbolic ref" in error.lower():
            return self._get_current_branch_detached(current_path)
        else:
            raise Exception(
                "Error [{}] occurred while executing [{}] command to get current branch.".format(
                    error, " ".join(command)
                )
            )

    @tornado.gen.coroutine
    def _get_current_branch_detached(self, current_path):
        """Execute 'git branch -a' to get current branch details in case of detached HEAD
        """
        command = ["git", "branch", "-a"]
        code, output, error = yield execute(
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

    @tornado.gen.coroutine
    def get_upstream_branch(self, current_path, branch_name):
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
        code, output, error = yield execute(
            command, cwd=os.path.join(self.root_dir, current_path)
        )
        if code == 0:
            return output.strip()
        elif "fatal: no upstream configured for branch" in error.lower():
            return None
        elif "unknown revision or path not in the working tree" in error.lower():
            return None
        else:
            raise Exception(
                "Error [{}] occurred while executing [{}] command to get upstream branch.".format(
                    error, " ".join(command)
                )
            )

    @tornado.gen.coroutine
    def _get_tag(self, current_path, commit_sha):
        """Execute 'git describe commit_sha' to get
        nearest tag associated with lastest commit in branch.
        Reference : https://git-scm.com/docs/git-describe#git-describe-ltcommit-ishgt82308203
        """
        command = ["git", "describe", "--tags", commit_sha]
        code, output, error = yield execute(
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

    @tornado.gen.coroutine
    def show(self, filename, ref, top_repo_path):
        """
        Execute git show <ref:filename> command & return the result.
        """
        command = ["git", "show", "{}:{}".format(ref, filename)]

        code, output, error = yield execute(command, cwd=top_repo_path)

        error_messages = map(
            lambda n: n.lower(),
            [
                "fatal: Path '{}' exists on disk, but not in '{}'".format(
                    filename, ref
                ),
                "fatal: Path '{}' does not exist (neither on disk nor in the index)".format(
                    filename
                ),
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
        model = self.contents_manager.get(path=os.path.join(relative_repo, filename))
        return model["content"]

    @tornado.gen.coroutine
    def diff_content(self, filename, prev_ref, curr_ref, top_repo_path):
        """
        Collect get content of prev and curr and return.
        """
        prev_content = yield self.show(filename, prev_ref["git"], top_repo_path)
        if "special" in curr_ref:
            if curr_ref["special"] == "WORKING":
                curr_content = self.get_content(filename, top_repo_path)
            elif curr_ref["special"] == "INDEX":
                curr_content = yield self.show(filename, "", top_repo_path)
            else:
                raise tornado.web.HTTPError(
                    log_message="Error while retrieving plaintext diff, unknown special ref '{}'.".format(
                        curr_ref["special"]
                    )
                )
        else:
            curr_content = yield self.show(filename, curr_ref["git"], top_repo_path)
        return {"prev_content": prev_content, "curr_content": curr_content}
