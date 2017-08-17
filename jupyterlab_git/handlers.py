"""
This is a Handler Module with all the individual handlers for Git-Plugin.
"""
import os
import json
import socket
import time
import subprocess as sp
import psutil
from tornado import web
import subprocess


from notebook.utils import url_path_join
from notebook.base.handlers import APIHandler


class Git_handler(APIHandler):
    """
    Git Parent Handler.
    """
    @property
    def git(self):
        return self.settings['git']


class Git_API_handler(Git_handler):
    """
    A single class to give you 4 git commands combined:
    1. git showtoplevel
    2. git branch
    3. git log
    4. git status
    Class is used in the refresh method
    """

    def post(self):
        """
        Function used  to apply POST(REST_API) method to 'Git_API_handler'.
        API handler gives you:
        1. git showtoplevel
        2. git branch
        3. git log
        4. git status
        """

        my_data = json.loads(self.request.body)
        current_path = my_data["current_path"]
        showtoplevel = self.git.showtoplevel(current_path)
        if(showtoplevel['code'] != 0):
            self.finish(json.dumps(showtoplevel))
        else:
            branch = self.git.branch(current_path)
            log = self.git.log(current_path)
            status = self.git.status(current_path)

            result = {
                "code": showtoplevel['code'],
                'data': {
                    'showtoplevel': showtoplevel,
                    'branch': branch,
                    'log': log,
                    'status': status}}
            self.finish(json.dumps(result))


class Git_showtoplevel_handler(Git_handler):
    """
    A class used to show the git root directory inside a repository.
    The git command used in here is 'git rev-parse --show-toplevel'
    """

    def post(self):
        """
        Function used  to apply POST  method to 'Git_showtoplevel_handler'.
        show toplevel gives you the root directory in your git repository.
        """
        my_data = json.loads(self.request.body)
        current_path = my_data["current_path"]
        result = self.git.showtoplevel(current_path)
        self.finish(json.dumps(result))


class Git_showprefix_handler(Git_handler):
    """
    A class used to show the prefix path of a directory in a repository
    The git command used in here is 'git rev-parse --show-prefix'
    """

    def post(self):
        """
        Function used  to apply POST method to 'Git_showprefix_handler'.
        show prefix gives you the prefix with respect to root directory
        """
        my_data = json.loads(self.request.body)
        current_path = my_data["current_path"]
        result = self.git.showprefix(current_path)
        self.finish(json.dumps(result))


class Git_status_handler(Git_handler):
    """
    A class used to show the git status.
    The git command used in here is 'git status --porcelain'
    """

    def get(self):
        """
        Function used to apply GET method to 'Git_status_handler'.
        We need GET method to return the status to refresh method & show file status.
        """
        self.finish(json.dumps(
            {"add_all": "check", "filename": "filename", "top_repo_path": "path"}))

    def post(self):
        """
        Function used to apply POST method to 'Git_status_handler'.
        """
        my_data = json.loads(self.request.body)
        current_path = my_data["current_path"]
        result = self.git.status(current_path)
        self.finish(json.dumps(result))


class Git_log_handler(Git_handler):
    """
    A class used to get Commit SHA, Author Name, Commit Date & Commit Message.
    The git command used here is 'git log --pretty=format:%H-%an-%ar-%s'.
    """

    def post(self):
        """
        Function used to apply POST method of 'Git_log_handler'.
        log handler is used to get Commit SHA, Author Name, Commit Date & Commit Message.
        """
        my_data = json.loads(self.request.body)
        current_path = my_data["current_path"]
        result = self.git.log(current_path)
        self.finish(json.dumps(result))


class Git_log_1_handler(Git_handler):
    """
    A class used to get file names of committed files, Number of insertions & deletions in that commit.
    The git command used here is 'git log -1 --stat --numstat --oneline'
    """

    def post(self):
        """
        Function used to apply POST method of 'Git_log_1_handler'.
        log 1 handler is used to get file names of committed files, Number of insertions & deletions in that commit.
        """
        my_data = json.loads(self.request.body)
        selected_hash = my_data["selected_hash"]
        current_path = my_data["current_path"]
        result = self.git.log_1(selected_hash, current_path)
        self.finish(json.dumps(result))


class Git_diff_handler(Git_handler):
    """
    A class used to show changes between commits & working tree.
    The git command used here is 'git diff --numstat'.
    """

    def post(self):
        """
        Function used to apply POST method of 'Git_diff_handler'.
        git diff is used to get differences between commits & current working tree.
        """
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]
        my_output = self.git.diff(top_repo_path)
        self.finish(my_output)
        print("GIT DIFF")
        print(my_output)


class Git_branch_handler(Git_handler):
    """
    A class used to change between different branches.
    The git command used here is 'git branch -a'.
    """

    def post(self):
        """
        Function used to apply POST method of 'Git_branch_handler'.
        git branch is used to get all the branches present.
        """
        my_data = json.loads(self.request.body)
        current_path = my_data["current_path"]
        result = self.git.branch(current_path)
        self.finish(json.dumps(result))


