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
    @property
    def git(self):
        return self.settings['git']

class Git_showtoplevel_handler(Git_handler):       
    def post(self):
        my_data = json.loads(self.request.body)
        current_path = my_data["current_path"]
        result = self.git.showtoplevel(current_path)  
        self.finish(json.dumps(result))    

class Git_showprefix_handler(Git_handler):       
    def post(self):
        my_data = json.loads(self.request.body)
        current_path = my_data["current_path"]
        result = self.git.showprefix(current_path)  
        self.finish(json.dumps(result))  

class Git_status_handler(Git_handler):
    def get(self):
        self.finish(json.dumps({"add_all": "check" , "filename":"filename", "top_repo_path": "path"}))
        
    def post(self):
        my_data = json.loads(self.request.body)
        current_path = my_data["current_path"]
        result = self.git.status(current_path)   
        self.finish(json.dumps(result))

class Git_log_handler(Git_handler):
    def post(self):
        my_data = json.loads(self.request.body)
        current_path = my_data["current_path"]
        result = self.git.log(current_path)
        self.finish(json.dumps(result))

class Git_log_1_handler(Git_handler):
    def post(self):
        my_data = json.loads(self.request.body)
        selected_hash = my_data["selected_hash"]
        current_path = my_data["current_path"]
        result = self.git.log_1(selected_hash, current_path)
        self.finish(json.dumps(result))

class Git_diff_handler(Git_handler):
    def post(self):
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]
        my_output = self.git.diff(top_repo_path)
        self.finish(my_output)
        print("GIT DIFF")
        print(my_output)

class Git_branch_handler(Git_handler):       
    def post(self):
        my_data = json.loads(self.request.body)
        current_path = my_data["current_path"]
        result = self.git.branch(current_path)   
        self.finish(json.dumps(result))


class Git_add_handler(Git_handler):
    def get(self):
        self.finish(json.dumps({"add_all": "check" , "filename":"filename", "top_repo_path": "path"}))
    def post(self):
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]
        if(my_data["add_all"]):
            my_output = self.git.add_all(top_repo_path)
        else:
            filename = my_data["filename"]
            my_output = self.git.add(filename, top_repo_path)
        self.finish(my_output)

class Git_reset_handler(Git_handler):
    def post(self):
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]
        if(my_data["reset_all"]):
            my_output = self.git.reset_all(top_repo_path)
        else:
            filename = my_data["filename"]
            my_output = self.git.reset(filename, top_repo_path)
        self.finish(my_output)
    
class Git_checkout_handler(Git_handler):    
    def post(self):
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]
        if (my_data["checkout_branch"]):
            if(my_data["new_check"]):
                print("to create a new branch")
                my_output = self.git.checkout_new_branch(my_data["branchname"],top_repo_path)
            else:  
                print("switch to an old branch")               
                my_output = self.git.checkout_branch(my_data["branchname"],top_repo_path)        
        elif(my_data["checkout_all"]):
            my_output = self.git.checkout_all(top_repo_path)
        else:
            my_output = self.git.checkout(my_data["filename"], top_repo_path)
        self.finish(my_output)

class Git_commit_handler(Git_handler):   
    def post(self):
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]
        commit_msg = my_data["commit_msg"]
        my_output = self.git.commit(commit_msg, top_repo_path)
        self.finish(my_output)     

class Git_pull_handler(Git_handler):
    def post(self):
        my_data = json.loads(self.request.body)
        origin = my_data["origin"]
        master = my_data["master"]
        curr_fb_path = my_data["curr_fb_path"]
        my_output = self.git.pull(origin,master,curr_fb_path)
        self.finish(my_output)
        print("You Pulled")

class Git_push_handler(Git_handler):
    def post(self):
        my_data = json.loads(self.request.body)
        origin = my_data["origin"]
        master = my_data["master"]
        curr_fb_path = my_data["curr_fb_path"]
        my_output = self.git.push(origin,master,curr_fb_path)
        self.finish(my_output)
        print("You Pushed")

class Git_init_handler(Git_handler):
    def post(self):
        my_data = json.loads(self.request.body)
        curr_fb_path = my_data["curr_path"]
        my_output=self.git.init(curr_fb_path)
        print(my_output);
        self.finish(my_output)

def setup_handlers(web_app):
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
