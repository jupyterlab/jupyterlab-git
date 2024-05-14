"""Initialize the backend server extension
"""

from traitlets import CFloat, List, Dict, Unicode, default
from traitlets.config import Configurable

try:
    from ._version import __version__
except:
    import warnings

    warnings.warn(
        "Did you forget to install the extension in editable mode `pip install -e .`?"
    )
    __version__ = "dev"
from .handlers import setup_handlers
from .git import Git


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "@jupyterlab/git"}]


class JupyterLabGit(Configurable):
    """
    Config options for jupyterlab_git

    Modeled after: https://github.com/jupyter/jupyter_server/blob/9dd2a9a114c045cfd8fd8748400c6a697041f7fa/jupyter_server/serverapp.py#L1040
    """

    actions = Dict(
        help="Actions to be taken after a git command. Each action takes a list of commands to execute (strings). Supported actions: post_init",
        config=True,
        value_trait=List(
            trait=Unicode(), help='List of commands to run. E.g. ["touch baz.py"]'
        ),
        # TODO Validate
    )

    excluded_paths = List(help="Paths to be excluded", config=True, trait=Unicode())

    credential_helper = Unicode(
        help="""
            The value of Git credential helper will be set to this value when the Git credential caching mechanism is activated by this extension.
            By default it is an in-memory cache of 3600 seconds (1 hour); `cache --timeout=3600`.
        """,
        config=True,
    )

    git_command_timeout = CFloat(
        help="The timeout for executing git operations. By default it is set to 20 seconds.",
        config=True,
    )

    @default("credential_helper")
    def _credential_helper_default(self):
        return "cache --timeout=3600"

    @default("git_command_timeout")
    def _git_command_timeout_default(self):
        return 20.0


def _jupyter_server_extension_points():
    return [{"module": "jupyterlab_git"}]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    config = JupyterLabGit(config=server_app.config)
    server_app.web_app.settings["git"] = Git(config)
    setup_handlers(server_app.web_app)


# For backward compatibility
load_jupyter_server_extension = _load_jupyter_server_extension
