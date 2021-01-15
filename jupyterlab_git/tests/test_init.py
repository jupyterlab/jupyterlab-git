from pathlib import Path
from subprocess import CalledProcessError
from unittest.mock import Mock, call, patch

import pytest
import tornado

from jupyterlab_git import JupyterLabGit
from jupyterlab_git.git import Git

from .testutils import FakeContentManager, maybe_future


@pytest.mark.asyncio
async def test_init():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future((0, "", ""))

        # When
        actual_response = await Git(FakeContentManager(Path("/bin"))).init(
            "test_curr_path"
        )

        mock_execute.assert_called_once_with(
            ["git", "init"], cwd=str(Path("/bin") / "test_curr_path")
        )

        assert {"code": 0, "actions": None} == actual_response


@pytest.mark.asyncio
async def test_init_and_post_init():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.side_effect = [
            maybe_future((0, "", "")),
            maybe_future((0, "hello", "")),
        ]

        # When
        actual_response = await Git(
            FakeContentManager(Path("/bin")),
            JupyterLabGit(actions={"post_init": ['echo "hello"']}),
        ).init("test_curr_path")

        mock_execute.assert_called_with(
            ["echo", "hello"], cwd=str(Path("/bin") / "test_curr_path")
        )

        assert {
            "code": 0,
            "actions": [
                {"cmd": 'echo "hello"', "code": 0, "stderr": "", "stdout": "hello"}
            ],
        } == actual_response


@pytest.mark.asyncio
async def test_init_and_post_init_fail():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.side_effect = [
            maybe_future((0, "", "")),
            maybe_future((1, "", "not_there: command not found")),
        ]

        # When
        actual_response = await Git(
            FakeContentManager(Path("/bin")),
            JupyterLabGit(actions={"post_init": ["not_there arg"]}),
        ).init("test_curr_path")

        mock_execute.assert_called_with(
            ["not_there", "arg"], cwd=str(Path("/bin") / "test_curr_path")
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
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.side_effect = [
            maybe_future((0, "", "")),
            Exception("Not a command!"),
        ]

        # When
        actual_response = await Git(
            FakeContentManager(Path("/bin")),
            JupyterLabGit(actions={"post_init": ["not_there arg"]}),
        ).init("test_curr_path")

        mock_execute.assert_called_with(
            ["not_there", "arg"], cwd=str(Path("/bin") / "test_curr_path")
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
