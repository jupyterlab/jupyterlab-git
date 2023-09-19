import json
from unittest.mock import ANY, MagicMock, Mock, call, patch

import pytest
import tornado

from jupyterlab_git.git import Git
from jupyterlab_git.handlers import NAMESPACE, setup_handlers, GitHandler

from .testutils import assert_http_error, maybe_future
from tornado.httpclient import HTTPClientError


def test_mapping_added():
    mock_web_app = Mock()
    mock_web_app.settings = {"base_url": "nb_base_url"}
    setup_handlers(mock_web_app)

    mock_web_app.add_handlers.assert_called_once_with(".*", ANY)


@pytest.mark.parametrize(
    "path, with_cm", (("url", False), ("url/to/path", False), ("url/to/path", True))
)
def test_GitHandler_url2localpath(path, with_cm, jp_web_app, jp_root_dir):
    req = tornado.httputil.HTTPServerRequest()
    req.connection = MagicMock()
    handler = GitHandler(jp_web_app, req)
    if with_cm:
        assert (
            str(jp_root_dir / path),
            handler.contents_manager,
        ) == handler.url2localpath(path, with_cm)
    else:
        assert str(jp_root_dir / path) == handler.url2localpath(path, with_cm)


@patch("jupyterlab_git.handlers.GitAllHistoryHandler.git", spec=Git)
async def test_all_history_handler_localbranch(mock_git, jp_fetch, jp_root_dir):
    # Given
    show_top_level = {"code": 0, "path": "foo"}
    branch = "branch_foo"
    log = "log_foo"
    status = "status_foo"

    local_path = jp_root_dir / "test_path"

    mock_git.show_top_level.return_value = maybe_future(show_top_level)
    mock_git.branch.return_value = maybe_future(branch)
    mock_git.log.return_value = maybe_future(log)
    mock_git.status.return_value = maybe_future(status)

    # When
    response = await jp_fetch("jupyterlab-git", "get-example")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"data": "This is /jupyterlab-git/get-example endpoint!"}
