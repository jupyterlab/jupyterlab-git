"""
Module for executing git commands, sending results back to the handlers
"""
import os
import subprocess
from subprocess import Popen, PIPE, CalledProcessError

import pexpect
from urllib.parse import unquote
from tornado.web import HTTPError


ALLOWED_OPTIONS = ['user.name', 'user.email']


class GitAuthInputWrapper:
    """
    Helper class which is meant to replace subprocess.Popen for communicating
    with git CLI when also sending username and password for auth
    """
    def __init__(self, command, cwd, env, username, password):
        self.command = command
        self.cwd = cwd
        self.env = env
        self.username = username
        self.password = password
    def communicate(self):
        try:
            p = pexpect.spawn(
                self.command, 
                cwd = self.cwd,
                env = self.env
            )

            # We expect a prompt from git
            # In most of cases git will prompt for username and
            #  then for password
            # In some cases (Bitbucket) username is included in
            #  remote URL, so git will not ask for username 
            i = p.expect(['Username for .*: ', 'Password for .*:'])
            if i==0: #ask for username then password
                p.sendline(self.username)
                p.expect('Password for .*:')
                p.sendline(self.password)
            elif i==1: #only ask for password
                p.sendline(self.password)

            p.expect(pexpect.EOF)
            response = p.before

            self.returncode = p.wait()
            p.close()
            
            return response
        except pexpect.exceptions.EOF: #In case of pexpect failure
            response = p.before
            self.returncode = p.exitstatus
            p.close() #close process
            return response


