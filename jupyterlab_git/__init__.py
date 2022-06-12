"""Initialize the backend server extension
"""

import json
from pathlib import Path

from traitlets import List, Dict, Unicode, default
from traitlets.config import Configurable

from ._version import __version__
from .handlers import setup_handlers
from .git import Git

HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": data["name"]}]


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
        )
        # TODO Validate
    )

    credential_helper = Unicode(
        help="""
            The value of Git credential helper will be set to this value when the Git credential caching mechanism is activated by this extension.
            By default it is an in-memory cache of 3600 seconds (1 hour); `cache --timeout=3600`.
        """,
        config=True,
    )

    @default("credential_helper")
    def _credential_helper_default(self):
        return "cache --timeout=3600"


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
