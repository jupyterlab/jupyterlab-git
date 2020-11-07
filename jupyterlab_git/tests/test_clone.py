import os
from unittest.mock import Mock, call, patch

import pytest
import tornado

from jupyterlab_git.git import Git

from .testutils import FakeContentManager, maybe_future


@pytest.mark.asyncio
async def test_git_clone_success():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            output = "output"
            mock_execute.return_value = maybe_future((0, output, "error"))

            # When
            actual_response = await Git(FakeContentManager("/bin")).clone(
                current_path="test_curr_path", repo_url="ghjkhjkl"
            )

            # Then
            mock_execute.assert_called_once_with(
                ["git", "clone", "ghjkhjkl"],
                cwd=os.path.join("/bin", "test_curr_path"),
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
            actual_response = await Git(FakeContentManager("/bin")).clone(
                current_path="test_curr_path", repo_url="ghjkhjkl"
            )

            # Then
            mock_execute.assert_called_once_with(
                ["git", "clone", "ghjkhjkl"],
                cwd=os.path.join("/bin", "test_curr_path"),
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
            actual_response = await Git(FakeContentManager("/bin")).clone(
                current_path="test_curr_path", repo_url="ghjkhjkl", auth=auth
            )

            # Then
            mock_authentication.assert_called_once_with(
                ["git", "clone", "ghjkhjkl", "-q"],
                username="asdf",
                password="qwerty",
                cwd=os.path.join("/bin", "test_curr_path"),
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
            actual_response = await Git(FakeContentManager("/bin")).clone(
                current_path="test_curr_path", repo_url="ghjkhjkl", auth=auth
            )

            # Then
            mock_authentication.assert_called_once_with(
                ["git", "clone", "ghjkhjkl", "-q"],
                username="asdf",
                password="qwerty",
                cwd=os.path.join("/bin", "test_curr_path"),
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
            actual_response = await Git(FakeContentManager("/bin")).clone(
                current_path="test_curr_path", repo_url="ghjkhjkl", auth=auth
            )

            # Then
            mock_authentication.assert_called_once_with(
                ["git", "clone", "ghjkhjkl", "-q"],
                username="asdf",
                password="qwerty",
                cwd=os.path.join("/bin", "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
            )
            assert {
                "code": 128,
                "message": "remote: Invalid username or password.\r\nfatal: Authentication failed for 'ghjkhjkl'",
            } == actual_response
