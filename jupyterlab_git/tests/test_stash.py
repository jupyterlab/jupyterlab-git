import json
from unittest.mock import AsyncMock
from unittest.mock import patch
import pytest
import tornado
import os
from jupyterlab_git.git import Git
from jupyterlab_git.handlers import NAMESPACE
from .testutils import assert_http_error, maybe_future
import tempfile
import shutil
import os
import subprocess

# Git Stash - POST


@patch("jupyterlab_git.git.execute")
async def test_git_stash_without_message(mock_execute, jp_fetch, jp_root_dir):
    # Given
    # Creates a temporary directory created by pytest's tmp_path fixture and concatenates the string "test_path" to it.
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"

    local_path = jp_root_dir / "test_path"
    # 0 = success code, "" = no output, "" = no error
    mock_execute.return_value = maybe_future((0, "", ""))
    # When
    #

    # jp_fetch is a fixture that returns a function that can be used to make HTTP requests to the Jupyter server.
    """
    jp_fetch(
        NAMESPACE, # NAMESPACE is the prefix of the url
        local_path.name, # local_path.name is the name of the folder
        "stash", # stash is the name of the handler
        body, empty because git stash doesn't take any arguments
        method="POST", # method is the http method
    )
    """
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "stash",
        body=json.dumps({}),
        method="POST",
    )
    # Then
    command = ["git", "stash"]
    # Checks that the mock function was called with the correct arguments
    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)

    assert response.code == 201
    # json.loads turns a string into a dictionary
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "message": "",
        "command": " ".join(command),
    }


@patch("jupyterlab_git.git.execute")
async def test_git_stash_failure(mock_execute, jp_fetch, jp_root_dir):
    # Given
    # Creates a temporary directory created by pytest's tmp_path fixture and concatenates the string "test_path" to it.
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"

    local_path = jp_root_dir / "test_path"
    error_msg = "Fake failure"
    error_code = 128

    # 0 = success code, "" = no output, "" = no error
    mock_execute.return_value = maybe_future((error_code, "", error_msg))

    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        response = await jp_fetch(
            NAMESPACE, local_path.name, "stash", body=json.dumps({}), method="POST"
        )
    assert_http_error(e, 500)

    # Then
    command = ["git", "stash"]
    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)


@patch("jupyterlab_git.git.execute")
async def test_git_stash_with_message(mock_execute, jp_fetch, jp_root_dir):
    # Given
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"

    local_path = jp_root_dir / "test_path"
    stash_message = "Custom stash message"

    # 0 = success code, "" = no output, "" = no error
    mock_execute.return_value = maybe_future((0, "", ""))

    # When
    print(f"stash_message: {stash_message}, type: {type(stash_message)}")

    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "stash",
        body=json.dumps({"stashMsg": stash_message}),
        method="POST",
    )

    # Then
    command = ["git", "stash", "save", "-m", stash_message]
    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)

    assert response.code == 201
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "message": "",
        "command": " ".join(command),
    }


# Git Stash - GET


@patch("jupyterlab_git.git.execute")
async def test_git_stash_show_with_index(mock_execute, jp_fetch, jp_root_dir):
    # Given
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    local_path = jp_root_dir / "test_path"
    stash_index = 1

    # 0 = success code, "" = no output, "" = no error
    mock_execute.return_value = maybe_future((0, "", ""))

    # When
    response = await jp_fetch(
        NAMESPACE, local_path.name, "stash", method="GET", params={"index": stash_index}
    )

    # Then
    command = [
        "git",
        "stash",
        "show",
        "-p",
        f"stash@{{{stash_index!s}}}",
        "--name-only",
    ]
    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "message": "",
        "command": " ".join(command),
    }


@patch("jupyterlab_git.git.execute")
async def test_git_stash_show_without_index(mock_execute, jp_fetch, jp_root_dir):
    # Given
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    local_path = jp_root_dir / "test_path"

    # 0 = success code, "" = no output, "" = no error
    mock_execute.return_value = maybe_future((0, "", ""))

    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "stash",
        method="GET",
    )

    # Then
    command = ["git", "stash", "list"]
    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "message": "",
        "command": " ".join(command),
    }


@patch("jupyterlab_git.git.execute")
async def test_git_stash_show_failure(mock_execute, jp_fetch, jp_root_dir):
    # Given
    # Creates a temporary directory created by pytest's tmp_path fixture and concatenates the string "test_path" to it.
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    stash_index = 1
    local_path = jp_root_dir / "test_path"
    error_msg = "Fake failure"
    error_code = 128

    # 0 = success code, "" = no output, "" = no error
    mock_execute.return_value = maybe_future((error_code, "", error_msg))

    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        response = await jp_fetch(
            NAMESPACE,
            local_path.name,
            "stash",
            params={"index": stash_index},
            method="GET",
        )
    assert_http_error(e, 500)

    # Then
    command = [
        "git",
        "stash",
        "show",
        "-p",
        f"stash@{{{stash_index!s}}}",
        "--name-only",
    ]

    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)


# Git Stash - DELETE


