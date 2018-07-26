"""
Module to initialize Server Extension & Notebook Extension
"""
from jupyterlab_git.handlers import setup_handlers
from jupyterlab_git.git import Git


def _jupyter_server_extension_paths():
    """
    Function to declare Jupyter Server Extension Paths.
    """
    return [{"module": "jupyterlab_git"}]


def _jupyter_nbextension_paths():
    """
    Function to declare Jupyter Notebook Extension Paths.
    """
    return [{"section": "notebook", "dest": "jupyterlab_git"}]


def load_jupyter_server_extension(nbapp):
    """
    Function to load Jupyter Server Extension.
    """
    git = Git()
    nbapp.web_app.settings["git"] = git
    setup_handlers(nbapp.web_app)
