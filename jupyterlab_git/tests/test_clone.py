import os
from pathlib import Path
from unittest.mock import call, patch

import pytest

from jupyterlab_git import JupyterLabGit
from jupyterlab_git.git import Git

from .testutils import maybe_future


@pytest.mark.asyncio
async def test_git_clone_success():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            output = "output"
            mock_execute.return_value = maybe_future((0, output, "error"))

            # When
            actual_response = await Git().clone(
                path=str(Path("/bin/test_curr_path")), repo_url="ghjkhjkl"
            )

            # Then
            mock_execute.assert_called_once_with(
                ["git", "clone", "ghjkhjkl"],
                cwd=str(Path("/bin") / "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
            )
            assert {"code": 0, "message": output} == actual_response


@pytest.mark.asyncio
async def test_git_clone_failure_from_git():
    """
    Git internally will throw an error if it is an invalid URL, or if there is a permissions issue. We want to just
    relay it back to the user.

    """
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            mock_execute.return_value = maybe_future(
                (128, "test_output", "fatal: Not a git repository")
            )

            # When
            actual_response = await Git().clone(
                path=str(Path("/bin/test_curr_path")), repo_url="ghjkhjkl"
            )

            # Then
            mock_execute.assert_called_once_with(
                ["git", "clone", "ghjkhjkl"],
                cwd=str(Path("/bin") / "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
            )
            assert {
                "code": 128,
                "message": "fatal: Not a git repository",
            } == actual_response


@pytest.mark.asyncio
async def test_git_clone_with_auth_success():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_authentication:
            # Given
            output = "output"
            mock_authentication.return_value = maybe_future((0, output, ""))

            # When
            auth = {"username": "asdf", "password": "qwerty"}
            actual_response = await Git().clone(
                path=str(Path("/bin/test_curr_path")), repo_url="ghjkhjkl", auth=auth
            )

            # Then
            mock_authentication.assert_called_once_with(
                ["git", "clone", "ghjkhjkl", "-q"],
                username="asdf",
                password="qwerty",
                cwd=str(Path("/bin") / "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
            )
            assert {"code": 0, "message": output} == actual_response


@pytest.mark.asyncio
async def test_git_clone_with_auth_wrong_repo_url_failure_from_git():
    """
    Git internally will throw an error if it is an invalid URL, or if there is a permissions issue. We want to just
    relay it back to the user.

    """
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_authentication:
            # Given
            mock_authentication.return_value = maybe_future(
                (128, "", "fatal: repository 'ghjkhjkl' does not exist")
            )

            # When
            auth = {"username": "asdf", "password": "qwerty"}
            actual_response = await Git().clone(
                path=str(Path("/bin/test_curr_path")), repo_url="ghjkhjkl", auth=auth
            )

            # Then
            mock_authentication.assert_called_once_with(
                ["git", "clone", "ghjkhjkl", "-q"],
                username="asdf",
                password="qwerty",
                cwd=str(Path("/bin") / "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
            )
            assert {
                "code": 128,
                "message": "fatal: repository 'ghjkhjkl' does not exist",
            } == actual_response


@pytest.mark.asyncio
async def test_git_clone_with_auth_auth_failure_from_git():
    """
    Git internally will throw an error if it is an invalid URL, or if there is a permissions issue. We want to just
    relay it back to the user.

    """
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_authentication:
            # Given
            mock_authentication.return_value = maybe_future(
                (
                    128,
                    "",
                    "remote: Invalid username or password.\r\nfatal: Authentication failed for 'ghjkhjkl'",
                )
            )

            # When
            auth = {"username": "asdf", "password": "qwerty"}
            actual_response = await Git().clone(
                path=str(Path("/bin/test_curr_path")), repo_url="ghjkhjkl", auth=auth
            )

            # Then
            mock_authentication.assert_called_once_with(
                ["git", "clone", "ghjkhjkl", "-q"],
                username="asdf",
                password="qwerty",
                cwd=str(Path("/bin") / "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
            )
            assert {
                "code": 128,
                "message": "remote: Invalid username or password.\r\nfatal: Authentication failed for 'ghjkhjkl'",
            } == actual_response


@pytest.mark.asyncio
async def test_git_clone_with_auth_and_cache_credentials():
    with patch(
        "jupyterlab_git.git.Git.ensure_git_credential_cache_daemon"
    ) as mock_ensure_daemon:
        mock_ensure_daemon.return_value = 0
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            default_config = JupyterLabGit()
            default_config.credential_helper = "cache"
            credential_helper = default_config.credential_helper
            test_path = "test_curr_path"
            mock_execute.side_effect = [
                maybe_future((0, "", "")),
                maybe_future((0, "", "")),
                maybe_future((0, "", "")),
            ]
            # When
            auth = {
                "username": "asdf",
                "password": "qwerty",
                "cache_credentials": True,
            }
            actual_response = await Git(config=default_config).clone(
                path=test_path,
                repo_url="ghjkhjkl",
                auth=auth,
            )

            # Then
            assert mock_execute.call_count == 3
            mock_execute.assert_has_calls(
                [
                    call(["git", "config", "--list"], cwd=test_path),
                    call(
                        [
                            "git",
                            "config",
                            "--add",
                            "credential.helper",
                            credential_helper,
                        ],
                        cwd=test_path,
                    ),
                    call(
                        ["git", "clone", "ghjkhjkl", "-q"],
                        username="asdf",
                        password="qwerty",
                        cwd=test_path,
                        env={**os.environ, "GIT_TERMINAL_PROMPT": "1"},
                    ),
                ]
            )
            mock_ensure_daemon.assert_called_once_with(cwd=test_path, env=None)
            assert {"code": 0, "message": ""} == actual_response


@pytest.mark.asyncio
async def test_git_clone_with_auth_and_cache_credentials_and_existing_credential_helper():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        default_config = JupyterLabGit()
        test_path = str(Path("/bin") / "test_curr_path")
        mock_execute.side_effect = [
            maybe_future((0, "credential.helper=something", "")),
            maybe_future((0, "", "")),
        ]
        # When
        auth = {"username": "asdf", "password": "qwerty", "cache_credentials": True}
        actual_response = await Git(config=default_config).clone(
            path=test_path, repo_url="ghjkhjkl", auth=auth
        )

        # Then
        assert mock_execute.call_count == 2
        mock_execute.assert_has_calls(
            [
                call(["git", "config", "--list"], cwd=test_path),
                call(
                    ["git", "clone", "ghjkhjkl", "-q"],
                    username="asdf",
                    password="qwerty",
                    cwd=test_path,
                    env={**os.environ, "GIT_TERMINAL_PROMPT": "1"},
                ),
            ]
        )
        assert {"code": 0, "message": ""} == actual_response