@patch("jupyterlab_git.git.execute")
async def test_git_stash_drop_single_success(mock_execute, jp_fetch, jp_root_dir):
    # Given
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    local_path = jp_root_dir / "test_path"
    stash_index = 1
    # 0 = success code, "" = no output, "" = no error
    mock_execute.return_value = maybe_future((0, "", ""))

    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "stash",
        method="DELETE",
        params={"stash_index": stash_index},
    )

    # Then
    command = ["git", "stash", "drop", str(stash_index)]
    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)

    assert response.code == 204


@patch("jupyterlab_git.git.execute")
async def test_git_stash_drop_single_failure(mock_execute, jp_fetch, jp_root_dir):
    # Given
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    local_path = jp_root_dir / "test_path"
    error_msg = "Fake failure"
    error_code = 128
    stash_index = 1

    mock_execute.return_value = maybe_future((error_code, "", error_msg))

    # When
    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        response = await jp_fetch(
            NAMESPACE,
            local_path.name,
            "stash",
            method="DELETE",
            params={"stash_index": stash_index},
        )

    # Then
    assert_http_error(e, 500)

    command = ["git", "stash", "drop", str(stash_index)]
    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)


@patch("jupyterlab_git.git.execute")
async def test_git_stash_drop_all_success(mock_execute, jp_fetch, jp_root_dir):
    # Given
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"

    local_path = jp_root_dir / "test_path"

    # 0 = success code, "" = no output, "" = no error
    mock_execute.return_value = maybe_future((0, "", ""))

    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "stash",
        method="DELETE",
    )

    # Then
    command = ["git", "stash", "clear"]
    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)

    assert response.code == 204


# Git Stash Apply - POST


@patch("jupyterlab_git.git.execute")
async def test_git_stash_apply_with_index(mock_execute, jp_fetch, jp_root_dir):
    # Given
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    local_path = jp_root_dir / "test_path"
    stash_index = 1
    mock_execute.return_value = maybe_future((0, "", ""))

    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "stash_apply",
        method="POST",
        body=json.dumps({"index": stash_index}),
    )

    # Then
    command = ["git", "stash", "apply", "stash@{" + str(stash_index) + "}"]
    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)

    assert response.code == 201


@patch("jupyterlab_git.git.execute")
async def test_git_stash_apply_without_index(mock_execute, jp_fetch, jp_root_dir):
    # Given
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"

    local_path = jp_root_dir / "test_path"

    # 0 = success code, "" = no output, "" = no error
    mock_execute.return_value = maybe_future((0, "", ""))

    # When
    response = await jp_fetch(
        NAMESPACE, local_path.name, "stash_apply", method="POST", body=json.dumps({})
    )

    # Then
    command = ["git", "stash", "apply"]
    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)

    assert response.code == 201


@patch("jupyterlab_git.git.execute")
async def test_git_stash_apply_failure(mock_execute, jp_fetch, jp_root_dir):
    # Given
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    local_path = jp_root_dir / "test_path"
    error_msg = "Fake failure"
    error_code = 128
    stash_index = 1

    mock_execute.return_value = maybe_future((error_code, "", error_msg))

    # When
    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        response = await jp_fetch(
            NAMESPACE,
            local_path.name,
            "stash_apply",
            method="POST",
            body=json.dumps({"index": stash_index}),
        )

    # Then
    assert_http_error(e, 500)

    command = ["git", "stash", "apply", "stash@{" + str(stash_index) + "}"]

    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)


# Git Stash Pop


@patch("jupyterlab_git.git.execute")
async def test_git_stash_pop_with_index(mock_execute, jp_fetch, jp_root_dir):
    # Given
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    local_path = jp_root_dir / "test_path"
    stash_index = 1
    # 0 = success code, "" = no output, "" = no error
    mock_execute.return_value = maybe_future((0, "", ""))
    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "stash_pop",
        body=json.dumps({"index": stash_index}),
        method="POST",
    )
    # Then
    command = ["git", "stash", "pop", str(stash_index)]
    # Checks that the mock function was called with the correct arguments
    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)

    assert response.code == 204


@patch("jupyterlab_git.git.execute")
async def test_git_stash_pop_without_index(mock_execute, jp_fetch, jp_root_dir):
    # Given
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    local_path = jp_root_dir / "test_path"
    stash_index = None
    # 0 = success code, "" = no output, "" = no error
    mock_execute.return_value = maybe_future((0, "", ""))
    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "stash_pop",
        body=json.dumps({"index": stash_index}),
        method="POST",
    )
    # Then
    command = ["git", "stash", "pop"]
    # Checks that the mock function was called with the correct arguments
    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)

    assert response.code == 204


# test_git_stash_pop_failure
@patch("jupyterlab_git.git.execute")
async def test_git_stash_pop_failure(mock_execute, jp_fetch, jp_root_dir):
    # Given
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    local_path = jp_root_dir / "test_path"
    stash_index = 1
    error_msg = "Fake failure"
    error_code = 128
    mock_execute.return_value = maybe_future((error_code, "", error_msg))

    # When
    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        response = await jp_fetch(
            NAMESPACE,
            local_path.name,
            "stash_pop",
            body=json.dumps({"index": stash_index}),
            method="POST",
        )

    # Then
    assert_http_error(e, 500)

    command = ["git", "stash", "pop", str(stash_index)]

    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)