class Git_add_handler(Git_handler):
    """
    A class used to add files to the staging area.
    The git command used here is 'git add <filename>'.
    """

    def get(self):
        """
        Function used to apply GET method of 'Git_add_handler'.
        git add is used to add files in the staging area.
        """
        self.finish(json.dumps(
            {"add_all": "check", "filename": "filename", "top_repo_path": "path"}))

    def post(self):
        """
        Function used to apply POST method of 'Git_add_handler'.
        git add is used to add files in the staging area.
        """
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]
        if(my_data["add_all"]):
            my_output = self.git.add_all(top_repo_path)
        else:
            filename = my_data["filename"]
            my_output = self.git.add(filename, top_repo_path)
        self.finish(my_output)


class Git_reset_handler(Git_handler):
    """
    A class used to move files from staged to unstaged area.
    The git command used here is 'git reset <filename>'.
    """

    def post(self):
        """
        Function used to apply POST method of 'Git_reset_handler'.
        git reset is used to reset files from staging to unstage area.
        """
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]
        if(my_data["reset_all"]):
            my_output = self.git.reset_all(top_repo_path)
        else:
            filename = my_data["filename"]
            my_output = self.git.reset(filename, top_repo_path)
        self.finish(my_output)


class Git_checkout_handler(Git_handler):
    """
    A class used to changes branches.
    The git command used here is 'git checkout <branchname>'.
    """

    def post(self):
        """
        Function used to apply POST method of 'Git_checkout_handler'.
        git checkout is used to changes between branches.
        """
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]
        if (my_data["checkout_branch"]):
            if(my_data["new_check"]):
                print("to create a new branch")
                my_output = self.git.checkout_new_branch(
                    my_data["branchname"], top_repo_path)
            else:
                print("switch to an old branch")
                my_output = self.git.checkout_branch(
                    my_data["branchname"], top_repo_path)
        elif(my_data["checkout_all"]):
            my_output = self.git.checkout_all(top_repo_path)
        else:
            my_output = self.git.checkout(my_data["filename"], top_repo_path)
        self.finish(my_output)


class Git_commit_handler(Git_handler):
    """
    A class used to commit files.
    The git command used here is 'git commit -m <message>'.
    """

    def post(self):
        """
        Function used to apply POST method of 'Git_commit_handler'.
        git commit is used to commit files.
        """
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]
        commit_msg = my_data["commit_msg"]
        my_output = self.git.commit(commit_msg, top_repo_path)
        self.finish(my_output)


class Git_pull_handler(Git_handler):
    """
    A class used to pull files from a remote branch.
    The git command used here is 'git pull <first-branch> <second-branch>'.
    """

    def post(self):
        """
        Function used to apply POST method of 'Git_pull_handler'.
        git pull is used to pull files from a remote branch to your current work.
        """
        my_data = json.loads(self.request.body)
        origin = my_data["origin"]
        master = my_data["master"]
        curr_fb_path = my_data["curr_fb_path"]
        my_output = self.git.pull(origin, master, curr_fb_path)
        self.finish(my_output)
        print("You Pulled")


class Git_push_handler(Git_handler):
    """
    A class used to push files to a remote branch.
    The git command used here is 'git push <first-branch> <second-branch>'.
    """

    def post(self):
        """
        Function used to apply POST method of 'Git_push_handler'.
        git push is used to push files from a remote branch to your current work.
        """
        my_data = json.loads(self.request.body)
        origin = my_data["origin"]
        master = my_data["master"]
        curr_fb_path = my_data["curr_fb_path"]
        my_output = self.git.push(origin, master, curr_fb_path)
        self.finish(my_output)
        print("You Pushed")


class Git_init_handler(Git_handler):
    """
    A class used to initialize a repository.
    The git command used here is 'git init'.
    """

    def post(self):
        """
        Function used to apply POST method of 'Git_init_handler'.
        git init is used to initialize a repository.
        """
        my_data = json.loads(self.request.body)
        current_path = my_data["current_path"]
        my_output = self.git.init(current_path)
        self.finish(my_output)


def setup_handlers(web_app):
    """
    Function used to setup all of the Git_Handlers used in the file.
    Every handler is defined here, to be used in git.py file.
    """
    web_app.add_handlers('.*', [('/git/showtoplevel', Git_showtoplevel_handler)])
    web_app.add_handlers('.*', [('/git/showprefix', Git_showprefix_handler)])
    web_app.add_handlers('.*', [('/git/add', Git_add_handler)])
    web_app.add_handlers('.*', [('/git/status', Git_status_handler)])
    web_app.add_handlers('.*', [('/git/branch', Git_branch_handler)])
    web_app.add_handlers('.*', [('/git/reset', Git_reset_handler)])
    web_app.add_handlers('.*', [('/git/checkout', Git_checkout_handler)])
    web_app.add_handlers('.*', [('/git/commit', Git_commit_handler)])
    web_app.add_handlers('.*', [('/git/pull', Git_pull_handler)])
    web_app.add_handlers('.*', [('/git/push', Git_push_handler)])
    web_app.add_handlers('.*', [('/git/diff', Git_diff_handler)])
    web_app.add_handlers('.*', [('/git/log', Git_log_handler)])
    web_app.add_handlers('.*', [('/git/log_1', Git_log_1_handler)])
    web_app.add_handlers('.*', [('/git/init', Git_init_handler)])
    web_app.add_handlers('.*', [('/git/API', Git_API_handler)])