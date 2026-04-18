try:
    from ._version import __version__
except ImportError:
    __version__ = "dev"


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "@jupyterlab/git"}]
