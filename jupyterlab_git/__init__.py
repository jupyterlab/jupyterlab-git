"""Initialize the backend server extension
"""
# need this in order to show version in `jupyter serverextension list`
from ._version import __version__
from traitlets import Type
from traitlets.config import Configurable

from jupyterlab_git.handlers import setup_handlers
from jupyterlab_git.git import Git

class GitCustomActions(object):
    """
    Class to handle custom actions. This is a base class that is expected to be replaced via the jupyter_notebook_config
    """

    async def post_init(self, cwd):
        """
        :param cwd: Directory where git init was run
        """
        pass

class JupyterLabGitConfig(Configurable):
    """
    Config options for jupyterlab_git

    Modeled after: https://github.com/jupyter/jupyter_server/blob/9dd2a9a114c045cfd8fd8748400c6a697041f7fa/jupyter_server/serverapp.py#L1040
    """

    # See: https://traitlets.readthedocs.io/en/stable/trait_types.html#classes-and-instances
    custom_git_actions_class = Type(
        default_value=GitCustomActions,
        config=True,
        help='Delegate custom git actions'
    )

def _jupyter_server_extension_paths():
    """Declare the Jupyter server extension paths.
    """
    return [{"module": "jupyterlab_git"}]


def load_jupyter_server_extension(nbapp):
    """Load the Jupyter server extension.
    """

    user_custom_actions = JupyterLabGitConfig(config=nbapp.config).custom_git_actions_class()
    git = Git(nbapp.web_app.settings['contents_manager'], user_custom_actions)
    nbapp.web_app.settings["git"] = git
    setup_handlers(nbapp.web_app)
