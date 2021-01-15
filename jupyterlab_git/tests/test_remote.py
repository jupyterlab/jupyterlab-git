import json
import subprocess
from unittest.mock import Mock, patch

import pytest
import tornado
from jupyterlab_git.handlers import GitRemoteAddHandler

from .testutils import NS, assert_http_error, maybe_future


@patch("jupyterlab_git.git.execute")
async def test_git_add_remote_success_no_name(mock_execute, jp_fetch):
    # Given
    path = "test_path"
    url = "http://github.com/myid/myrepository.git"
    mock_execute.return_value = maybe_future((0, "", ""))

    # When
    body = {
        "top_repo_path": path,
        "url": url,
    }
    response = await jp_fetch(NS, "remote", "add", body=json.dumps(body), method="POST")

    # Then
    command = ["git", "remote", "add", "origin", url]
    mock_execute.assert_called_once_with(command, cwd=path)

    assert response.code == 201
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "command": " ".join(command),
    }


@patch("jupyterlab_git.git.execute")
async def test_git_add_remote_success(mock_execute, jp_fetch):
    # Given
    path = "test_path"
    url = "http://github.com/myid/myrepository.git"
    name = "distant"
    mock_execute.return_value = maybe_future((0, "", ""))

    # When
    body = {"top_repo_path": path, "url": url, "name": name}
    response = await jp_fetch(NS, "remote", "add", body=json.dumps(body), method="POST")

    # Then
    command = ["git", "remote", "add", name, url]
    mock_execute.assert_called_once_with(command, cwd=path)

    assert response.code == 201
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "command": " ".join(command),
    }


@patch("jupyterlab_git.git.execute")
async def test_git_add_remote_failure(mock_execute, jp_fetch):
    # Given
    path = "test_path"
    url = "http://github.com/myid/myrepository.git"
    error_msg = "Fake failure"
    error_code = 128
    mock_execute.return_value = maybe_future((error_code, "", error_msg))

    # When
    body = {
        "top_repo_path": path,
        "url": url,
    }

    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        await jp_fetch(NS, "remote", "add", body=json.dumps(body), method="POST")
    assert_http_error(e, 500)

    # Then
    mock_execute.assert_called_once_with(
        ["git", "remote", "add", "origin", url], cwd=path
    )
