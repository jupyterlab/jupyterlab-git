"""
Initialize the backend server extension
"""
from jupyterlab_git.handlers import setup_handlers
from jupyterlab_git.git import Git


def _jupyter_server_extension_paths():
    """
    Declare the Jupyter server extension paths.
    """
    return [{"module": "jupyterlab_git"}]


def load_jupyter_server_extension(nbapp):
    """
    Load the Jupyter server extension.
    """
    git = Git(nbapp.web_app.settings['contents_manager'])
    nbapp.web_app.settings["git"] = git
    setup_handlers(nbapp.web_app)
