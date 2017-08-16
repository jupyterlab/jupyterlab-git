
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
                to1 = None
                to2 = None
                from_path = line[3:]
                
                if line[0]=='R':
                    to0 = line[3:].split(' -> ')
                    to1 = to0[len(to0)-1]
                else:
                    to1 = line[3:]

                if to1.startswith('"'):
                    to1 = to1[1:]
                if to1.endswith('"'):
                    to1 = to1[:-1] 
                '''
                if(to1.endswith('/')):
                    to1 = to1[:-1]
                    to2 = to1.split('/')
                    to = to2[len(to2)-1]+'/'
                else:
                    to2 = to1.split('/')
                    to = to2[len(to2)-1]
                '''
                result.append({'x':line[0],'y':line[1],'to':to1,'from':from_path})
            return {"code": p.returncode, "files":result}
        else:
            return {"code": p.returncode, 'command':"git status --porcelain", "message": my_error.decode('utf-8')}

    def log(self,current_path):
        p = Popen(["git", "log","--pretty=format:%H%n%an%n%ar%n%s"], stdout=PIPE, stderr=PIPE, cwd = os.getcwd()+'/'+current_path)
        my_output,my_error = p.communicate()
        if(p.returncode==0):
            result = []
            line_array = my_output.decode('utf-8').splitlines()
            i = 0
            while i < len(line_array):
                result.append({'commit':line_array[i], 'author': line_array[i+1],'date':line_array[i+2],'commit_msg':line_array[i+3]})
                i += 4
            return {"code": p.returncode, "commits":result}
        else:
            return {"code":p.returncode, "message":my_error.decode('utf-8')}

    def log_1(self, selected_hash, current_path):
        p = Popen(["git", "log","-1", "--stat", "--numstat", "--oneline",selected_hash], stdout=PIPE, stderr=PIPE, cwd = os.getcwd()+'/'+current_path)
        my_output,my_error = p.communicate()
        if(p.returncode==0):
            result = []
            note = ""
            line_array = my_output.decode('utf-8').splitlines()
            length = len(line_array)
            if(length>1):
                note = line_array[length-1]
                for num in range(1, int(length/2)):
                    line_info = line_array[num].split()
                    result.append({"modified_file_path":line_info[2], "insertion": line_info[0], "deletion": line_info[1]})

            return {"code": p.returncode, "modified_file_note": note, "modified_files":result}
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
            return {"code": p.returncode, "branches":result}
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

    def add_all_untracked(self, top_repo_path):
        e = 'echo "a\n*\nq\n" | git add -i'
        my_output = subprocess.call(e, shell=True, cwd = top_repo_path)
        return {"result": my_output}


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
      
    def pull(self, origin, master,curr_fb_path):
        p = Popen(["git", "pull",origin,master,"--no-commit"], stdout=PIPE, stderr=PIPE, cwd = os.getcwd()+'/'+curr_fb_path)
        my_output, my_error = p.communicate()
        if(p.returncode==0):
            return {"code": p.returncode}
        else:
            return {"code": p.returncode, 'command':"git pull "+origin+' '+master+" --no-commit", "message": my_error.decode('utf-8')}

    def push(self, origin, master,curr_fb_path):
        p = Popen(["git", "push",origin,master], stdout=PIPE, stderr=PIPE, cwd = os.getcwd()+'/'+curr_fb_path)
        my_output, my_error = p.communicate()
        if(p.returncode==0):
            return {"code": p.returncode}
        else:
            return {"code": p.returncode, 'command':"git push "+origin+' '+master, "message": my_error.decode('utf-8')}

    def init(self,current_path):
        my_output = subprocess.check_output(["git", "init"],cwd = os.getcwd()+'/'+current_path)
        return my_output

