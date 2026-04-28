from pathlib import Path
from unittest.mock import patch

import pytest

from jupyterlab_git_core.git import Git


@pytest.mark.asyncio
async def test_log_unborn_head_returns_empty_commits():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        mock_execute.side_effect = [
            (
                128,
                "",
                "fatal: your current branch 'main' does not have any commits yet\n",
            ),
            (1, "", ""),
        ]

        expected_response = {"code": 0, "commits": []}

        # When
        actual_response = await Git().log(
            path=str(Path("/bin/test_curr_path")),
            history_count=25,
        )

        # Then
        mock_execute.assert_called_with(
            ["git", "rev-parse", "--verify", "--quiet", "HEAD"],
            cwd=str(Path("/bin") / "test_curr_path"),
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )

        assert expected_response == actual_response


@pytest.mark.asyncio
async def test_log_genuine_failure_is_propagated():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        mock_execute.side_effect = [
            (1, "", "fatal: some other unrelated error\n"),
            (0, "abc123\n", ""),
        ]

        expected_response = {
            "code": 1,
            "command": "git log --pretty=format:%H%n%an%n%ar%n%s%n%P -25",
            "message": "fatal: some other unrelated error\n",
        }

        # When
        actual_response = await Git().log(
            path=str(Path("/bin/test_curr_path")),
            history_count=25,
        )

        # Then
        assert expected_response == actual_response
