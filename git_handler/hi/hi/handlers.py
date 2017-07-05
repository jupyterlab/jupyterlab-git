
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

class hi(IPythonHandler):
    def get(self):
        self.finish(json.dumps(post_metrics()))
        print("Hi there! get extension!!")
        
    def post(self):
        my_data = json.loads(self.request.body)
        temp = my_data["git_command"]
<<<<<<< HEAD
        print(temp)
        my_output = subprocess.check_output(temp)
        #my_output = subprocess.check_output(["git", temp])
=======
        print(temp+"hahahaha")
        my_output = subprocess.check_output(["git", temp])
>>>>>>> 031de4ba54da64ac3661b65f1352829178560f03
        self.finish(my_output)
        #self.finish(json.dumps(post_metrics()))
        print("Hi there! post extensions!!")

    

        


def setup_handlers(web_app):
    route_pattern = url_path_join(web_app.settings['base_url'], '/hi')
    web_app.add_handlers('.*', [(route_pattern, hi)])