class Git:
    """
    A single parent class containing all of the individual git methods in it.
    """

    def __init__(self, root_dir, *args, **kwargs):
        super(Git, self).__init__(*args, **kwargs)
        self.root_dir = os.path.realpath(os.path.expanduser(root_dir))

    def config(self, top_repo_path, **kwargs):
        """Get or set Git options.
        
        If no kwargs, all options are returned. Otherwise kwargs are set.
        """
        response = {"code": 1}

        if len(kwargs):
            output = []
            for k, v in filter(lambda t: True if t[0] in ALLOWED_OPTIONS else False, kwargs.items()):
                cmd = ["git", "config", "--add", k, v]
                p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=top_repo_path)
                out, err = p.communicate()
                output.append(out.decode("utf-8").strip())
                response["code"] = p.returncode
                if p.returncode != 0:
                    response["command"] = " ".join(cmd)
                    response["message"] = err.decode("utf-8").strip()
                    return response

            response["message"] = "\n".join(output).strip()
        else:
            cmd = ["git", "config", "--list"]
            p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=top_repo_path)
            output, error = p.communicate()

            response = {"code": p.returncode}

            if p.returncode != 0:
                response["command"] = " ".join(cmd)
                response["message"] = error.decode("utf-8").strip()
            else:
                raw = output.decode("utf-8").strip()
                response["options"] = dict()
                for l in raw.split("\n"):
                    k, v = l.split("=", maxsplit=1)
                    if k in ALLOWED_OPTIONS:
                        response["options"][k] = v

        return response

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
            cmd = ['git', 'diff', '{}^!'.format(single_commit), '--name-only']
        elif base and remote:
            if base == 'WORKING':
                cmd = ['git', 'diff', remote, '--name-only']
            elif base == 'INDEX':
                cmd = ['git', 'diff', '--staged', remote, '--name-only']
            else:
                cmd = ['git', 'diff', base, remote, '--name-only']
        else:
            raise HTTPError(400, 'Either single_commit or (base and remote) must be provided')

        
        response = {}
        try:
            stdout = subprocess.check_output(
                cmd, 
                cwd=self.root_dir,
                stderr=subprocess.STDOUT
            )
            response['files'] = stdout.decode('utf-8').strip().split('\n')
            response['code'] = 0
        except CalledProcessError as e:
            response['message'] =  e.output.decode('utf-8')
            response['code'] = e.returncode

        return response


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
        if (auth):
            env["GIT_TERMINAL_PROMPT"] = "1"
            p = GitAuthInputWrapper(
                command='git clone {} -q'.format(unquote(repo_url)),
                cwd=os.path.join(self.root_dir, current_path),
                env = env,
                username=auth['username'],
                password=auth['password'],
            )
            error = p.communicate()
        else:
            env["GIT_TERMINAL_PROMPT"] = "0"
            p = subprocess.Popen(
                ['git', 'clone', unquote(repo_url)],
                stdout=PIPE,
                stderr=PIPE,
                env = env,
                cwd=os.path.join(self.root_dir, current_path),
            )
            _, error = p.communicate()

        response = {"code": p.returncode}

        if p.returncode != 0:
            response["message"] = error.decode("utf-8").strip()

        return response

    def status(self, current_path):
        """
        Execute git status command & return the result.
        """
        p = Popen(
            ["git", "status", "--porcelain"],
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )
        my_output, my_error = p.communicate()
        if p.returncode == 0:
            result = []
            line_array = my_output.decode("utf-8").splitlines()
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
            return {"code": p.returncode, "files": result}
        else:
            return {
                "code": p.returncode,
                "command": "git status --porcelain",
                "message": my_error.decode("utf-8"),
            }

    def log(self, current_path, history_count=10):
        """
        Execute git log command & return the result.
        """
        p = Popen(
            ["git", "log", "--pretty=format:%H%n%an%n%ar%n%s", ("-%d" % history_count)],
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )
        my_output, my_error = p.communicate()
        if p.returncode == 0:
            result = []
            line_array = my_output.decode("utf-8").splitlines()
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
            return {"code": p.returncode, "commits": result}
        else:
            return {"code": p.returncode, "message": my_error.decode("utf-8")}

    def detailed_log(self, selected_hash, current_path):
        """
        Execute git log -1 --stat --numstat --oneline command (used to get
        insertions & deletions per file) & return the result.
        """
        p = subprocess.Popen(
            ["git", "log", "-1", "--stat", "--numstat", "--oneline", selected_hash],
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )
        my_output, my_error = p.communicate()
        if p.returncode == 0:
            result = []
            note = [0] * 3
            count = 0
            temp = ""
            line_array = my_output.decode("utf-8").splitlines()
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
                "code": p.returncode,
                "modified_file_note": temp,
                "modified_files_count": note[0],
                "number_of_insertions": note[1],
                "number_of_deletions": note[2],
                "modified_files": result,
            }
        else:
            return {
                "code": p.returncode,
                "command": "git log_1",
                "message": my_error.decode("utf-8"),
            }

    def diff(self, top_repo_path):
        """
        Execute git diff command & return the result.
        """
        p = Popen(
            ["git", "diff", "--numstat"], stdout=PIPE, stderr=PIPE, cwd=top_repo_path
        )
        my_output, my_error = p.communicate()
        if p.returncode == 0:
            result = []
            line_array = my_output.decode("utf-8").splitlines()
            for line in line_array:
                linesplit = line.split()
                result.append(
                    {
                        "insertions": linesplit[0],
                        "deletions": linesplit[1],
                        "filename": linesplit[2],
                    }
                )
            return {"code": p.returncode, "result": result}
        else:
            return {"code": p.returncode, "message": my_error.decode("utf-8")}

    def branch(self, current_path):
        """
        Execute 'git for-each-ref' command & return the result.
        """
        heads = self.branch_heads(current_path)
        if heads["code"] != 0:
            # error; bail
            return heads

        remotes = self.branch_remotes(current_path)
        if remotes["code"] != 0:
            # error; bail
            return remotes

        # all's good; concatenate results and return
        return {"code": 0, "branches": heads["branches"] + remotes["branches"]}

    def branch_heads(self, current_path):
        """
        Execute 'git for-each-ref' command on refs/heads & return the result.
        """
        formats = ['refname:short', 'objectname', 'upstream:short', 'HEAD']
        cmd = ["git", "for-each-ref", "--format=" + "%09".join("%({})".format(f) for f in formats), "refs/heads/"]
        p = subprocess.Popen(
            cmd,
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )
        output, error = p.communicate()
        if p.returncode == 0:
            current_branch_seen = False
            results = []
            try:
                for name,commit_sha,upstream_name,is_current_branch in (line.split('\t') for line in output.decode("utf-8").splitlines()):
                    # Format reference : https://git-scm.com/docs/git-for-each-ref#_field_names
                    is_current_branch = bool(is_current_branch.strip())
                    current_branch_seen |= is_current_branch

                    results.append({
                        "is_current_branch": is_current_branch,
                        "is_remote_branch": False,
                        "name": name,
                        "upstream": upstream_name if upstream_name else None,
                        "top_commit": commit_sha,
                        "tag": None,
                    })

                # Remote branch is seleted use 'git branch -a' as fallback machanism
                # to get add detached head on remote branch to preserve older functionality
                # TODO : Revisit this to checkout new local branch with same name as remote
                # when the remote branch is seleted, VS Code git does the same thing.
                if not current_branch_seen and self.get_current_branch(current_path) == "HEAD":
                    results.append({
                        "is_current_branch": True,
                        "is_remote_branch": False,
                        "name": self._get_detached_head_name(current_path),
                        "upstream": None,
                        "top_commit": None,
                        "tag": None,
                    })
                return {"code": p.returncode, "branches": results}
            except Exception as downstream_error:
                return {
                    "code": -1,
                    "command": ' '.join(cmd),
                    "message": str(downstream_error),
                }
        else:
            return {
                "code": p.returncode,
                "command": ' '.join(cmd),
                "message": error.decode("utf-8"),
            }

    def branch_remotes(self, current_path):
        """
        Execute 'git for-each-ref' command on refs/heads & return the result.
        """
        formats = ['refname:short', 'objectname']
        cmd = ["git", "for-each-ref", "--format=" + "%09".join("%({})".format(f) for f in formats), "refs/remotes/"]
        p = subprocess.Popen(
            cmd,
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )
        output, error = p.communicate()
        if p.returncode == 0:
            results = []
            try:
                for name,commit_sha in (line.split('\t') for line in output.decode("utf-8").splitlines()):
                    # Format reference : https://git-scm.com/docs/git-for-each-ref#_field_names
                    results.append({
                        "is_current_branch": False,
                        "is_remote_branch": True,
                        "name": name,
                        "upstream": None,
                        "top_commit": commit_sha,
                        "tag": None,
                    })
                return {"code": p.returncode, "branches": results}
            except Exception as downstream_error:
                return {
                    "code": -1,
                    "command": ' '.join(cmd),
                    "message": str(downstream_error),
                }
        else:
            return {
                "code": p.returncode,
                "command": ' '.join(cmd),
                "message": error.decode("utf-8"),
            }

    def show_top_level(self, current_path):
        """
        Execute git --show-toplevel command & return the result.
        """
        p = Popen(
            ["git", "rev-parse", "--show-toplevel"],
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )
        my_output, my_error = p.communicate()
        if p.returncode == 0:
            result = {
                "code": p.returncode,
                "top_repo_path": my_output.decode("utf-8").strip("\n"),
            }
            return result
        else:
            return {
                "code": p.returncode,
                "command": "git rev-parse --show-toplevel",
                "message": my_error.decode("utf-8"),
            }

    def show_prefix(self, current_path):
        """
        Execute git --show-prefix command & return the result.
        """
        p = Popen(
            ["git", "rev-parse", "--show-prefix"],
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )
        my_output, my_error = p.communicate()
        if p.returncode == 0:
            result = {
                "code": p.returncode,
                "under_repo_path": my_output.decode("utf-8").strip("\n"),
            }
            return result
        else:
            return {
                "code": p.returncode,
                "command": "git rev-parse --show-prefix",
                "message": my_error.decode("utf-8"),
            }

    def add(self, filename, top_repo_path):
        """
        Execute git add<filename> command & return the result.
        """
        my_output = subprocess.check_output(["git", "add", filename], cwd=top_repo_path)
        return my_output

    def add_all(self, top_repo_path):
        """
        Execute git add all command & return the result.
        """
        my_output = subprocess.check_output(["git", "add", "-A"], cwd=top_repo_path)
        return my_output

    def add_all_unstaged(self, top_repo_path):
        """
        Execute git add all unstaged command & return the result.
        """
        e = 'git add -u'
        my_output = subprocess.call(e, shell=True, cwd=top_repo_path)
        return {"result": my_output}

    def add_all_untracked(self, top_repo_path):
        """
        Execute git add all untracked command & return the result.
        """
        e = 'echo "a\n*\nq\n" | git add -i'
        my_output = subprocess.call(e, shell=True, cwd=top_repo_path)
        return {"result": my_output}

    def reset(self, filename, top_repo_path):
        """
        Execute git reset <filename> command & return the result.
        """
        my_output = subprocess.check_output(
            ["git", "reset", "--", filename], cwd=top_repo_path
        )
        return my_output

    def reset_all(self, top_repo_path):
        """
        Execute git reset command & return the result.
        """
        my_output = subprocess.check_output(["git", "reset"], cwd=top_repo_path)
        return my_output

    def delete_commit(self, commit_id, top_repo_path):
        """
        Delete a specified commit from the repository.
        """
        my_output = subprocess.check_output(
            ["git", "revert", "--no-commit", commit_id], cwd=top_repo_path
        )
        return my_output

    def reset_to_commit(self, commit_id, top_repo_path):
        """
        Reset the current branch to a specific past commit.
        """
        my_output = subprocess.check_output(
            ["git", "reset", "--hard", commit_id], cwd=top_repo_path
        )
        return my_output

    def checkout_new_branch(self, branchname, current_path):
        """
        Execute git checkout <make-branch> command & return the result.
        """
        p = Popen(
            ["git", "checkout", "-b", branchname],
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )
        my_output, my_error = p.communicate()
        if p.returncode == 0:
            return {"code": p.returncode, "message": my_output.decode("utf-8")}
        else:
            return {
                "code": p.returncode,
                "command": "git checkout " + "-b" + branchname,
                "message": my_error.decode("utf-8"),
            }

    def _get_branch_reference(self, branchname, current_path):
        """
        Execute git rev-parse --symbolic-full-name <branch-name> and return the result (or None).
        """
        p = subprocess.Popen(
            ["git", "rev-parse", "--symbolic-full-name", branchname],
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )
        my_output, my_error = p.communicate()
        if p.returncode == 0:
            return my_output.decode("utf-8").strip("\n")
        else:
            return None

    def checkout_branch(self, branchname, current_path):
        """
        Execute git checkout <branch-name> command & return the result.
        Use the --track parameter for a remote branch.
        """
        reference_name = self._get_branch_reference(branchname, current_path)
        if reference_name is None:
            is_remote_branch = False
        else:
            is_remote_branch = self._is_remote_branch(reference_name)

        if is_remote_branch:
            cmd = ["git", "checkout", "--track", branchname]
        else:
            cmd = ["git", "checkout", branchname]

        p = subprocess.Popen(
            cmd,
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )

        my_output, my_error = p.communicate()
        if p.returncode == 0:
            return { "code": 0, "message": my_output.decode("utf-8") }
        else:
            return { "code": p.returncode, "message": my_error.decode("utf-8"), "command":  " ".join(cmd) }

    def checkout(self, filename, top_repo_path):
        """
        Execute git checkout command for the filename & return the result.
        """
        my_output = subprocess.check_output(
            ["git", "checkout", "--", filename], cwd=top_repo_path
        )
        return my_output

    def checkout_all(self, top_repo_path):
        """
        Execute git checkout command & return the result.
        """
        my_output = subprocess.check_output(
            ["git", "checkout", "--", "."], cwd=top_repo_path
        )
        return my_output

    def commit(self, commit_msg, top_repo_path):
        """
        Execute git commit <filename> command & return the result.
        """
        my_output = subprocess.check_output(
            ["git", "commit", "-m", commit_msg], cwd=top_repo_path
        )
        return my_output
            
    def pull(self, curr_fb_path, auth=None):
        """
        Execute git pull --no-commit.  Disables prompts for the password to avoid the terminal hanging while waiting
        for auth.
        """
        env = os.environ.copy()
        if (auth):
            env["GIT_TERMINAL_PROMPT"] = "1"
            p = GitAuthInputWrapper(
                command = 'git pull --no-commit',
                cwd = os.path.join(self.root_dir, curr_fb_path),
                env = env,
                username = auth['username'],
                password = auth['password']
            )
            error = p.communicate()
        else:
            env["GIT_TERMINAL_PROMPT"] = "0"
            p = subprocess.Popen(
                ['git', 'pull', '--no-commit'],
                stdout=PIPE,
                stderr=PIPE,
                env = env,
                cwd=os.path.join(self.root_dir, curr_fb_path),
            )
            _, error = p.communicate()

        response = {"code": p.returncode}

        if p.returncode != 0:
            response["message"] = error.decode("utf-8").strip()

        return response

    def push(self, remote, branch, curr_fb_path, auth=None):
        """
        Execute `git push $UPSTREAM $BRANCH`. The choice of upstream and branch is up to the caller.
        """
        env = os.environ.copy()
        if (auth):
            env["GIT_TERMINAL_PROMPT"] = "1"
            p = GitAuthInputWrapper(
                command = 'git push {} {}'.format(remote, branch),
                cwd = os.path.join(self.root_dir, curr_fb_path),
                env = env,
                username = auth['username'],
                password = auth['password']
            )
            error = p.communicate()
        else:
            env["GIT_TERMINAL_PROMPT"] = "0"
            p = subprocess.Popen(
                ['git', 'push', remote, branch],
                stdout=PIPE,
                stderr=PIPE,
                env = env,
                cwd=os.path.join(self.root_dir, curr_fb_path),
            )
            _, error = p.communicate()

        response = {"code": p.returncode}

        if p.returncode != 0:
            response["message"] = error.decode("utf-8").strip()

        return response

    def init(self, current_path):
        """
        Execute git init command & return the result.
        """
        my_output = subprocess.check_output(
            ["git", "init"], cwd=os.path.join(self.root_dir, current_path)
        )
        return my_output

    def _is_branch(self, reference_name):
        """Check if the given reference is a branch
        """
        return reference_name.startswith("refs/heads/") or reference_name.startswith(
            "refs/remotes/"
        )

    def _is_current_branch(self, branch_name, current_branch_name):
        """Check if given branch is current branch
        """
        return branch_name == current_branch_name

    def _is_remote_branch(self, branch_reference):
        """Check if given branch is remote branch by comparing with 'remotes/',
        TODO : Consider a better way to check remote branch
        """
        return branch_reference.startswith("refs/remotes/")

    def _get_branch_name(self, branch_reference):
        """Get branch name for given branch
        """
        if branch_reference.startswith("refs/heads/"):
            return branch_reference.split("refs/heads/")[1]
        if branch_reference.startswith("refs/remotes/"):
            return branch_reference.split("refs/remotes/")[1]

        raise ValueError("Reference [{}] is not a valid branch.", branch_reference)

    def get_current_branch(self, current_path):
        """Execute 'git rev-parse --abbrev-ref HEAD' to
        check if given branch is current branch
        """
        command = ["git", "rev-parse", "--abbrev-ref", "HEAD"]
        p = subprocess.Popen(
            command,
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )
        output, error = p.communicate()
        if p.returncode == 0:
            return output.decode("utf-8").strip()
        else:
            raise Exception(
                "Error [{}] occurred while executing [{}] command to get current branch.".format(
                    error.decode("utf-8"), " ".join(command)
                )
            )

    def _get_detached_head_name(self, current_path):
        """Execute 'git branch -a' to get current branch details in case of detached HEAD
        """
        command = ["git", "branch", "-a"]
        p = subprocess.Popen(
            command,
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )
        output, error = p.communicate()
        if p.returncode == 0:
            for branch in output.decode("utf-8").splitlines():
                branch = branch.strip()
                if branch.startswith("*"):
                    return branch.lstrip("* ")
        else:
            raise Exception(
                "Error [{}] occurred while executing [{}] command to get detached HEAD name.".format(
                    error.decode("utf-8"), " ".join(command)
                )
            )

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
        p = subprocess.Popen(
            command,
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )
        output, error = p.communicate()
        if p.returncode == 0:
            return output.decode("utf-8").strip()
        elif "fatal: no upstream configured for branch" in error.decode("utf-8").lower():
            return None
        elif "unknown revision or path not in the working tree" in error.decode("utf-8").lower():
            return None
        else:
            raise Exception(
                "Error [{}] occurred while executing [{}] command to get upstream branch.".format(
                    error.decode("utf-8"), " ".join(command)
                )
            )

    def _get_tag(self, current_path, commit_sha):
        """Execute 'git describe commit_sha' to get
        nearest tag associated with lastest commit in branch.
        Reference : https://git-scm.com/docs/git-describe#git-describe-ltcommit-ishgt82308203
        """
        command = ["git", "describe", "--tags", commit_sha]
        p = subprocess.Popen(
            command,
            stdout=PIPE,
            stderr=PIPE,
            cwd=os.path.join(self.root_dir, current_path),
        )
        output, error = p.communicate()
        if p.returncode == 0:
            return output.decode("utf-8").strip()
        elif "fatal: no tags can describe '{}'.".format(commit_sha) in error.decode(
            "utf-8"
        ).lower():
            return None
        elif "fatal: no names found" in error.decode("utf-8").lower():
            return None
        else:
            raise Exception(
                "Error [{}] occurred while executing [{}] command to get nearest tag associated with branch.".format(
                    error.decode("utf-8"), " ".join(command)
                )
            )

