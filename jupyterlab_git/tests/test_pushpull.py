import os
from unittest.mock import Mock, call, patch

import pytest
import tornado

from jupyterlab_git.git import Git

from .testutils import FakeContentManager, maybe_future


@pytest.mark.asyncio
async def test_git_pull_fail():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            mock_execute.return_value = maybe_future(
                (1, "output", "Authentication failed")
            )

            # When
            actual_response = await Git(FakeContentManager("/bin")).pull(
                "test_curr_path"
            )

            # Then
            mock_execute.assert_called_once_with(
                ["git", "pull", "--no-commit"],
                cwd=os.path.join("/bin", "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
            )
            assert {"code": 1, "message": "Authentication failed"} == actual_response


@pytest.mark.asyncio
async def test_git_pull_with_conflict_fail():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            mock_execute.return_value = maybe_future(
                (
                    1,
                    "",
                    "Automatic merge failed; fix conflicts and then commit the result.",
                )
            )

            # When
            actual_response = await Git(FakeContentManager("/bin")).pull(
                "test_curr_path"
            )

            # Then
            mock_execute.assert_has_calls(
                [
                    call(
                        ["git", "pull", "--no-commit"],
                        cwd="/bin/test_curr_path",
                        env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
                    )
                ]
            )
            assert {
                "code": 1,
                "message": "Automatic merge failed; fix conflicts and then commit the result.",
            } == actual_response


@pytest.mark.asyncio
async def test_git_pull_with_auth_fail():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute_with_authentication:
            # Given
            mock_execute_with_authentication.return_value = maybe_future(
                (
                    1,
                    "",
                    "remote: Invalid username or password.\r\nfatal: Authentication failed for 'repo_url'",
                )
            )

            # When
            auth = {"username": "asdf", "password": "qwerty"}
            actual_response = await Git(FakeContentManager("/bin")).pull(
                "test_curr_path", auth
            )

            # Then
            mock_execute_with_authentication.assert_called_once_with(
                ["git", "pull", "--no-commit"],
                username="asdf",
                password="qwerty",
                cwd=os.path.join("/bin", "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
            )
            assert {
                "code": 1,
                "message": "remote: Invalid username or password.\r\nfatal: Authentication failed for 'repo_url'",
            } == actual_response


@pytest.mark.asyncio
async def test_git_pull_success():

    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            output = "output"
            mock_execute.return_value = maybe_future((0, output, ""))

            # When
            actual_response = await Git(FakeContentManager("/bin")).pull(
                "test_curr_path"
            )

            # Then
            mock_execute.assert_called_once_with(
                ["git", "pull", "--no-commit"],
                cwd=os.path.join("/bin", "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
            )
            assert {"code": 0, "message": output} == actual_response


@pytest.mark.asyncio
async def test_git_pull_with_auth_success():

    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute_with_authentication:
            # Given
            output = "output"
            mock_execute_with_authentication.return_value = maybe_future(
                (0, output, "")
            )

            # When
            auth = {"username": "asdf", "password": "qwerty"}
            actual_response = await Git(FakeContentManager("/bin")).pull(
                "test_curr_path", auth
            )

            # Then
            mock_execute_with_authentication.assert_called_once_with(
                ["git", "pull", "--no-commit"],
                username="asdf",
                password="qwerty",
                cwd=os.path.join("/bin", "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
            )
            assert {"code": 0, "message": output} == actual_response


@pytest.mark.asyncio
async def test_git_pull_with_auth_success_and_conflict_fail():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute_with_authentication:
            # Given
            mock_execute_with_authentication.return_value = maybe_future(
                (
                    1,
                    "output",
                    "Automatic merge failed; fix conflicts and then commit the result.",
                )
            )

            # When
            auth = {"username": "asdf", "password": "qwerty"}
            actual_response = await Git(FakeContentManager("/bin")).pull(
                "test_curr_path", auth
            )

            # Then
            mock_execute_with_authentication.assert_has_calls(
                [
                    call(
                        ["git", "pull", "--no-commit"],
                        cwd="/bin/test_curr_path",
                        env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
                        username="asdf",
                        password="qwerty",
                    )
                ]
            )
            assert {
                "code": 1,
                "message": "Automatic merge failed; fix conflicts and then commit the result.",
            } == actual_response


@pytest.mark.asyncio
async def test_git_push_fail():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            mock_execute.return_value = maybe_future(
                (1, "output", "Authentication failed")
            )

            # When
            actual_response = await Git(FakeContentManager("/bin")).push(
                "test_origin", "HEAD:test_master", "test_curr_path"
            )

            # Then
            mock_execute.assert_called_once_with(
                ["git", "push", "test_origin", "HEAD:test_master"],
                cwd=os.path.join("/bin", "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
            )
            assert {"code": 1, "message": "Authentication failed"} == actual_response


@pytest.mark.asyncio
async def test_git_push_with_auth_fail():

    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute_with_authentication:
            # Given
            mock_execute_with_authentication.return_value = maybe_future(
                (
                    1,
                    "",
                    "remote: Invalid username or password.\r\nfatal: Authentication failed for 'repo_url'",
                )
            )

            # When
            auth = {"username": "asdf", "password": "qwerty"}
            actual_response = await Git(FakeContentManager("/bin")).push(
                "test_origin", "HEAD:test_master", "test_curr_path", auth
            )

            # Then
            mock_execute_with_authentication.assert_called_once_with(
                ["git", "push", "test_origin", "HEAD:test_master"],
                username="asdf",
                password="qwerty",
                cwd=os.path.join("/bin", "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
            )
            assert {
                "code": 1,
                "message": "remote: Invalid username or password.\r\nfatal: Authentication failed for 'repo_url'",
            } == actual_response


@pytest.mark.asyncio
async def test_git_push_success():

    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            output = "output"
            mock_execute.return_value = maybe_future((0, output, "does not matter"))

            # When
            actual_response = await Git(FakeContentManager("/bin")).push(
                ".", "HEAD:test_master", "test_curr_path"
            )

            # Then
            mock_execute.assert_called_once_with(
                ["git", "push", ".", "HEAD:test_master"],
                cwd=os.path.join("/bin", "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
            )
            assert {"code": 0, "message": output} == actual_response


@pytest.mark.asyncio
async def test_git_push_with_auth_success():

    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute_with_authentication:
            # Given
            output = "output"
            mock_execute_with_authentication.return_value = maybe_future(
                (0, output, "does not matter")
            )

            # When
            auth = {"username": "asdf", "password": "qwerty"}
            actual_response = await Git(FakeContentManager("/bin")).push(
                ".", "HEAD:test_master", "test_curr_path", auth
            )

            # Then
            mock_execute_with_authentication.assert_called_once_with(
                ["git", "push", ".", "HEAD:test_master"],
                username="asdf",
                password="qwerty",
                cwd=os.path.join("/bin", "test_curr_path"),
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
            )
            assert {"code": 0, "message": output} == actual_response
