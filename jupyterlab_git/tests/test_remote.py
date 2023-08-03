import json
from unittest.mock import patch
import os
import pytest
import tornado

from jupyterlab_git.git import Git
from jupyterlab_git.handlers import NAMESPACE
from .testutils import assert_http_error, maybe_future


@patch("jupyterlab_git.git.execute")
async def test_git_add_remote_success_no_name(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    url = "http://github.com/myid/myrepository.git"
    mock_execute.return_value = maybe_future((0, "", ""))

    # When
    body = {
        "url": url,
    }
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "remote",
        "add",
        body=json.dumps(body),
        method="POST",
    )

    # Then
    command = ["git", "remote", "add", "origin", url]
    mock_execute.assert_called_once_with(
        command,
        cwd=str(local_path),
        timeout=20,
        env=None,
        username=None,
        password=None,
        is_binary=False,
    )

    assert response.code == 201
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "command": " ".join(command),
    }


@patch("jupyterlab_git.git.execute")
async def test_git_add_remote_success(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    url = "http://github.com/myid/myrepository.git"
    name = "distant"
    mock_execute.return_value = maybe_future((0, "", ""))

    # When
    body = {"url": url, "name": name}
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "remote",
        "add",
        body=json.dumps(body),
        method="POST",
    )

    # Then
    command = ["git", "remote", "add", name, url]
    mock_execute.assert_called_once_with(
        command,
        cwd=str(local_path),
        timeout=20,
        env=None,
        username=None,
        password=None,
        is_binary=False,
    )

    assert response.code == 201
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "command": " ".join(command),
    }


@patch("jupyterlab_git.git.execute")
async def test_git_add_remote_failure(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    url = "http://github.com/myid/myrepository.git"
    error_msg = "Fake failure"
    error_code = 128
    mock_execute.return_value = maybe_future((error_code, "", error_msg))

    # When
    body = {
        "url": url,
    }

    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        await jp_fetch(
            NAMESPACE,
            local_path.name,
            "remote",
            "add",
            body=json.dumps(body),
            method="POST",
        )
    assert_http_error(e, 500)

    # Then
    mock_execute.assert_called_once_with(
        ["git", "remote", "add", "origin", url],
        cwd=str(local_path),
        timeout=20,
        env=None,
        username=None,
        password=None,
        is_binary=False,
    )


@patch("jupyterlab_git.git.execute")
async def test_git_remote_show(mock_execute, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_execute.return_value = maybe_future(
        (0, os.linesep.join(["origin", "test"]), "")
    )

    # When
    output = await Git().remote_show(str(local_path), False)

    # Then
    command = ["git", "remote", "show"]
    mock_execute.assert_called_once_with(
        command,
        cwd=str(local_path),
        timeout=20,
        env=None,
        username=None,
        password=None,
        is_binary=False,
    )
    assert output == {
        "code": 0,
        "command": " ".join(command),
        "remotes": ["origin", "test"],
    }


@patch("jupyterlab_git.git.execute")
async def test_git_remote_show_verbose(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    url = "http://github.com/myid/myrepository.git"
    process_output = os.linesep.join(
        [f"origin\t{url} (fetch)", f"origin\t{url} (push)"]
    )
    mock_execute.return_value = maybe_future((0, process_output, ""))

    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "remote",
        "show",
        method="GET",
    )

    # Then
    command = ["git", "remote", "-v", "show"]
    mock_execute.assert_called_once_with(
        command,
        cwd=str(local_path),
        timeout=20,
        env=None,
        username=None,
        password=None,
        is_binary=False,
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "command": " ".join(command),
        "remotes": [
            {"name": "origin", "url": "http://github.com/myid/myrepository.git"}
        ],
    }


@patch("jupyterlab_git.git.execute")
async def test_git_remote_remove(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_execute.return_value = maybe_future((0, "", ""))

    # When
    name = "origin"
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "remote",
        name,
        method="DELETE",
    )

    # Then
    command = ["git", "remote", "remove", name]
    mock_execute.assert_called_once_with(
        command,
        cwd=str(local_path),
        timeout=20,
        env=None,
        username=None,
        password=None,
        is_binary=False,
    )

    assert response.code == 204
