"""Initialize the backend server extension
"""
# need this in order to show version in `jupyter serverextension list`
from ._version import __version__
from traitlets import List, Dict, Unicode
from traitlets.config import Configurable

from jupyterlab_git.handlers import setup_handlers
from jupyterlab_git.git import Git


class JupyterLabGit(Configurable):
    """
    Config options for jupyterlab_git

    Modeled after: https://github.com/jupyter/jupyter_server/blob/9dd2a9a114c045cfd8fd8748400c6a697041f7fa/jupyter_server/serverapp.py#L1040
    """

    actions = Dict(
        help="Actions to be taken after a git command. Each action takes a list of commands to execute (strings). Supported actions: post_init",
        config=True,
        trait=List(
            trait=Unicode(), help='List of commands to run. E.g. ["touch baz.py"]'
        )
        # TODO Validate
    )


def _jupyter_server_extension_paths():
    """Declare the Jupyter server extension paths."""
    return [{"module": "jupyterlab_git"}]


def load_jupyter_server_extension(nbapp):
    """Load the Jupyter server extension."""

    config = JupyterLabGit(config=nbapp.config)
    git = Git(nbapp.web_app.settings["contents_manager"], config)
    nbapp.web_app.settings["git"] = git
    setup_handlers(nbapp.web_app)
