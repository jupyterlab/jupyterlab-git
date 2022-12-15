from pathlib import Path
from unittest.mock import MagicMock

import pytest
import tornado
from jupyter_server.services.contents.largefilemanager import LargeFileManager

from jupyterlab_git.handlers import GitHandler


pytest.importorskip("hybridcontents")
# FIXME requires hybridcontents update to Jupyter Server 2
pytestmark = pytest.mark.skipif(
    True, reason="hybridcontents is not compatible with Jupyter Server 2"
)


@pytest.fixture
def jp_server_config(jp_server_config, tmp_path):
    main = tmp_path / "main"
    main.mkdir()
    second = tmp_path / "second"
    second.mkdir()
    return {
        "ServerApp": {
            "jpserver_extensions": {"jupyterlab_git": True},
            "contents_manager_class": "hybridcontents.HybridContentsManager",
        },
        "HybridContentsManager": {
            "manager_classes": {
                "": LargeFileManager,
                "directory": LargeFileManager,
            },
            "manager_kwargs": {
                "": {"root_dir": str(main)},
                "directory": {"root_dir": str(second)},
            },
        },
    }


@pytest.mark.parametrize(
    "path, with_cm",
    (
        ("urlf", False),
        ("url/to/path", False),
        ("url/to/path", True),
        ("directory/url/to/path", False),
        ("directory/url/to/path", True),
    ),
)
def test_hybridcontents_url2localpath(path, with_cm, jp_web_app, tmp_path):
    if path.startswith("directory"):
        fullpath = tmp_path / "second" / Path(path).relative_to("directory")
    else:
        fullpath = tmp_path / "main" / path
    fullpath.parent.mkdir(parents=True, exist_ok=True)
    fullpath.touch()

    req = tornado.httputil.HTTPServerRequest()
    req.connection = MagicMock()
    handler = GitHandler(jp_web_app, req)
    out = handler.url2localpath(path, with_cm)
    if with_cm:
        p = out[0]
        assert out[1] != handler.contents_manager
        assert isinstance(out[1], LargeFileManager)
    else:
        p = out

    assert str(fullpath) == p
