import os
from unittest.mock import call, patch

import pytest

from jupyterlab_git import JupyterLabGit
from jupyterlab_git.git import Git

from .testutils import maybe_future


@pytest.mark.asyncio
async def test_git_fetch_success():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future((0, "", ""))

        # When
        actual_response = await Git().fetch(path="test_path")

        # Then
        mock_execute.assert_called_once_with(
            ["git", "fetch", "--all", "--prune"],
            cwd="test_path",
            env={**os.environ, "GIT_TERMINAL_PROMPT": "0"},
        )
        assert {"code": 0} == actual_response


@pytest.mark.asyncio
async def test_git_fetch_fail():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future((1, "", "error"))

        # When
        actual_response = await Git().fetch(path="test_path")

        # Then
        mock_execute.assert_called_once_with(
            ["git", "fetch", "--all", "--prune"],
            cwd="test_path",
            env={**os.environ, "GIT_TERMINAL_PROMPT": "0"},
        )
        assert {
            "code": 1,
            "command": "git fetch --all --prune",
            "error": "error",
        } == actual_response


@pytest.mark.asyncio
async def test_git_fetch_with_auth_success():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future((0, "", ""))

        # When
        actual_response = await Git().fetch(
            path="test_path", auth={"username": "test_user", "password": "test_pass"}
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "fetch", "--all", "--prune"],
            username="test_user",
            password="test_pass",
            cwd="test_path",
            env={**os.environ, "GIT_TERMINAL_PROMPT": "1"},
        )
        assert {"code": 0} == actual_response


@pytest.mark.asyncio
async def test_git_fetch_with_auth_fail():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future(
            (
                128,
                "",
                "remote: Invalid username or password.\r\nfatal: Authentication failed for 'test_repo'",
            )
        )

        # When
        actual_response = await Git().fetch(
            path="test_path", auth={"username": "test_user", "password": "test_pass"}
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "fetch", "--all", "--prune"],
            username="test_user",
            password="test_pass",
            cwd="test_path",
            env={**os.environ, "GIT_TERMINAL_PROMPT": "1"},
        )
        assert {
            "code": 128,
            "command": "git fetch --all --prune",
            "error": "remote: Invalid username or password.\r\nfatal: Authentication failed for 'test_repo'",
        } == actual_response


@pytest.mark.asyncio
async def test_git_fetch_with_cache_credentials():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future((0, "", ""))

        # When
        actual_response = await Git().fetch(path="test_path", cache_credentials=True)

        # Then
        mock_execute.assert_called_once_with(
            ["git", "fetch", "--all", "--prune"],
            cwd="test_path",
            env={**os.environ, "GIT_TERMINAL_PROMPT": "0"},
        )
        assert {"code": 0} == actual_response


@pytest.mark.asyncio
async def test_git_fetch_with_auth_and_cache_credentials():
    with patch("jupyterlab_git.git.execute") as mock_authentication:
        # Given
        default_config = JupyterLabGit()
        credential_helper = default_config.credential_helper
        test_path = "test_path"
        mock_authentication.side_effect = [
            maybe_future((0, "", "")),
            maybe_future((0, "", "")),
            maybe_future((0, "", "")),
        ]
        # When
        actual_response = await Git(config=default_config).fetch(
            path=test_path,
            auth={"username": "test_user", "password": "test_pass"},
            cache_credentials=True,
        )

        # Then
        assert mock_authentication.call_count == 3
        mock_authentication.assert_has_calls(
            [
                call(["git", "config", "--list"], cwd=test_path),
                call(
                    ["git", "config", "--add", "credential.helper", credential_helper],
                    cwd=test_path,
                ),
                call(
                    ["git", "fetch", "--all", "--prune"],
                    username="test_user",
                    password="test_pass",
                    cwd=test_path,
                    env={**os.environ, "GIT_TERMINAL_PROMPT": "1"},
                ),
            ]
        )
        assert {"code": 0} == actual_response


@pytest.mark.asyncio
async def test_git_fetch_with_auth_and_cache_credentials_and_existing_credential_helper():
    with patch("jupyterlab_git.git.execute") as mock_authentication:
        # Given
        default_config = JupyterLabGit()
        test_path = "test_path"
        mock_authentication.side_effect = [
            maybe_future((0, "credential.helper=something", "")),
            maybe_future((0, "", "")),
        ]
        # When
        actual_response = await Git(config=default_config).fetch(
            path="test_path",
            auth={"username": "test_user", "password": "test_pass"},
            cache_credentials=True,
        )

        # Then
        assert mock_authentication.call_count == 2
        mock_authentication.assert_has_calls(
            [
                call(["git", "config", "--list"], cwd=test_path),
                call(
                    ["git", "fetch", "--all", "--prune"],
                    username="test_user",
                    password="test_pass",
                    cwd=test_path,
                    env={**os.environ, "GIT_TERMINAL_PROMPT": "1"},
                ),
            ]
        )
        assert {"code": 0} == actual_response
