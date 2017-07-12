
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



class git_handler(APIHandler):
    @property
    def git(self):
        return self.settings['git']
    

class git_status_handler(git_handler):
    def get(self):
        print("Hi there! get extensions!!")
        
    def post(self):
        result = []
        my_data = json.loads(self.request.body)
        current_path = my_data["current_path"]
        my_output = self.git._status(current_path)   
        line_array = my_output.decode('utf-8').splitlines()
        for line in line_array:
            result.append({'x':line[0],'y':line[1],'to':line[3:],'from':None})
        self.finish(json.dumps(result))



class git_add_handler(git_handler):
    def post(self):
        my_data = json.loads(self.request.body)
        if(my_data["Add_all"]):
            my_output = self.git._add_all()
        else:
            filename = my_data["Filename"]
            my_output = self.git._add(filename)
        self.finish(my_output)
        print("Hi there! post extensions!!")

class git_reset_handler(git_handler):
    def post(self):
        my_data = json.loads(self.request.body)
        if(my_data["Reset_all"]):
            my_output = self.git._reset_all()
        else:
            filename = my_data["Filename"]
            my_output = self.git._reset(filename)
        self.finish(my_output)
        print("Hi there! post extensions!!")
    
class git_checkout_handler(git_handler):    
    def post(self):
        my_data = json.loads(self.request.body)
        if(my_data["Checkout_all"]):
            my_output = self.git._checkout_all()
        else:
            filename = my_data["Filename"]
            my_output = self.git._checkout(filename)
        self.finish(my_output)
        print("Hi there! post extensions!!")

class git_commit_handler(git_handler):   
    def post(self):
        my_data = json.loads(self.request.body)
        commit_msg = my_data["Commit_msg"]
        my_output = self.git._commit(commit_msg)
        self.finish(my_output)
        print("Hi there! post extensions!!")        


def setup_handlers(web_app):
    web_app.add_handlers('.*', [('/git/add', git_add_handler)])
    web_app.add_handlers('.*', [('/git/status', git_status_handler)])
    web_app.add_handlers('.*', [('/git/reset', git_reset_handler)])
    web_app.add_handlers('.*', [('/git/checkout', git_checkout_handler)])
    web_app.add_handlers('.*', [('/git/commit', git_commit_handler)])
