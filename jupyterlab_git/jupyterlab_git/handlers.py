
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
        top_repo_path = my_data["top_repo_path"]
        result = self.git.log(top_repo_path)
        self.finish(json.dumps(result))

class Git_diff_handler(Git_handler):
    def post(self):
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]
        my_output = self.git.diff(top_repo_path)
        self.finish(my_output)
        print("GIT DIFF")
        print(my_output)


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
            print(filename)
            print(top_repo_path)
            my_output = self.git.add(filename, top_repo_path)
        self.finish(my_output)
        print("Hi there! git add handler!!")

class Git_reset_handler(Git_handler):
    def post(self):
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]
        if(my_data["reset_all"]):
            my_output = self.git.reset_all(top_repo_path)
        else:
            filename = my_data["filename"]

            print(filename)
            print(top_repo_path)

            my_output = self.git.reset(filename, top_repo_path)
        self.finish(my_output)
        print("Hi there! git reset handler!!")
    
class Git_checkout_handler(Git_handler):    
    def post(self):
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]        
        if(my_data["checkout_all"]):
            my_output = self.git.checkout_all(top_repo_path)
        else:
            filename = my_data["filename"]

            print(filename)
            print(top_repo_path)

            my_output = self.git.checkout(filename, top_repo_path)
        self.finish(my_output)
        print("Hi there! git checkout handler!!")

class Git_commit_handler(Git_handler):   
    def post(self):
        my_data = json.loads(self.request.body)
        top_repo_path = my_data["top_repo_path"]
        commit_msg = my_data["commit_msg"]
        my_output = self.git.commit(commit_msg, top_repo_path)
        self.finish(my_output)
        print("Hi there! git commit handler!!")   

class Git_pull_handler(Git_handler):
    def post(self):
        my_data = json.loads(self.request.body)
        origin = my_data["origin"]
        master = my_data["master"]
        top_repo_path = my_data["top_repo_path"]
        my_output = self.git.pull(origin,master,top_repo_path)
        self.finish(my_output)
        print("You Pull")

class Git_push_handler(Git_handler):
    def post(self):
        my_data = json.loads(self.request.body)
        origin = my_data["origin"]
        master = my_data["master"]
        top_repo_path = my_data["top_repo_path"]
        my_output = self.git.push(origin,master,top_repo_path)
        self.finish(my_output)
        print("You Pushed")
             





def setup_handlers(web_app):
    web_app.add_handlers('.*', [('/git/showtoplevel', Git_showtoplevel_handler)])
    web_app.add_handlers('.*', [('/git/showprefix', Git_showprefix_handler)])
    web_app.add_handlers('.*', [('/git/add', Git_add_handler)])
    web_app.add_handlers('.*', [('/git/status', Git_status_handler)])
    web_app.add_handlers('.*', [('/git/reset', Git_reset_handler)])
    web_app.add_handlers('.*', [('/git/checkout', Git_checkout_handler)])
    web_app.add_handlers('.*', [('/git/commit', Git_commit_handler)])
    web_app.add_handlers('.*', [('/git/pull', Git_pull_handler)])
    web_app.add_handlers('.*', [('/git/push', Git_push_handler)])
    web_app.add_handlers('.*', [('/git/diff', Git_diff_handler)])
    web_app.add_handlers('.*', [('/git/log', Git_log_handler)])
