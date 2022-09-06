import pytest

pytest_plugins = ["jupyter_server.pytest_plugin"]


@pytest.fixture
def jp_server_config(jp_server_config, jp_root_dir):
    return {
        "ServerApp": {"jpserver_extensions": {"jupyterlab_git": True}},
        "JupyterLabGit": {"excluded_paths": ["/ignored-path/*"]},
    }
