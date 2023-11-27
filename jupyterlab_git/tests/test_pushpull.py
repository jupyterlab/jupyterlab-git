import os
from unittest.mock import call, patch

import pytest

from jupyterlab_git import JupyterLabGit
from jupyterlab_git.git import Git

from .testutils import maybe_future


@pytest.mark.asyncio
async def test_git_pull_fail():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            mock_execute.return_value = maybe_future(
                (1, "output", "Authentication failed")
            )

            # When
            actual_response = await Git().pull("test_curr_path")

            # Then
            mock_execute.assert_called_once_with(
                ["git", "pull", "--no-commit"],
                cwd="test_curr_path",
                timeout=20,
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
                username=None,
                password=None,
                is_binary=False,
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
            actual_response = await Git().pull("test_curr_path")

            # Then
            mock_execute.assert_has_calls(
                [
                    call(
                        ["git", "pull", "--no-commit"],
                        cwd="test_curr_path",
                        timeout=20,
                        env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
                        username=None,
                        password=None,
                        is_binary=False,
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
            actual_response = await Git().pull("test_curr_path", auth)

            # Then
            mock_execute_with_authentication.assert_called_once_with(
                ["git", "pull", "--no-commit"],
                cwd="test_curr_path",
                timeout=20,
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
                username="asdf",
                password="qwerty",
                is_binary=False,
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
            actual_response = await Git().pull("test_curr_path")

            # Then
            mock_execute.assert_called_once_with(
                ["git", "pull", "--no-commit"],
                cwd="test_curr_path",
                timeout=20,
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
                username=None,
                password=None,
                is_binary=False,
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
            actual_response = await Git().pull("test_curr_path", auth)

            # Then
            mock_execute_with_authentication.assert_called_once_with(
                ["git", "pull", "--no-commit"],
                cwd="test_curr_path",
                timeout=20,
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
                username="asdf",
                password="qwerty",
                is_binary=False,
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
            actual_response = await Git().pull("test_curr_path", auth)

            # Then
            mock_execute_with_authentication.assert_has_calls(
                [
                    call(
                        ["git", "pull", "--no-commit"],
                        cwd="test_curr_path",
                        timeout=20,
                        env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
                        username="asdf",
                        password="qwerty",
                        is_binary=False,
                    )
                ]
            )
            assert {
                "code": 1,
                "message": "Automatic merge failed; fix conflicts and then commit the result.",
            } == actual_response


@pytest.mark.asyncio
async def test_git_pull_with_auth_and_cache_credentials():
    with patch(
        "jupyterlab_git.git.Git.ensure_git_credential_cache_daemon"
    ) as mock_ensure_daemon:
        mock_ensure_daemon.return_value = 0
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            default_config = JupyterLabGit()
            credential_helper = default_config.credential_helper
            test_path = "test_path"
            mock_execute.side_effect = [
                maybe_future((0, "", "")),
                maybe_future((0, "", "")),
                maybe_future((0, "", "")),
            ]

            # When
            auth = {"username": "user", "password": "pass", "cache_credentials": True}
            actual_response = await Git(config=default_config).pull(test_path, auth)

            # Then
            assert mock_execute.call_count == 3
            mock_execute.assert_has_calls(
                [
                    call(
                        ["git", "config", "--list"],
                        cwd=test_path,
                        timeout=20,
                        env=None,
                        username=None,
                        password=None,
                        is_binary=False,
                    ),
                    call(
                        [
                            "git",
                            "config",
                            "--add",
                            "credential.helper",
                            credential_helper,
                        ],
                        cwd=test_path,
                        timeout=20,
                        env=None,
                        username=None,
                        password=None,
                        is_binary=False,
                    ),
                    call(
                        ["git", "pull", "--no-commit"],
                        cwd=test_path,
                        timeout=20,
                        env={**os.environ, "GIT_TERMINAL_PROMPT": "1"},
                        username="user",
                        password="pass",
                        is_binary=False,
                    ),
                ]
            )
            mock_ensure_daemon.assert_called_once_with(cwd=test_path, env=None)
            assert {"code": 0, "message": ""} == actual_response


@pytest.mark.asyncio
async def test_git_pull_with_auth_and_cache_credentials_and_existing_credential_helper():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        default_config = JupyterLabGit()
        test_path = "test_path"
        mock_execute.side_effect = [
            maybe_future((0, "credential.helper=something", "")),
            maybe_future((0, "", "")),
        ]

        # When
        auth = {"username": "user", "password": "pass", "cache_credentials": True}
        actual_response = await Git(config=default_config).pull(test_path, auth)

        # Then
        assert mock_execute.call_count == 2
        mock_execute.assert_has_calls(
            [
                call(
                    ["git", "config", "--list"],
                    cwd=test_path,
                    timeout=20,
                    env=None,
                    username=None,
                    password=None,
                    is_binary=False,
                ),
                call(
                    ["git", "pull", "--no-commit"],
                    cwd=test_path,
                    timeout=20,
                    env={**os.environ, "GIT_TERMINAL_PROMPT": "1"},
                    username="user",
                    password="pass",
                    is_binary=False,
                ),
            ]
        )
        assert {"code": 0, "message": ""} == actual_response


@pytest.mark.asyncio
async def test_git_push_fail():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            mock_execute.return_value = maybe_future(
                (1, "output", "Authentication failed")
            )

            # When
            actual_response = await Git().push(
                "test_origin", "HEAD:test_master", "test_curr_path"
            )

            # Then
            mock_execute.assert_called_once_with(
                ["git", "push", "--tags", "test_origin", "HEAD:test_master"],
                cwd="test_curr_path",
                timeout=20,
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
                username=None,
                password=None,
                is_binary=False,
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
            actual_response = await Git().push(
                "test_origin", "HEAD:test_master", "test_curr_path", auth
            )

            # Then
            mock_execute_with_authentication.assert_called_once_with(
                ["git", "push", "--tags", "test_origin", "HEAD:test_master"],
                cwd="test_curr_path",
                timeout=20,
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
                username="asdf",
                password="qwerty",
                is_binary=False,
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
            actual_response = await Git().push(
                ".", "HEAD:test_master", "test_curr_path"
            )

            # Then
            mock_execute.assert_called_once_with(
                ["git", "push", "--tags", ".", "HEAD:test_master"],
                cwd="test_curr_path",
                timeout=20,
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
                username=None,
                password=None,
                is_binary=False,
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
            actual_response = await Git().push(
                ".", "HEAD:test_master", "test_curr_path", auth
            )

            # Then
            mock_execute_with_authentication.assert_called_once_with(
                ["git", "push", "--tags", ".", "HEAD:test_master"],
                cwd="test_curr_path",
                timeout=20,
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
                username="asdf",
                password="qwerty",
                is_binary=False,
            )
            assert {"code": 0, "message": output} == actual_response


@pytest.mark.asyncio
async def test_git_push_with_auth_and_cache_credentials():
    with patch(
        "jupyterlab_git.git.Git.ensure_git_credential_cache_daemon"
    ) as mock_ensure_daemon:
        mock_ensure_daemon.return_value = 0
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            default_config = JupyterLabGit()
            credential_helper = default_config.credential_helper
            test_path = "test_path"
            mock_execute.side_effect = [
                maybe_future((0, "", "")),
                maybe_future((0, "", "")),
                maybe_future((0, "", "")),
            ]

            # When
            auth = {"username": "user", "password": "pass", "cache_credentials": True}
            actual_response = await Git(config=default_config).push(
                ".", "HEAD:test_master", test_path, auth
            )

            # Then
            assert mock_execute.call_count == 3
            mock_execute.assert_has_calls(
                [
                    call(
                        ["git", "config", "--list"],
                        cwd=test_path,
                        timeout=20,
                        env=None,
                        username=None,
                        password=None,
                        is_binary=False,
                    ),
                    call(
                        [
                            "git",
                            "config",
                            "--add",
                            "credential.helper",
                            credential_helper,
                        ],
                        cwd=test_path,
                        timeout=20,
                        env=None,
                        username=None,
                        password=None,
                        is_binary=False,
                    ),
                    call(
                        ["git", "push", "--tags", ".", "HEAD:test_master"],
                        cwd=test_path,
                        timeout=20,
                        env={**os.environ, "GIT_TERMINAL_PROMPT": "1"},
                        username="user",
                        password="pass",
                        is_binary=False,
                    ),
                ]
            )
            mock_ensure_daemon.assert_called_once_with(cwd=test_path, env=None)
            assert {"code": 0, "message": ""} == actual_response


@pytest.mark.asyncio
async def test_git_push_with_auth_and_cache_credentials_and_existing_credential_helper():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        default_config = JupyterLabGit()
        test_path = "test_path"
        mock_execute.side_effect = [
            maybe_future((0, "credential.helper=something", "")),
            maybe_future((0, "", "")),
        ]

        # When
        auth = {"username": "user", "password": "pass", "cache_credentials": True}
        actual_response = await Git(config=default_config).push(
            ".", "HEAD:test_master", test_path, auth
        )

        # Then
        assert mock_execute.call_count == 2
        mock_execute.assert_has_calls(
            [
                call(
                    ["git", "config", "--list"],
                    cwd=test_path,
                    timeout=20,
                    env=None,
                    username=None,
                    password=None,
                    is_binary=False,
                ),
                call(
                    ["git", "push", "--tags", ".", "HEAD:test_master"],
                    cwd=test_path,
                    timeout=20,
                    env={**os.environ, "GIT_TERMINAL_PROMPT": "1"},
                    username="user",
                    password="pass",
                    is_binary=False,
                ),
            ]
        )
        assert {"code": 0, "message": ""} == actual_response


@pytest.mark.asyncio
async def test_git_push_no_tags_success():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            output = "output"
            mock_execute.return_value = maybe_future((0, output, "does not matter"))

            # When
            actual_response = await Git().push(
                ".", "HEAD:test_master", "test_curr_path", tags=False
            )

            # Then
            mock_execute.assert_called_once_with(
                ["git", "push", ".", "HEAD:test_master"],
                cwd="test_curr_path",
                timeout=20,
                env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
                username=None,
                password=None,
                is_binary=False,
            )
            assert {"code": 0, "message": output} == actual_response
