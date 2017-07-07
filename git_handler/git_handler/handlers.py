
import os
import json
import socket
import time
import subprocess as sp
import psutil
from tornado import web
import subprocess



from notebook.utils import url_path_join
from notebook.base.handlers import IPythonHandler

def get_metrics(sample):
    return {
        'rss': 1001,
        'limits': {
            'memory': sample
        }
    }

def post_metrics():
    return {
        'rss': 5000,
        'limits': {
            'memory': 9999
        }
    }

class git_handler(IPythonHandler):
    def get(self):
        self.finish(json.dumps(post_metrics()))
        print("Hi there! get extension!!")
        
    def post(self):
        my_data = json.loads(self.request.body)
        temp = my_data["git_command"]
        print(temp)
        #my_output = subprocess.check_output(temp, cwd = os.getcwd()+'/jupyterlab-git')
        my_output = subprocess.check_output(temp)
        self.finish(my_output)
        #self.finish(json.dumps(post_metrics()))
        print("Hi there! post extensions!!")

    

        


def setup_handlers(web_app):
    route_pattern = url_path_join(web_app.settings['base_url'], '/git_handler')
    web_app.add_handlers('.*', [(route_pattern, git_handler)])
