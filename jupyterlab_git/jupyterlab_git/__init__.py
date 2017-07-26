from jupyterlab_git.handlers import setup_handlers
from jupyterlab_git.git_class import Git
# Jupyter Extension points
def _jupyter_server_extension_paths():
    return [{
        'module': 'jupyterlab_git',
    }]

def _jupyter_nbextension_paths():
    return [{
        "section": "notebook",
        "dest": "jupyterlab_git",
        "src": "static",
        "require": "jupyterlab_git/one"
    }]

def load_jupyter_server_extension(nbapp):
    git = Git()
    nbapp.web_app.settings['git'] = git
    setup_handlers(nbapp.web_app)
