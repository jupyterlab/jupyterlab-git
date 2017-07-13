
import os
import json
import socket
import time
import subprocess as sp
import psutil
from tornado import web
import subprocess
import errno
import io
import shutil
import stat
import sys
import warnings
import mimetypes
import nbformat


from notebook.utils import url_path_join
from notebook.base.handlers import IPythonHandler



class Git:
    def status(self, current_path):
        my_output = subprocess.check_output(["git", "status", "--porcelain"], cwd = os.getcwd()+'/'+current_path)
        print(os.getcwd())
        print(current_path)
        return my_output

    def showtoplevel(self, current_path):
        my_output = subprocess.check_output(["git", "rev-parse", "--show-toplevel"], cwd = os.getcwd()+'/'+current_path)
        print(os.getcwd())
        print(current_path)
        return my_output

    def add(self, filename, top_repo_path):
        my_output = subprocess.check_output(["git", "add", filename], cwd = top_repo_path)
        print("Hi there! post extensions!!")
        return my_output
    
    def add_all(self, top_repo_path):
        my_output = subprocess.check_output(["git", "add", "-u"], cwd = top_repo_path)
        print("Hi there! post extensions!!")
        return my_output

    def reset(self, filename, top_repo_path):
        my_output = subprocess.check_output(["git", "reset", filename], cwd = top_repo_path)
        print("Hi there! post extensions!!")
        return my_output

    def reset_all(self, top_repo_path):
        my_output = subprocess.check_output(["git", "reset"], cwd = top_repo_path)
        print("Hi there! post extensions!!")
        return my_output

    def checkout(self, filename, top_repo_path):
        my_output = subprocess.check_output(["git", "checkout", "--", filename], cwd = top_repo_path)
        print("Hi there! post extensions!!")
        return my_output

    def checkout_all(self, top_repo_path):
        my_output = subprocess.check_output(["git", "checkout", "--", "."], cwd = top_repo_path)
        print("Hi there! post extensions!!")
        return my_output

    def commit(self, commit_msg, top_repo_path):
        my_output = subprocess.check_output(["git", "commit", "-m", commit_msg], cwd = top_repo_path)
        print("Hi there! post extensions!!")
        return my_output
        
