from unittest.mock import patch

import pytest

from jupyterlab_git import JupyterLabGit
from jupyterlab_git_core.git import Git


@pytest.mark.asyncio
async def test_init():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = (0, "", "")

        # When
        actual_response = await Git().init("test_curr_path")

        mock_execute.assert_called_once_with(
            ["git", "init"],
            cwd="test_curr_path",
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )

        assert {"code": 0, "actions": None} == actual_response


@pytest.mark.asyncio
async def test_init_and_post_init():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        mock_execute.side_effect = [
            (0, "", ""),
            (0, "hello", ""),
        ]

        # When
        actual_response = await Git(
            JupyterLabGit(actions={"post_init": ['echo "hello"']}),
        ).init("test_curr_path")

        mock_execute.assert_called_with(
            ["echo", "hello"],
            cwd="test_curr_path",
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )

        assert {
            "code": 0,
            "actions": [
                {"cmd": 'echo "hello"', "code": 0, "stderr": "", "stdout": "hello"}
            ],
        } == actual_response


@pytest.mark.asyncio
async def test_init_and_post_init_fail():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        mock_execute.side_effect = [
            (0, "", ""),
            (1, "", "not_there: command not found"),
        ]

        # When
        actual_response = await Git(
            JupyterLabGit(actions={"post_init": ["not_there arg"]}),
        ).init("test_curr_path")

        mock_execute.assert_called_with(
            ["not_there", "arg"],
            cwd="test_curr_path",
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )

        assert {
            "code": 1,
            "message": "",
            "command": "git init",
            "actions": [
                {
                    "stderr": "not_there: command not found",
                    "stdout": "",
                    "code": 1,
                    "cmd": "not_there arg",
                }
            ],
        } == actual_response


@pytest.mark.asyncio
async def test_init_and_post_init_fail_to_run():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        mock_execute.side_effect = [
            (0, "", ""),
            Exception("Not a command!"),
        ]

        # When
        actual_response = await Git(
            JupyterLabGit(actions={"post_init": ["not_there arg"]}),
        ).init("test_curr_path")

        mock_execute.assert_called_with(
            ["not_there", "arg"],
            cwd="test_curr_path",
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )

        assert {
            "code": 1,
            "message": "",
            "command": "git init",
            "actions": [
                {
                    "stderr": "Exception: Not a command!",
                    "stdout": None,
                    "code": 1,
                    "cmd": "not_there arg",
                }
            ],
        } == actual_response
