
import os
import json
import socket
import time
import subprocess as sp
import psutil
from tornado import web
import subprocess
from subprocess import Popen, PIPE
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
        p = Popen(["git", "status", "--porcelain"], stdout=PIPE, stderr=PIPE, cwd = os.getcwd()+'/'+current_path)
        my_output, my_error = p.communicate()
        if(p.returncode==0):
            result = [] 
            line_array = my_output.decode('utf-8').splitlines()
            for line in line_array:
                result.append({'x':line[0],'y':line[1],'to':line[3:],'from':None})
            return {"code": p.returncode, "files":result}
        else:
            return {"code": p.returncode, 'command':"git status --porcelain", "message": my_error.decode('utf-8')}

    def log(self,current_path):
        p = Popen(["git", "log","--pretty=format:%h-%an-%ar-%s"], stdout=PIPE, stderr=PIPE, cwd = os.getcwd()+'/'+current_path)
        my_output,my_error = p.communicate()
        if(p.returncode==0):
            result = []
            line_array = my_output.decode('utf-8').splitlines()
            for line in line_array:
                linesplit = line.split('-')
                result.append({'commit':linesplit[0], 'author': linesplit[1],'date':linesplit[2],'commit_msg':linesplit[3]})
            return {"code": p.returncode, "commits":result}
        else:
            return {"code":p.returncode, "message":my_error.decode('utf-8')}

    def diff(self,top_repo_path):
        p = Popen(["git", "diff","--numstat"], stdout=PIPE, stderr=PIPE, cwd = top_repo_path)
        my_output,my_error = p.communicate()
        if(p.returncode==0):
            result = []
            line_array = my_output.decode('utf-8').splitlines()
            for line in line_array:
                linesplit = line.split()
                result.append({'insertions':linesplit[0], 'deletions': linesplit[1],'filename':linesplit[2]})
            return {"code": p.returncode, "result":result}
        else:
            return {"code":p.returncode, "message":my_error.decode('utf-8')}


    def branch(self, current_path):
        p = Popen(["git", "branch", "-a"], stdout=PIPE, stderr=PIPE, cwd = os.getcwd()+'/'+current_path)
        my_output, my_error = p.communicate()
        if(p.returncode==0):
            result = [] 
            line_array = my_output.decode('utf-8').splitlines()
            '''By comparing strings 'remotes/' to determine if a branch is local or remote, Should have btter ways '''
            for line_full in line_array:
                line_cut = line_full.split(' -> '),
                tag = None,
                current = False,
                remote = False,
                if(len(line_cut[0])>1):
                    tag = line_cut[0][1]
                line = line_cut[0][0],
                if(line_full[0]=='*'):
                    current = True,
                if(len(line_full)>=10) and (line_full[2:10]=="remotes/"):
                    remote = True,
                    result.append({'current':current,'remote':remote,'name':line[0][10:],'tag':tag})
                else:
                    result.append({'current':current,'remote':remote,'name':line_full[2:],'tag':tag})
            return {"code": p.returncode, "repos":result}
        else:
            return {"code": p.returncode, 'command':"git branch -a", "message": my_error.decode('utf-8')}

    def showtoplevel(self, current_path):
        p = Popen(["git", "rev-parse", "--show-toplevel"], stdout=PIPE, stderr=PIPE, cwd = os.getcwd()+'/'+current_path)
        my_output, my_error = p.communicate()
        if(p.returncode==0):
            result ={"code": p.returncode, "top_repo_path": my_output.decode('utf-8').strip('\n')}
            return result
        else:
            return {"code": p.returncode, 'command':"git rev-parse --show-toplevel", "message": my_error.decode('utf-8')}

    def showprefix(self, current_path):
        p = Popen(["git", "rev-parse", "--show-prefix"], stdout=PIPE, stderr=PIPE, cwd = os.getcwd()+'/'+current_path)
        my_output, my_error = p.communicate()
        if(p.returncode==0):
            result ={"code": p.returncode, "under_repo_path": my_output.decode('utf-8').strip('\n')}
            return result
        else:
            return {"code": p.returncode, 'command':"git rev-parse --show-prefix", "message": my_error.decode('utf-8')}

    def add(self, filename, top_repo_path):
        my_output = subprocess.check_output(["git", "add", filename], cwd = top_repo_path)
        return my_output
    
    def add_all(self, top_repo_path):
        my_output = subprocess.check_output(["git", "add", "-u"], cwd = top_repo_path)
        return my_output

    def reset(self, filename, top_repo_path):
        my_output = subprocess.check_output(["git", "reset", filename], cwd = top_repo_path)
        return my_output

    def reset_all(self, top_repo_path):
        my_output = subprocess.check_output(["git", "reset"], cwd = top_repo_path)
        return my_output

    def checkout_new_branch(self, branchname, current_path):
        p = Popen(["git", "checkout", "-b", branchname], stdout=PIPE, stderr=PIPE, cwd = os.getcwd()+'/'+current_path)
        my_output, my_error = p.communicate()
        if(p.returncode==0):
            return {"code": p.returncode, "message": my_output.decode('utf-8')}
        else:
            return {"code": p.returncode, 'command':"git checkout "+"-b"+branchname, "message": my_error.decode('utf-8')}

    def checkout_branch(self, branchname, current_path):
        p = Popen(["git", "checkout", branchname], stdout=PIPE, stderr=PIPE, cwd = os.getcwd()+'/'+current_path)
        my_output, my_error = p.communicate()
        if(p.returncode==0):
            return {"code": p.returncode, "message": my_output.decode('utf-8')}
        else:
            return {"code": p.returncode, 'command':"git checkout "+branchname, "message": my_error.decode('utf-8')}


    def checkout(self, filename, top_repo_path):
        my_output = subprocess.check_output(["git", "checkout", "--", filename], cwd = top_repo_path)
        return my_output

    def checkout_all(self, top_repo_path):
        my_output = subprocess.check_output(["git", "checkout", "--", "."], cwd = top_repo_path)
        return my_output

    def commit(self, commit_msg, top_repo_path):
        my_output = subprocess.check_output(["git", "commit", "-m", commit_msg], cwd = top_repo_path)
        return my_output
      
    def pull(self, origin, master,top_repo_path):
        my_output_1 = subprocess.check_output(["git", "fetch", "--all"], cwd = top_repo_path)
        str1 = origin +"/"+master
        my_output = subprocess.check_output(["git", "reset","--hard", str1], cwd = top_repo_path)
        print("Hi there! post extensions!!")
        return my_output

    def push(self, origin, master,top_repo_path):
        my_output = subprocess.check_output(["git", "push", origin,master], cwd = top_repo_path)
        print("Hi there! post extensions!!")
        return my_output